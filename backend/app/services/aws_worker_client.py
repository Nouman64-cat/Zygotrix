import boto3
import json
import logging
from fastapi import HTTPException
from app.config import get_settings

logger = logging.getLogger(__name__)

class AwsWorkerClient:
    def __init__(self):
        self.settings = get_settings()
        
        # We explicitly use the keys from your .env
        self.client = boto3.client(
            'lambda',
            region_name=self.settings.aws_region,
            aws_access_key_id=self.settings.aws_access_key,
            aws_secret_access_key=self.settings.aws_secret_key
        )
        self.function_name = self.settings.aws_lambda_function_name

    def invoke(self, action: str, payload: dict) -> dict:
        """
        Invokes the Zygotrix C++ Lambda.
        action: 'cross', 'gwas', 'protein', or 'dna'
        """
        try:
            logger.info(f"Invoking Lambda: {action}")
            
            response = self.client.invoke(
                FunctionName=self.function_name,
                InvocationType='RequestResponse', # Synchronous wait
                Payload=json.dumps({
                    "action": action,
                    "payload": payload
                })
            )

            # Read response
            response_payload = json.loads(response['Payload'].read())
            
            # 1. Check for Lambda Platform Errors (Timeout, etc.)
            if 'FunctionError' in response:
                error_msg = response_payload.get("errorMessage", "Unknown Lambda Error")
                logger.error(f"Lambda Platform Error: {error_msg}")
                raise HTTPException(status_code=500, detail=f"Compute Engine Error: {error_msg}")

            # 2. Check for Application Errors (from our C++ handler)
            status_code = response_payload.get("statusCode", 500)
            body = response_payload.get("body")

            if status_code != 200:
                # Handle error parsing
                if isinstance(body, str):
                    try:
                        body = json.loads(body)
                    except:
                        pass
                detail = body.get("error", body) if isinstance(body, dict) else str(body)
                
                logger.error(f"Engine Error ({status_code}): {detail}")
                raise HTTPException(status_code=status_code, detail=detail)

            # 3. Success
            if isinstance(body, str):
                return json.loads(body)
            return body

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to invoke AWS Worker: {e}")
            raise HTTPException(status_code=500, detail="Failed to connect to genetic compute engine")

# Singleton Accessor
_client = None

def get_aws_worker() -> AwsWorkerClient:
    global _client
    if _client is None:
        _client = AwsWorkerClient()
    return _client