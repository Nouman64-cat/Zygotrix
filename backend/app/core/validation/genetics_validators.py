"""
Genetics Validation Handlers.

Custom validators for genetics and simulation operations.
"""
from typing import Dict, Any, List
from ...core.exceptions.validation import ValidationError
from .chain import ValidationHandler


class GenotypeFormatValidator(ValidationHandler):
    """Validate genotype format for Mendelian simulations."""

    VALID_ALLELES = set("ATCG")  # For simple genetic markers
    MAX_GENOTYPE_LENGTH = 100  # Maximum alleles in a genotype string

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate genotype format."""
        # Check parent1_genotypes
        parent1 = data.get("parent1_genotypes")
        if parent1:
            self._validate_genotype_dict(parent1, "parent1_genotypes")

        # Check parent2_genotypes
        parent2 = data.get("parent2_genotypes")
        if parent2:
            self._validate_genotype_dict(parent2, "parent2_genotypes")

        return data

    def _validate_genotype_dict(self, genotypes: Any, field_name: str):
        """Validate a genotypes dictionary."""
        if not isinstance(genotypes, dict):
            raise ValidationError(f"{field_name} must be a dictionary")

        if len(genotypes) == 0:
            raise ValidationError(f"{field_name} cannot be empty")

        if len(genotypes) > 50:
            raise ValidationError(
                f"{field_name} cannot contain more than 50 traits"
            )

        for trait_key, genotype in genotypes.items():
            if not isinstance(trait_key, str):
                raise ValidationError(
                    f"Trait keys in {field_name} must be strings"
                )

            if not isinstance(genotype, str):
                raise ValidationError(
                    f"Genotype for trait '{trait_key}' must be a string"
                )

            # Basic format validation (genotypes are typically 2 characters for diploid organisms)
            genotype_clean = genotype.strip().upper()

            if len(genotype_clean) == 0:
                raise ValidationError(
                    f"Genotype for trait '{trait_key}' cannot be empty"
                )

            if len(genotype_clean) > self.MAX_GENOTYPE_LENGTH:
                raise ValidationError(
                    f"Genotype for trait '{trait_key}' is too long"
                )


class AlleleFrequencyValidator(ValidationHandler):
    """Validate allele frequency values."""

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate allele frequencies."""
        frequency = data.get("allele_frequency") or data.get("frequency")

        if frequency is not None:
            if not isinstance(frequency, (int, float)):
                raise ValidationError("Allele frequency must be a number")

            if frequency < 0.0 or frequency > 1.0:
                raise ValidationError(
                    "Allele frequency must be between 0.0 and 1.0"
                )

        return data


class PopulationSizeValidator(ValidationHandler):
    """Validate population size for simulations."""

    MIN_POPULATION = 1
    MAX_POPULATION = 1000000  # 1 million individuals

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate population size."""
        population_size = data.get("population_size")

        if population_size is not None:
            if not isinstance(population_size, int):
                raise ValidationError("Population size must be an integer")

            if population_size < self.MIN_POPULATION:
                raise ValidationError(
                    f"Population size must be at least {self.MIN_POPULATION}"
                )

            if population_size > self.MAX_POPULATION:
                raise ValidationError(
                    f"Population size cannot exceed {self.MAX_POPULATION:,}"
                )

        return data


class TraitFilterValidator(ValidationHandler):
    """Validate trait filter lists."""

    MAX_TRAITS = 100

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate trait filter."""
        trait_filter = data.get("trait_filter")

        if trait_filter is not None:
            if not isinstance(trait_filter, list):
                raise ValidationError("trait_filter must be a list")

            if len(trait_filter) > self.MAX_TRAITS:
                raise ValidationError(
                    f"Cannot filter by more than {self.MAX_TRAITS} traits"
                )

            for idx, trait in enumerate(trait_filter):
                if not isinstance(trait, str):
                    raise ValidationError(
                        f"Trait filter item {idx + 1} must be a string"
                    )

                if len(trait) == 0:
                    raise ValidationError(
                        f"Trait filter item {idx + 1} cannot be empty"
                    )

                if len(trait) > 100:
                    raise ValidationError(
                        f"Trait filter item {idx + 1} is too long"
                    )

        return data


class GenerationsValidator(ValidationHandler):
    """Validate number of generations for simulation."""

    MIN_GENERATIONS = 1
    MAX_GENERATIONS = 1000

    def validate(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate generations parameter."""
        generations = data.get("generations")

        if generations is not None:
            if not isinstance(generations, int):
                raise ValidationError("Generations must be an integer")

            if generations < self.MIN_GENERATIONS:
                raise ValidationError(
                    f"Generations must be at least {self.MIN_GENERATIONS}"
                )

            if generations > self.MAX_GENERATIONS:
                raise ValidationError(
                    f"Generations cannot exceed {self.MAX_GENERATIONS:,}"
                )

        return data
