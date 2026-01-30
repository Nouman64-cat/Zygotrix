from __future__ import annotations

from app.schema.cpp_engine import GeneticCrossRequest, GeneticCrossResponse
from app.services.aws_worker_client import get_aws_worker

def run_cpp_cross(request: GeneticCrossRequest) -> GeneticCrossResponse:
    """
    Executes a genetic cross using the AWS Lambda C++ Engine.
    """
    # 1. Get the client
    worker = get_aws_worker()
    
    # 2. Prepare payload
    payload = request.model_dump(exclude_none=True)

    # 3. Call AWS (Action matches 'cross' in your Lambda handler)
    response_data = worker.invoke(action="cross", payload=payload)

    # 4. Return result
    return GeneticCrossResponse.model_validate(response_data)