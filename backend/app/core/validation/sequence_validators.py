"""
Sequence Validation Handlers.

Custom validators for DNA, RNA, and protein sequence operations.
"""
from typing import Dict, Any
from ...core.exceptions.validation import ValidationError
from .chain import ValidationHandler


class SequenceLengthValidator(ValidationHandler):
    """Validate sequence length to prevent abuse."""

    MAX_LENGTH = 1000000000  # 1 billion bp (very large, adjustable)
    MIN_LENGTH = 1

    def __init__(self, min_length: int = MIN_LENGTH, max_length: int = MAX_LENGTH):
        """
        Initialize sequence length validator.

        Args:
            min_length: Minimum allowed sequence length
            max_length: Maximum allowed sequence length
        """
        super().__init__()
        self.min_length = min_length
        self.max_length = max_length

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate sequence length."""
        length = data.get("length")

        if length is not None:
            if not isinstance(length, int):
                raise ValidationError("Sequence length must be an integer")

            if length < self.min_length:
                raise ValidationError(
                    f"Sequence length must be at least {self.min_length}"
                )

            if length > self.max_length:
                raise ValidationError(
                    f"Sequence length cannot exceed {self.max_length:,} bp"
                )

        return data


class GCContentValidator(ValidationHandler):
    """Validate GC content percentage."""

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate GC content."""
        gc_content = data.get("gc_content")

        if gc_content is not None:
            if not isinstance(gc_content, (int, float)):
                raise ValidationError("GC content must be a number")

            if gc_content < 0.0 or gc_content > 1.0:
                raise ValidationError(
                    "GC content must be between 0.0 and 1.0 (representing 0% to 100%)"
                )

        return data


class DNASequenceValidator(ValidationHandler):
    """Validate DNA sequence format."""

    VALID_NUCLEOTIDES = set("ATCG")
    MAX_SEQUENCE_LENGTH = 100000  # 100kb for direct input validation

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate DNA sequence."""
        dna_sequence = data.get("dna_sequence")

        if dna_sequence is None:
            return data

        if not isinstance(dna_sequence, str):
            raise ValidationError("DNA sequence must be a string")

        # Remove whitespace and convert to uppercase
        dna_clean = "".join(dna_sequence.split()).upper()
        data["dna_sequence"] = dna_clean

        if len(dna_clean) == 0:
            raise ValidationError("DNA sequence cannot be empty")

        if len(dna_clean) > self.MAX_SEQUENCE_LENGTH:
            raise ValidationError(
                f"DNA sequence too long. Maximum {self.MAX_SEQUENCE_LENGTH:,} nucleotides for direct input"
            )

        # Validate nucleotides
        invalid_chars = set(dna_clean) - self.VALID_NUCLEOTIDES
        if invalid_chars:
            raise ValidationError(
                f"Invalid DNA nucleotides: {', '.join(sorted(invalid_chars))}. "
                f"Only A, T, C, G are allowed"
            )

        return data


class RNASequenceValidator(ValidationHandler):
    """Validate RNA sequence format."""

    VALID_NUCLEOTIDES = set("AUCG")
    MAX_SEQUENCE_LENGTH = 100000  # 100kb for direct input validation

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate RNA sequence."""
        rna_sequence = data.get("rna_sequence")

        if rna_sequence is None:
            return data

        if not isinstance(rna_sequence, str):
            raise ValidationError("RNA sequence must be a string")

        # Remove whitespace and convert to uppercase
        rna_clean = "".join(rna_sequence.split()).upper()
        data["rna_sequence"] = rna_clean

        if len(rna_clean) == 0:
            raise ValidationError("RNA sequence cannot be empty")

        if len(rna_clean) > self.MAX_SEQUENCE_LENGTH:
            raise ValidationError(
                f"RNA sequence too long. Maximum {self.MAX_SEQUENCE_LENGTH:,} nucleotides for direct input"
            )

        # Validate nucleotides
        invalid_chars = set(rna_clean) - self.VALID_NUCLEOTIDES
        if invalid_chars:
            raise ValidationError(
                f"Invalid RNA nucleotides: {', '.join(sorted(invalid_chars))}. "
                f"Only A, U, C, G are allowed"
            )

        return data


class ProteinSequenceValidator(ValidationHandler):
    """Validate protein sequence format."""

    # Standard 20 amino acids (one-letter codes)
    VALID_AMINO_ACIDS = set("ACDEFGHIKLMNPQRSTVWY")
    # Including ambiguous codes
    VALID_WITH_AMBIGUOUS = VALID_AMINO_ACIDS | set("XBZJ*")
    MAX_SEQUENCE_LENGTH = 50000  # 50k amino acids

    def __init__(self, allow_ambiguous: bool = True):
        """
        Initialize protein sequence validator.

        Args:
            allow_ambiguous: Allow ambiguous amino acid codes (X, B, Z, J, *)
        """
        super().__init__()
        self.allow_ambiguous = allow_ambiguous
        self.valid_chars = (
            self.VALID_WITH_AMBIGUOUS if allow_ambiguous else self.VALID_AMINO_ACIDS
        )

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate protein sequence."""
        protein_sequence = data.get("protein_sequence")

        if protein_sequence is None:
            return data

        if not isinstance(protein_sequence, str):
            raise ValidationError("Protein sequence must be a string")

        # Remove whitespace and convert to uppercase
        protein_clean = "".join(protein_sequence.split()).upper()
        data["protein_sequence"] = protein_clean

        if len(protein_clean) == 0:
            raise ValidationError("Protein sequence cannot be empty")

        if len(protein_clean) > self.MAX_SEQUENCE_LENGTH:
            raise ValidationError(
                f"Protein sequence too long. Maximum {self.MAX_SEQUENCE_LENGTH:,} amino acids"
            )

        # Validate amino acids
        invalid_chars = set(protein_clean) - self.valid_chars
        if invalid_chars:
            raise ValidationError(
                f"Invalid amino acid codes: {', '.join(sorted(invalid_chars))}. "
                f"Only standard amino acid codes are allowed"
            )

        return data


class SeedValidator(ValidationHandler):
    """Validate random seed for sequence generation."""

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate seed parameter."""
        seed = data.get("seed")

        if seed is not None:
            if not isinstance(seed, int):
                raise ValidationError("Seed must be an integer")

            # Ensure seed is within reasonable bounds (32-bit integer)
            if seed < -(2**31) or seed > (2**31 - 1):
                raise ValidationError("Seed must be a valid 32-bit integer")

        return data
