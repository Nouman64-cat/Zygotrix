"""Core package initialization for zygotrix_engine."""

from .traits import Trait, EYE_COLOR, BLOOD_TYPE, HAIR_COLOR
from .mendelian import MendelianCalculator
from .polygenic import PolygenicCalculator
from .simulator import Simulator

__all__ = [
    "Trait",
    "EYE_COLOR",
    "BLOOD_TYPE",
    "HAIR_COLOR",
    "MendelianCalculator",
    "PolygenicCalculator",
    "Simulator",
]
