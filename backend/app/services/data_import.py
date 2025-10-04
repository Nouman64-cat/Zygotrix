from __future__ import annotations

import csv
import gzip
import io
import os
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from fastapi import HTTPException

from ..schema.data_import import MappedTraitResult, NormalizedCall, VCFParseResponse

SUPPORTED_SUFFIXES = (".vcf", ".vcf.gz", ".vcf.bgz", ".csv", ".tsv")


@dataclass
class MarkerMapping:
    trait: str
    genotype_map: Dict[str, Dict[str, Optional[str]]]
    notes: Dict[str, str]


MARKER_MAPPINGS: Dict[str, MarkerMapping] = {
    "rs8176719": MarkerMapping(
        trait="abo_blood_group",
        genotype_map={
            "0/0": {"genotype": "AA"},
            "0/1": {"genotype": "AO"},
            "1/1": {"genotype": "OO"},
        },
        notes={
            "0/0": "c.261delG absent",
            "0/1": "heterozygous deletion (likely blood group O carrier)",
            "1/1": "homozygous deletion consistent with blood group O",
        },
    ),
    "rs602338": MarkerMapping(
        trait="abo_blood_group",
        genotype_map={
            "0/0": {"genotype": "BB"},
            "0/1": {"genotype": "BO"},
            "1/1": {"genotype": "OO"},
        },
        notes={
            "0/0": "B allele duplication",
            "0/1": "Likely B carrier",
            "1/1": "No B allele detected",
        },
    ),
    "rs676785": MarkerMapping(
        trait="rh_factor",
        genotype_map={
            "0/0": {"genotype": "DD"},
            "0/1": {"genotype": "Dd"},
            "1/1": {"genotype": "dd"},
        },
        notes={
            "0/0": "Strong Rh+ signal",
            "0/1": "Heterozygous Rh+",
            "1/1": "Homozygous Rh-",
        },
    ),
}


def _normalize_genotype(raw: str) -> str:
    if raw is None:
        return ""
    genotype = raw.replace("|", "/").strip()
    if genotype in {"0", "1"}:
        return f"{genotype}/{genotype}"
    if "/" not in genotype:
        if len(genotype) == 2:
            return f"{genotype[0]}/{genotype[1]}"
        return genotype
    return genotype


def _parse_vcf_content(content: bytes) -> Tuple[List[NormalizedCall], List[str], List[str]]:
    normalized: List[NormalizedCall] = []
    warnings: List[str] = []
    unmapped: List[str] = []

    stream = io.StringIO(content.decode("utf-8", errors="ignore"))
    sample_column_index: Optional[int] = None

    for line in stream:
        if line.startswith("##"):
            continue
        if line.startswith("#CHROM"):
            header_parts = line.strip().split("\t")
            if len(header_parts) > 9:
                sample_column_index = 9  # ignore sample identifiers
            continue
        parts = line.strip().split("\t")
        if len(parts) < 8:
            continue

        chrom, pos, rsid, ref, alt = parts[0], parts[1], parts[2], parts[3], parts[4]
        if not rsid or rsid == ".":
            rsid = f"{chrom}:{pos}"
        genotype_field = parts[8] if len(parts) > 8 else "GT"
        sample_value = parts[9] if len(parts) > 9 else "0/0"
        genotype_tokens = sample_value.split(":")[0]
        genotype = _normalize_genotype(genotype_tokens)

        dosage = None
        if genotype in {"0/0", "0/1", "1/0", "1/1"}:
            dosage = genotype.count("1")

        normalized.append(
            NormalizedCall(
                rsid=rsid,
                genotype=genotype,
                reference=ref,
                alternate=alt,
                dosage=float(dosage) if dosage is not None else None,
            )
        )

        if rsid not in MARKER_MAPPINGS:
            unmapped.append(rsid)

    if not normalized:
        warnings.append("No variant records found in VCF file.")

    return normalized, unmapped, warnings


