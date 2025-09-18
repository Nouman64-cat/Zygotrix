import pytest

from zygotrix_engine.mendelian import MendelianCalculator
from zygotrix_engine.traits import BLOOD_TYPE, EYE_COLOR


@pytest.fixture()
def mendelian() -> MendelianCalculator:
    return MendelianCalculator()


def test_eye_color_mendelian_probabilities(mendelian: MendelianCalculator) -> None:
    probabilities = mendelian.calculate_offspring_probabilities("Bb", "bb", EYE_COLOR)
    assert pytest.approx(probabilities["Bb"], rel=1e-6) == 0.5
    assert pytest.approx(probabilities["bb"], rel=1e-6) == 0.5
    phenotype_probs = EYE_COLOR.phenotype_distribution(probabilities)
    assert pytest.approx(phenotype_probs["Brown"], rel=1e-6) == 0.5
    assert pytest.approx(phenotype_probs["Blue"], rel=1e-6) == 0.5


def test_blood_type_distribution(mendelian: MendelianCalculator) -> None:
    probabilities = mendelian.calculate_offspring_probabilities("AO", "BO", BLOOD_TYPE)
    expected_genotypes = {"AB", "AO", "BO", "OO"}
    assert set(probabilities.keys()) == expected_genotypes
    for genotype in expected_genotypes:
        assert pytest.approx(probabilities[genotype], rel=1e-6) == 0.25
    phenotype_probs = BLOOD_TYPE.phenotype_distribution(probabilities)
    expected_phenotypes = {"A", "B", "AB", "O"}
    assert set(phenotype_probs.keys()) == expected_phenotypes
    for phenotype in expected_phenotypes:
        assert pytest.approx(phenotype_probs[phenotype], rel=1e-6) == 0.25
