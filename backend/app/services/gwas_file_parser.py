"""
GWAS File Format Parsers

Parsers for common genomic file formats:
- VCF (Variant Call Format) - text and gzipped
- PLINK binary format (.bed/.bim/.fam)
- CSV phenotype files

Each parser extracts:
- SNPs: {rsid, chromosome, position, ref_allele, alt_allele, genotypes}
- Samples: {sample_id, phenotype, covariates}
- Metadata: {sample_count, snp_count, file_format, etc.}
"""

import csv
import gzip
import struct
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple, BinaryIO
from datetime import datetime
import re


class VcfParser:
    """Parser for VCF (Variant Call Format) files."""

    def __init__(self, file_path: Path):
        """
        Initialize VCF parser.

        Args:
            file_path: Path to .vcf or .vcf.gz file
        """
        self.file_path = file_path
        self.is_gzipped = str(file_path).endswith(".gz")

    def parse(self, max_snps: Optional[int] = None) -> Dict[str, Any]:
        """
        Parse VCF file and extract SNPs and samples.

        Args:
            max_snps: Maximum number of SNPs to parse (None = all)

        Returns:
            Dictionary with keys:
                - snps: List[Dict] with rsid, chr, pos, ref, alt, genotypes
                - samples: List[str] sample IDs
                - metadata: Dict with file info
        """
        snps = []
        sample_ids = []
        metadata = {
            "file_format": "VCF",
            "is_gzipped": self.is_gzipped,
            "parse_timestamp": datetime.utcnow().isoformat(),
        }

        open_func = gzip.open if self.is_gzipped else open
        mode = "rt" if self.is_gzipped else "r"

        with open_func(self.file_path, mode) as f:
            for line in f:
                line = line.strip()

                # Skip empty lines
                if not line:
                    continue

                # Parse header lines
                if line.startswith("##"):
                    # Extract metadata
                    if line.startswith("##fileformat="):
                        metadata["vcf_version"] = line.split("=")[1]
                    elif line.startswith("##reference="):
                        metadata["reference"] = line.split("=")[1]
                    continue

                # Parse column header (#CHROM line)
                if line.startswith("#CHROM"):
                    columns = line.split("\t")
                    # Fallback to whitespace splitting if tabs didn't work
                    if len(columns) <= 1:
                        columns = line.split()
                        
                    # Sample IDs start from column 9 onwards
                    if len(columns) > 9:
                        sample_ids = columns[9:]
                    metadata["sample_count"] = len(sample_ids)
                    continue

                # Parse variant lines
                fields = line.split("\t")
                if len(fields) < 8:
                    # Fallback to whitespace splitting
                    fields = line.split()
                    if len(fields) < 8:
                        continue  # Invalid line

                chrom = fields[0]
                pos = int(fields[1])
                rsid = fields[2] if fields[2] != "." else f"SNP_{chrom}_{pos}"
                ref = fields[3]
                alt = fields[4]
                # qual = fields[5]
                # filter_status = fields[6]
                # info = fields[7]
                format_field = fields[8] if len(fields) > 8 else ""
                genotype_fields = fields[9:] if len(fields) > 9 else []

                # Parse genotypes
                genotypes = []
                if genotype_fields and format_field:
                    gt_index = self._get_gt_index(format_field)
                    for gt_field in genotype_fields:
                        gt = self._parse_genotype(gt_field, gt_index)
                        genotypes.append(gt)

                # Extract chromosome number (remove "chr" prefix if present)
                chr_num = self._parse_chromosome(chrom)

                snp = {
                    "rsid": rsid,
                    "chromosome": chr_num,
                    "position": pos,
                    "ref_allele": ref,
                    "alt_allele": alt.split(",")[0],  # Take first ALT allele
                    "genotypes": genotypes,
                }

                snps.append(snp)

                # Check max SNPs limit
                if max_snps is not None and len(snps) >= max_snps:
                    break

        metadata["snp_count"] = len(snps)

        return {
            "snps": snps,
            "samples": sample_ids,
            "metadata": metadata,
        }

    def _get_gt_index(self, format_field: str) -> int:
        """Get index of GT (genotype) field in FORMAT column."""
        format_parts = format_field.split(":")
        try:
            return format_parts.index("GT")
        except ValueError:
            return 0  # Default to first field

    def _parse_genotype(self, gt_field: str, gt_index: int) -> int:
        """
        Parse genotype field to dosage (0, 1, 2).

        Args:
            gt_field: Genotype field like "0/0", "0|1", "1/1"
            gt_index: Index of GT in format

        Returns:
            Dosage: 0 (ref/ref), 1 (ref/alt), 2 (alt/alt), -1 (missing)
        """
        parts = gt_field.split(":")
        if gt_index >= len(parts):
            return -1  # Missing

        gt = parts[gt_index]

        # Handle missing genotypes
        if gt in [".", "./.", ".|."]:
            return -1

        # Split by / or |
        alleles = re.split(r"[/|]", gt)
        if len(alleles) != 2:
            return -1

        try:
            a1 = int(alleles[0])
            a2 = int(alleles[1])
            return a1 + a2  # Dosage: 0, 1, or 2
        except (ValueError, TypeError):
            return -1

    def _parse_chromosome(self, chrom: str) -> int:
        """
        Parse chromosome string to integer.

        Examples: "chr1" -> 1, "1" -> 1, "chrX" -> 23, "X" -> 23
        """
        chrom = chrom.replace("chr", "").replace("Chr", "").upper()

        # Handle X, Y, MT
        if chrom == "X":
            return 23
        elif chrom == "Y":
            return 24
        elif chrom in ["M", "MT"]:
            return 25

        try:
            return int(chrom)
        except ValueError:
            return 0  # Unknown chromosome


