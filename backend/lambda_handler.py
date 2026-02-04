import json
import os
import subprocess
import boto3

def handler(event, context):
    """
    AWS Lambda Handler for Zygotrix Engine.
    Acts as a bridge between AWS services and the C++ binary.
    """
    print(f"Received event: {json.dumps(event)}")
    
    action = event.get("action")
    payload = event.get("payload", {})

    try:
        if action == "gwas_vcf":
            # Phase 2: Python handles the S3 download
            s3_bucket = payload.get("s3_bucket")
            s3_key = payload.get("s3_key")
            
            if not s3_bucket or not s3_key:
                return {
                    "statusCode": 400,
                    "body": json.dumps({"error": "Missing s3_bucket or s3_key for gwas_vcf"})
                }

            print(f"Downloading {s3_key} from {s3_bucket}...")
            
            # 1. Download file using Python (Fast & Boto3 built-in)
            s3 = boto3.client('s3')
            # Extract filename from key
            filename = s3_key.split('/')[-1]
            local_path = f"/tmp/{filename}"
            
            s3.download_file(s3_bucket, s3_key, local_path)
            print(f"Downloaded to {local_path}")
            
            # 2. Tell C++ where the file is
            # We inject the local path into the payload we send to C++
            payload['local_vcf_path'] = local_path
            
            # 3. Invoke Binary (Standard GwasCli or similar)
            # The payload is passed as a JSON string argument or stdin
            # Assuming binary accepts JSON string as first argument
            
            # For gwas_vcf, we might use a specific flag or mode in the binary
            cmd = ["./zygotrix_engine", "gwas_vcf", json.dumps(payload)]
            
            print(f"Executing: {' '.join(cmd)}")
            result = subprocess.run(
                cmd, 
                capture_output=True, 
                text=True,
                check=False # We handle return code manually
            )
            
            if result.returncode != 0:
                print(f"Binary failed: {result.stderr}")
                return {
                    "statusCode": 500,
                    "body": json.dumps({"error": f"Engine execution failed: {result.stderr}"})
                }
                
            # Success
            return {
                "statusCode": 200,
                "body": result.stdout
            }

        else:
            # Legacy/Other actions (cross, pedigree, etc.)
            # Pass through to binary directly?
            # Or assume they are handled similarly
            cmd = ["./zygotrix_engine", action, json.dumps(payload)]
            
            result = subprocess.run(
                cmd, 
                capture_output=True, 
                text=True
            )
            
            if result.returncode != 0:
                return {
                    "statusCode": 500,
                    "body": json.dumps({"error": result.stderr})
                }
                
            return {
                "statusCode": 200,
                "body": result.stdout
            }

    except Exception as e:
        print(f"Handler failed: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": f"Lambda Handler Error: {str(e)}"})
        }
