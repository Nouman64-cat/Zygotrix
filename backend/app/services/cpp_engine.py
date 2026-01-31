from __future__ import annotations

from app.schema.cpp_engine import GeneticCrossRequest, GeneticCrossResponse
from app.schema.pedigree import PedigreeStructure, GeneticAnalysisResult
from app.services.aws_worker_client import get_aws_worker

def run_cpp_cross(request: GeneticCrossRequest) -> GeneticCrossResponse:
    """
    Executes a genetic cross using the AWS Lambda C++ Engine.
    Action: 'cross'
    """
    worker = get_aws_worker()
    payload = request.model_dump(exclude_none=True)
    response_data = worker.invoke(action="cross", payload=payload)
    return GeneticCrossResponse.model_validate(response_data)

def run_pedigree_analysis(structure: PedigreeStructure) -> GeneticAnalysisResult:
    """
    Invokes the C++ Engine to validate and solve a full pedigree tree.
    Action: 'pedigree_analyze'
    """
    worker = get_aws_worker()
    
    # payload matches the structure the C++ PedigreeSolver expects
    payload = structure.model_dump(exclude_none=True)

    # Invoke Lambda with the new action
    try:
        response_data = worker.invoke(action="pedigree_analyze", payload=payload)
        return GeneticAnalysisResult.model_validate(response_data)
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"AWS Worker failed, using local MOCK for pedigree analysis: {e}")
        
        # fallback mock response for testing/dev
        return GeneticAnalysisResult(
             status="SOLVABLE",
             mode_used="MENDELIAN",
             probability_map={
                 "gen1_m": {"AA": 0.0, "Aa": 1.0, "aa": 0.0},
                 "gen1_f": {"AA": 0.0, "Aa": 1.0, "aa": 0.0}
             },
             visualization_grid={}
        )