class PlinkParser:
    """Parser for PLINK binary format (.bed/.bim/.fam)."""

    def __init__(self, bed_path: Path):
        """
        Initialize PLINK parser.

        Args:
            bed_path: Path to .bed file (expects .bim and .fam in same dir)
        """
        self.bed_path = bed_path
        self.bim_path = bed_path.with_suffix(".bim")
        self.fam_path = bed_path.with_suffix(".fam")

    def parse(self, max_snps: Optional[int] = None) -> Dict[str, Any]:
        """
        Parse PLINK binary files.

        Returns:
            Dictionary with keys:
                - snps: List[Dict] with rsid, chr, pos, ref, alt, genotypes
                - samples: List[Dict] with sample_id, family_id, phenotype
                - metadata: Dict with file info
        """
        # Check all files exist
        if not self.bed_path.exists():
            raise FileNotFoundError(f"BED file not found: {self.bed_path}")
        if not self.bim_path.exists():
            raise FileNotFoundError(f"BIM file not found: {self.bim_path}")
        if not self.fam_path.exists():
            raise FileNotFoundError(f"FAM file not found: {self.fam_path}")

        # Parse FAM file (samples)
        samples = self._parse_fam()

        # Parse BIM file (SNP info)
        snp_info = self._parse_bim(max_snps)

        # Parse BED file (genotypes)
        genotypes = self._parse_bed(len(samples), len(snp_info))

        # Combine SNP info with genotypes
        snps = []
        for i, info in enumerate(snp_info):
            snp = {
                "rsid": info["rsid"],
                "chromosome": info["chromosome"],
                "position": info["position"],
                "ref_allele": info["ref_allele"],
                "alt_allele": info["alt_allele"],
                "genotypes": genotypes[i] if i < len(genotypes) else [],
            }
            snps.append(snp)

        metadata = {
            "file_format": "PLINK",
            "sample_count": len(samples),
            "snp_count": len(snps),
            "parse_timestamp": datetime.utcnow().isoformat(),
        }

        return {
            "snps": snps,
            "samples": samples,
            "metadata": metadata,
        }

    def _parse_fam(self) -> List[Dict[str, Any]]:
        """
        Parse .fam file (sample information).

        FAM format (space/tab-delimited):
        Family_ID Individual_ID Paternal_ID Maternal_ID Sex Phenotype
        """
        samples = []
        with open(self.fam_path, "r") as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) < 6:
                    continue

                sample = {
                    "family_id": parts[0],
                    "sample_id": parts[1],
                    "paternal_id": parts[2],
                    "maternal_id": parts[3],
                    "sex": int(parts[4]) if parts[4].isdigit() else 0,
                    "phenotype": float(parts[5]) if parts[5] not in ["-9", "NA"] else None,
                }
                samples.append(sample)

        return samples

    def _parse_bim(self, max_snps: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Parse .bim file (SNP information).

        BIM format (tab-delimited):
        Chromosome SNP_ID Genetic_Distance Position Allele1 Allele2
        """
        snp_info = []
        with open(self.bim_path, "r") as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) < 6:
                    continue

                snp = {
                    "chromosome": int(parts[0]) if parts[0].isdigit() else 0,
                    "rsid": parts[1],
                    "genetic_distance": float(parts[2]) if parts[2] != "0" else 0.0,
                    "position": int(parts[3]),
                    "ref_allele": parts[4],  # Allele1
                    "alt_allele": parts[5],  # Allele2
                }
                snp_info.append(snp)

                if max_snps is not None and len(snp_info) >= max_snps:
                    break

        return snp_info

    def _parse_bed(self, n_samples: int, n_snps: int) -> List[List[int]]:
        """
        Parse .bed file (binary genotype data).

        BED format is SNP-major by default:
        - First 3 bytes: magic numbers (0x6c, 0x1b, 0x01)
        - Each SNP has ceil(n_samples/4) bytes
        - Each byte encodes 4 genotypes (2 bits per genotype)

        Genotype encoding:
        00 -> Homozygous reference (0)
        01 -> Missing (-1)
        10 -> Heterozygous (1)
        11 -> Homozygous alternate (2)
        """
        genotypes = []

        with open(self.bed_path, "rb") as f:
            # Read and validate magic bytes
            magic = f.read(3)
            if len(magic) != 3:
                raise ValueError("Invalid BED file: too short")

            if magic[0] != 0x6C or magic[1] != 0x1B:
                raise ValueError("Invalid BED file: bad magic number")

            # Check mode (SNP-major vs individual-major)
            if magic[2] != 0x01:
                raise ValueError("Only SNP-major mode is supported")

            # Number of bytes per SNP
            bytes_per_snp = (n_samples + 3) // 4

            # Read genotypes for each SNP
            for snp_idx in range(n_snps):
                snp_bytes = f.read(bytes_per_snp)
                if len(snp_bytes) != bytes_per_snp:
                    break  # End of file

                snp_genotypes = self._decode_bed_genotypes(snp_bytes, n_samples)
                genotypes.append(snp_genotypes)

        return genotypes

    def _decode_bed_genotypes(self, bed_bytes: bytes, n_samples: int) -> List[int]:
        """
        Decode genotypes from BED file bytes.

        Each byte contains 4 genotypes (2 bits each).
        """
        genotypes = []

        for byte_val in bed_bytes:
            # Extract 4 genotypes from this byte
            for shift in [0, 2, 4, 6]:
                if len(genotypes) >= n_samples:
                    break

                # Extract 2 bits
                geno_code = (byte_val >> shift) & 0b11

                # Decode to dosage
                if geno_code == 0b00:
                    genotypes.append(0)  # Homozygous ref
                elif geno_code == 0b11:
                    genotypes.append(2)  # Homozygous alt
                elif geno_code == 0b10:
                    genotypes.append(1)  # Heterozygous
                else:  # 0b01
                    genotypes.append(-1)  # Missing

        return genotypes[:n_samples]


class PhenotypeParser:
    """Parser for phenotype CSV files."""

    def __init__(self, file_path: Path):
        """
        Initialize phenotype parser.

        Args:
            file_path: Path to CSV file
        """
        self.file_path = file_path

    def parse(self) -> Dict[str, Any]:
        """
        Parse phenotype CSV file.

        Expected format:
        sample_id,phenotype,covariate1,covariate2,...

        Returns:
            Dictionary with keys:
                - samples: List[Dict] with sample_id, phenotype, covariates
                - phenotype_columns: List[str] available phenotype names
                - covariate_columns: List[str] available covariate names
                - metadata: Dict with file info
        """
        samples = []
        phenotype_columns = []
        covariate_columns = []

        with open(self.file_path, "r") as f:
            reader = csv.DictReader(f)

            # Get column names
            if reader.fieldnames:
                all_columns = list(reader.fieldnames)

                # First column is assumed to be sample ID
                # Remaining columns are phenotypes or covariates
                if len(all_columns) > 1:
                    phenotype_columns = [col for col in all_columns[1:] if not col.startswith("cov_")]
                    covariate_columns = [col for col in all_columns[1:] if col.startswith("cov_")]

            # Parse rows
            for row in reader:
                if not row:
                    continue

                sample_id = row.get("sample_id") or row.get("IID") or row.get(all_columns[0])
                if not sample_id:
                    continue

                sample = {
                    "sample_id": sample_id,
                    "phenotypes": {},
                    "covariates": {},
                }

                # Extract phenotypes
                for col in phenotype_columns:
                    value = row.get(col)
                    if value is not None and value != "":
                        try:
                            sample["phenotypes"][col] = float(value)
                        except ValueError:
                            sample["phenotypes"][col] = value

                # Extract covariates
                for col in covariate_columns:
                    value = row.get(col)
                    if value is not None and value != "":
                        try:
                            sample["covariates"][col] = float(value)
                        except ValueError:
                            sample["covariates"][col] = value

                samples.append(sample)

        metadata = {
            "file_format": "CSV",
            "sample_count": len(samples),
            "phenotype_count": len(phenotype_columns),
            "covariate_count": len(covariate_columns),
            "parse_timestamp": datetime.utcnow().isoformat(),
        }

        return {
            "samples": samples,
            "phenotype_columns": phenotype_columns,
            "covariate_columns": covariate_columns,
            "metadata": metadata,
        }


class CustomJsonParser:
    """Parser for custom JSON format datasets."""

    def __init__(self, file_path: Path):
        """
        Initialize JSON parser.

        Args:
            file_path: Path to JSON file
        """
        self.file_path = file_path

    def parse(self) -> Dict[str, Any]:
        """
        Parse custom JSON format.

        Expected format:
        {
            "snps": [{rsid, chromosome, position, ref_allele, alt_allele, genotypes}],
            "samples": [{sample_id, phenotype, covariates}],
            "metadata": {...}
        }

        Returns:
            Dictionary with parsed data
        """
        import json

        with open(self.file_path, "r") as f:
            data = json.load(f)

        # Validate required keys
        if "snps" not in data or "samples" not in data:
            raise ValueError("JSON must contain 'snps' and 'samples' keys")

        # Ensure metadata exists
        if "metadata" not in data:
            data["metadata"] = {}

        data["metadata"]["file_format"] = "JSON"
        data["metadata"]["parse_timestamp"] = datetime.utcnow().isoformat()
        data["metadata"]["snp_count"] = len(data["snps"])
        data["metadata"]["sample_count"] = len(data["samples"])

        return data
