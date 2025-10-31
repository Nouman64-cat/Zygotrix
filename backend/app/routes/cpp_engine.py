from __future__ import annotations

from fastapi import APIRouter

from ..schema.cpp_engine import GeneticCrossRequest, GeneticCrossResponse
from ..services.cpp_engine import run_cpp_cross

router = APIRouter(prefix="/api/cpp", tags=["C++ Engine"])


@router.post("/cross", response_model=GeneticCrossResponse)
def compute_cpp_cross(request: GeneticCrossRequest) -> GeneticCrossResponse:
    return run_cpp_cross(request)