def _parse_csv_content(content: bytes) -> Tuple[List[NormalizedCall], List[str], List[str]]:
    normalized: List[NormalizedCall] = []
    warnings: List[str] = []
    unmapped: List[str] = []

    text_stream = io.StringIO(content.decode("utf-8", errors="ignore"))
    sample = text_stream.read(2048)
    text_stream.seek(0)

    delimiter = ","
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",\t;|")
        delimiter = dialect.delimiter
    except csv.Error:
        if "\t" in sample:
            delimiter = "\t"

    reader = csv.DictReader(text_stream, delimiter=delimiter)
    if not reader.fieldnames:
        raise HTTPException(status_code=422, detail="CSV file must include a header row.")

    rsid_field = None
    genotype_field = None
    dosage_field = None

    fields_lower = {name.lower(): name for name in reader.fieldnames}
    for candidate in ("rsid", "variant", "marker", "snp", "id", "snp_id"):
        if candidate in fields_lower:
            rsid_field = fields_lower[candidate]
            break
    if "genotype" in fields_lower:
        genotype_field = fields_lower["genotype"]
    if "dosage" in fields_lower:
        dosage_field = fields_lower["dosage"]

    if rsid_field is None:
        # fallback: assume first column is the marker id
        rsid_field = reader.fieldnames[0]

    for row in reader:
        rsid = row.get(rsid_field, "").strip()
        if not rsid:
            continue
        genotype_value = row.get(genotype_field, "") if genotype_field else ""
        genotype = _normalize_genotype(genotype_value)
        dosage_value = row.get(dosage_field) if dosage_field else None
        dosage = None
        if dosage_value not in (None, ""):
            try:
                dosage = float(dosage_value)
            except ValueError:
                warnings.append(f"Invalid dosage value '{dosage_value}' for {rsid}.")
        elif genotype:
            dosage = genotype.count("1") if genotype in {"0/0", "0/1", "1/0", "1/1"} else None

        normalized.append(
            NormalizedCall(
                rsid=rsid,
                genotype=genotype if genotype else None,
                reference=None,
                alternate=None,
                dosage=dosage,
            )
        )
        if rsid not in MARKER_MAPPINGS:
            unmapped.append(rsid)

    if not normalized:
        warnings.append("No rows parsed from CSV file.")

    return normalized, unmapped, warnings


def _map_traits(calls: List[NormalizedCall]) -> Dict[str, MappedTraitResult]:
    results: Dict[str, MappedTraitResult] = {}

    for call in calls:
        mapping = MARKER_MAPPINGS.get(call.rsid)
        if not mapping:
            continue
        genotype_key = call.genotype or ""
        entry = mapping.genotype_map.get(genotype_key)
        if not entry:
            continue
        trait_entry = results.setdefault(
            mapping.trait,
            MappedTraitResult(trait_key=mapping.trait),
        )
        # Fill fields explicitly to avoid mypy confusion
        trait_entry.genotype = entry.get("genotype") or trait_entry.genotype
        trait_entry.confidence = entry.get("confidence", 0.7)
        sources = set(trait_entry.sources or [])
        sources.add(call.rsid)
        trait_entry.sources = sorted(sources)
        note = mapping.notes.get(genotype_key)
        if note:
            trait_entry.notes = note

    # ensure dataclass attribute trait_key not set? Actually MappedTraitResult has no trait_key field
    return results


def _persist_file(user_id: str, filename: str, content: bytes) -> str:
    safe_user = user_id or "anonymous"
    base = Path("/tmp") / "zygotrix" / safe_user
    base.mkdir(parents=True, exist_ok=True)
    unique_name = f"{uuid.uuid4().hex}_{os.path.basename(filename)}"
    target = base / unique_name
    with target.open("wb") as file_handle:
        file_handle.write(content)
    return str(target)


def process_variant_payload(
    *,
    user_id: str,
    filename: str,
    content: bytes,
    persist: bool,
) -> VCFParseResponse:
    lower_name = (filename or "").lower()
    if not lower_name.endswith(SUPPORTED_SUFFIXES):
        raise HTTPException(
            status_code=422,
            detail="Unsupported file type. Provide a VCF/VCF.GZ/VCF.BGZ or CSV/TSV file.",
        )

    processed_content = content
    try:
        if lower_name.endswith((".vcf.gz", ".vcf.bgz")):
            processed_content = gzip.decompress(content)
        elif content.startswith(b"\x1f\x8b"):
            # fallback for gzipped uploads without extension
            processed_content = gzip.decompress(content)
    except OSError as exc:
        raise HTTPException(
            status_code=422,
            detail="Unable to decompress gzipped VCF file. Ensure the archive is valid.",
        ) from exc

    if lower_name.endswith((".vcf", ".vcf.gz", ".vcf.bgz")) or processed_content.lstrip().startswith(
        b"##fileformat=VCF"
    ):
        normalized, unmapped, warnings = _parse_vcf_content(processed_content)
    else:
        normalized, unmapped, warnings = _parse_csv_content(processed_content)

    mapped_traits = _map_traits(normalized)

    persisted_path = None
    if persist:
        persisted_path = _persist_file(user_id=user_id, filename=filename, content=content)

    return VCFParseResponse(
        normalized_calls=normalized,
        mapped_traits=mapped_traits,
        unmapped_variants=unmapped,
        warnings=warnings,
        persisted_path=persisted_path,
    )
