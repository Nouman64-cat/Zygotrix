"""
Cloud Storage Manager for AWS S3

Provides S3-compatible cloud storage for GWAS datasets.
Falls back to local storage if cloud credentials are not configured.

Storage structure in S3 bucket:
    gwas-datasets/{user_id}/{dataset_id}/
        - raw/           (original uploaded files)
        - processed/     (parsed and validated data)
        - metadata.json  (dataset information)
"""

import json
import os
import io
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime

import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from botocore.config import Config

logger = logging.getLogger(__name__)


class CloudStorageManager:
    """
    Manages cloud storage for GWAS datasets using AWS S3.
    
    Falls back to local storage if AWS credentials are not configured.
    """

    def __init__(self):
        """Initialize cloud storage manager."""
        self.provider = "local"
        self.bucket_name = None
        self.region = "us-east-1"
        self.endpoint_url = None
        self.access_key = None
        self.secret_key = None
        
        # Try AWS Credentials
        from app.config import get_settings
        settings = get_settings()
        
        aws_key = settings.aws_access_key
        aws_secret = settings.aws_secret_key
        aws_bucket = settings.aws_bucket_name
        
        if aws_key and aws_secret and aws_bucket:
            self.provider = "aws"
            self.access_key = aws_key
            self.secret_key = aws_secret
            self.bucket_name = aws_bucket
            # Optional: Get region from env if needed
            self.region = os.getenv("AWS_REGION", "us-east-1") 
        
        # Check if cloud storage is configured
        self.cloud_enabled = (self.provider == "aws")
        
        if self.cloud_enabled:
            logger.info(f"☁️ Cloud storage enabled: AWS S3 ({self.bucket_name})")
            self._init_client()
        else:
            logger.warning("⚠️ AWS cloud storage not configured. Using local storage fallback.")
            self._init_local_fallback()
    
    def _init_client(self):
        """Initialize the S3 client."""
        try:
            client_kwargs = {
                'service_name': 's3',
                'aws_access_key_id': self.access_key,
                'aws_secret_access_key': self.secret_key,
                'config': Config(
                    signature_version='s3v4',
                    s3={'addressing_style': 'virtual'}
                )
            }
            
            # Only add endpoint_url and region if they are set (essential for DO, optional for AWS)
            if self.endpoint_url:
                client_kwargs['endpoint_url'] = self.endpoint_url
                client_kwargs['region_name'] = self.region
            elif self.region:
                 client_kwargs['region_name'] = self.region

            self.s3_client = boto3.client(**client_kwargs)
            
            # Test connection
            self.s3_client.list_objects_v2(Bucket=self.bucket_name, MaxKeys=1)
            logger.info(f"✅ Connected to {self.provider.upper()}: {self.bucket_name}")
            
        except (ClientError, NoCredentialsError) as e:
            logger.error(f"❌ Failed to connect to {self.provider.upper()}: {e}")
            self.cloud_enabled = False
            self.provider = "local"
            self._init_local_fallback()
    
    def _init_local_fallback(self):
        """Initialize local storage fallback."""
        backend_dir = Path(__file__).parent.parent.parent
        self.local_base_path = backend_dir / "data" / "gwas_datasets"
        self.local_base_path.mkdir(parents=True, exist_ok=True)
        logger.info(f"📁 Local storage path: {self.local_base_path}")
    
    def _get_key(self, user_id: str, dataset_id: str, *path_parts: str) -> str:
        """Build S3 key from path parts."""
        return f"gwas-datasets/{user_id}/{dataset_id}/{'/'.join(path_parts)}"
    
    def _get_local_path(self, user_id: str, dataset_id: str, *path_parts: str) -> Path:
        """Build local path from path parts."""
        return self.local_base_path / user_id / dataset_id / Path(*path_parts)
    
    # =========================================================================
    # DIRECTORY OPERATIONS
    # =========================================================================
    
    def create_dataset_directory(self, user_id: str, dataset_id: str) -> Dict[str, str]:
        """
        Create directory structure for a new dataset.
        
        For cloud storage, this is a no-op (directories are implicit in S3).
        For local storage, creates the actual directories.
        
        Returns:
            Dictionary with paths/keys: {root, raw, processed}
        """
        if self.cloud_enabled:
            # S3 directories are virtual - no need to create them
            return {
                "root": self._get_key(user_id, dataset_id, ""),
                "raw": self._get_key(user_id, dataset_id, "raw"),
                "processed": self._get_key(user_id, dataset_id, "processed"),
            }
        else:
            # Local storage - create directories
            root_path = self._get_local_path(user_id, dataset_id)
            raw_path = root_path / "raw"
            processed_path = root_path / "processed"
            
            root_path.mkdir(parents=True, exist_ok=True)
            raw_path.mkdir(parents=True, exist_ok=True)
            processed_path.mkdir(parents=True, exist_ok=True)
            
            return {
                "root": str(root_path),
                "raw": str(raw_path),
                "processed": str(processed_path),
            }
    
    # =========================================================================
    # FILE UPLOAD/DOWNLOAD
    # =========================================================================
    
    async def save_uploaded_file(
        self,
        user_id: str,
        dataset_id: str,
        file_data: bytes,
        filename: str,
        file_type: str = "raw",
    ) -> str:
        """
        Save an uploaded file to storage.
        
        Args:
            user_id: User ID
            dataset_id: Dataset ID
            file_data: File content as bytes
            filename: Original filename
            file_type: 'raw' or 'processed'
            
        Returns:
            Path/key where file was saved
        """
        if file_type not in ("raw", "processed"):
            raise ValueError(f"Invalid file_type: {file_type}")
        
        if self.cloud_enabled:
            key = self._get_key(user_id, dataset_id, file_type, filename)
            
            try:
                self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=key,
                    Body=file_data,
                    ACL='private',
                    ContentType=self._get_content_type(filename),
                )
                logger.info(f"☁️ Uploaded to Spaces: {key}")
                return key
                
            except ClientError as e:
                logger.error(f"Failed to upload to Spaces: {e}")
                raise
        else:
            # Local storage fallback
            local_path = self._get_local_path(user_id, dataset_id, file_type, filename)
            local_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(local_path, "wb") as f:
                f.write(file_data)
            
            logger.info(f"📁 Saved locally: {local_path}")
            return str(local_path)
    
    def download_file(
        self,
        user_id: str,
        dataset_id: str,
        filename: str,
        file_type: str = "raw",
    ) -> Optional[bytes]:
        """
        Download a file from storage.
        
        Returns:
            File content as bytes, or None if not found
        """
        if file_type not in ("raw", "processed"):
            raise ValueError(f"Invalid file_type: {file_type}")
        
        if self.cloud_enabled:
            key = self._get_key(user_id, dataset_id, file_type, filename)
            
            try:
                response = self.s3_client.get_object(
                    Bucket=self.bucket_name,
                    Key=key,
                )
                return response['Body'].read()
                
            except ClientError as e:
                if e.response['Error']['Code'] == 'NoSuchKey':
                    return None
                raise
        else:
            local_path = self._get_local_path(user_id, dataset_id, file_type, filename)
            
            if not local_path.exists():
                return None
            
            with open(local_path, "rb") as f:
                return f.read()
    
    # =========================================================================
    # JSON DATA OPERATIONS
    # =========================================================================
    
    def save_metadata(
        self,
        user_id: str,
        dataset_id: str,
        metadata: Dict[str, Any],
    ) -> str:
        """
        Save dataset metadata as JSON.
        
        Returns:
            Path/key to metadata file
        """
        # Add timestamp
        metadata["last_updated"] = datetime.utcnow().isoformat()
        json_data = json.dumps(metadata, indent=2).encode('utf-8')
        
        if self.cloud_enabled:
            key = self._get_key(user_id, dataset_id, "processed", "metadata.json")
            
            try:
                self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=key,
                    Body=json_data,
                    ACL='private',
                    ContentType='application/json',
                )
                return key
                
            except ClientError as e:
                logger.error(f"Failed to save metadata to Spaces: {e}")
                raise
        else:
            local_path = self._get_local_path(user_id, dataset_id, "processed", "metadata.json")
            local_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(local_path, "w") as f:
                f.write(json_data.decode('utf-8'))
            
            return str(local_path)
    
    def load_metadata(
        self,
        user_id: str,
        dataset_id: str,
    ) -> Optional[Dict[str, Any]]:
        """Load dataset metadata from JSON file."""
        if self.cloud_enabled:
            key = self._get_key(user_id, dataset_id, "processed", "metadata.json")
            
            try:
                response = self.s3_client.get_object(
                    Bucket=self.bucket_name,
                    Key=key,
                )
                return json.loads(response['Body'].read().decode('utf-8'))
                
            except ClientError as e:
                if e.response['Error']['Code'] == 'NoSuchKey':
                    return None
                raise
        else:
            local_path = self._get_local_path(user_id, dataset_id, "processed", "metadata.json")
            
            if not local_path.exists():
                return None
            
            with open(local_path, "r") as f:
                return json.load(f)
    
    def save_processed_data(
        self,
        user_id: str,
        dataset_id: str,
        data: Dict[str, Any],
        filename: str = "processed_data.json",
    ) -> str:
        """
        Save processed dataset (SNPs, samples, phenotypes) as JSON.
        
        Returns:
            Path/key to saved file
        """
        json_data = json.dumps(data, indent=2).encode('utf-8')
        
        if self.cloud_enabled:
            key = self._get_key(user_id, dataset_id, "processed", filename)
            
            try:
                self.s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=key,
                    Body=json_data,
                    ACL='private',
                    ContentType='application/json',
                )
                logger.info(f"☁️ Saved processed data to Spaces: {key}")
                return key
                
            except ClientError as e:
                logger.error(f"Failed to save processed data to Spaces: {e}")
                raise
        else:
            local_path = self._get_local_path(user_id, dataset_id, "processed", filename)
            local_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(local_path, "w") as f:
                f.write(json_data.decode('utf-8'))
            
            logger.info(f"📁 Saved processed data locally: {local_path}")
            return str(local_path)
    
    def load_processed_data(
        self,
        user_id: str,
        dataset_id: str,
        filename: str = "processed_data.json",
    ) -> Optional[Dict[str, Any]]:
        """Load processed dataset from JSON file."""
        if self.cloud_enabled:
            key = self._get_key(user_id, dataset_id, "processed", filename)
            
            try:
                response = self.s3_client.get_object(
                    Bucket=self.bucket_name,
                    Key=key,
                )
                return json.loads(response['Body'].read().decode('utf-8'))
                
            except ClientError as e:
                if e.response['Error']['Code'] == 'NoSuchKey':
                    return None
                raise
        else:
            local_path = self._get_local_path(user_id, dataset_id, "processed", filename)
            
            if not local_path.exists():
                return None
            
            with open(local_path, "r") as f:
                return json.load(f)
    
    # =========================================================================
    # DELETE OPERATIONS
    # =========================================================================
    
    def delete_dataset(self, user_id: str, dataset_id: str) -> bool:
        """
        Delete entire dataset and all associated files.
        
        Returns:
            True if deleted, False if not found
        """
        if self.cloud_enabled:
            prefix = self._get_key(user_id, dataset_id, "")
            
            try:
                # List all objects with this prefix
                objects_to_delete = []
                paginator = self.s3_client.get_paginator('list_objects_v2')
                
                for page in paginator.paginate(Bucket=self.bucket_name, Prefix=prefix):
                    if 'Contents' in page:
                        for obj in page['Contents']:
                            objects_to_delete.append({'Key': obj['Key']})
                
                if not objects_to_delete:
                    return False
                
                # Delete in batches of 1000 (S3 limit)
                for i in range(0, len(objects_to_delete), 1000):
                    batch = objects_to_delete[i:i + 1000]
                    self.s3_client.delete_objects(
                        Bucket=self.bucket_name,
                        Delete={'Objects': batch}
                    )
                
                logger.info(f"☁️ Deleted dataset from Spaces: {prefix}")
                return True
                
            except ClientError as e:
                logger.error(f"Failed to delete dataset from Spaces: {e}")
                raise
        else:
            import shutil
            local_path = self._get_local_path(user_id, dataset_id)
            
            if not local_path.exists():
                return False
            
            shutil.rmtree(local_path)
            logger.info(f"📁 Deleted dataset locally: {local_path}")
            return True
    
    # =========================================================================
    # LISTING OPERATIONS
    # =========================================================================
    
    def list_files(
        self,
        user_id: str,
        dataset_id: str,
        file_type: str = "raw",
    ) -> List[Dict[str, Any]]:
        """
        List all files in a dataset directory.
        
        Returns:
            List of file info dictionaries with keys: name, size, modified
        """
        if file_type not in ("raw", "processed"):
            raise ValueError(f"Invalid file_type: {file_type}")
        
        if self.cloud_enabled:
            prefix = self._get_key(user_id, dataset_id, file_type) + "/"
            files = []
            
            try:
                response = self.s3_client.list_objects_v2(
                    Bucket=self.bucket_name,
                    Prefix=prefix,
                )
                
                if 'Contents' in response:
                    for obj in response['Contents']:
                        # Extract filename from key
                        filename = obj['Key'].replace(prefix, '')
                        if filename:  # Skip empty (the directory itself)
                            files.append({
                                "name": filename,
                                "size": obj['Size'],
                                "modified": obj['LastModified'].isoformat(),
                            })
                
                return files
                
            except ClientError:
                return []
        else:
            local_path = self._get_local_path(user_id, dataset_id, file_type)
            
            if not local_path.exists():
                return []
            
            files = []
            for file_path in local_path.iterdir():
                if file_path.is_file():
                    stat = file_path.stat()
                    files.append({
                        "name": file_path.name,
                        "size": stat.st_size,
                        "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    })
            
            return files
    
    # =========================================================================
    # UTILITIES
    # =========================================================================
    
    def _get_content_type(self, filename: str) -> str:
        """Get content type based on file extension."""
        ext = filename.lower().split('.')[-1]
        content_types = {
            'vcf': 'text/plain',
            'gz': 'application/gzip',
            'bed': 'application/octet-stream',
            'bim': 'text/plain',
            'fam': 'text/plain',
            'csv': 'text/csv',
            'tsv': 'text/tab-separated-values',
            'json': 'application/json',
        }
        return content_types.get(ext, 'application/octet-stream')
    
    def get_presigned_url(
        self,
        user_id: str,
        dataset_id: str,
        filename: str,
        file_type: str = "raw",
        expires_in: int = 3600,
    ) -> Optional[str]:
        """
        Generate a presigned URL for downloading a file.
        
        Only available when cloud storage is enabled.
        
        Args:
            expires_in: URL expiration time in seconds (default: 1 hour)
            
        Returns:
            Presigned URL, or None if cloud storage is not enabled
        """
        if not self.cloud_enabled:
            return None
        
        key = self._get_key(user_id, dataset_id, file_type, filename)
        
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': key},
                ExpiresIn=expires_in,
            )
            return url
            
        except ClientError as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            return None


# Singleton instance
_cloud_storage_manager: Optional[CloudStorageManager] = None


def get_cloud_storage_manager() -> CloudStorageManager:
    """Get or create singleton cloud storage manager instance."""
    global _cloud_storage_manager
    if _cloud_storage_manager is None:
        _cloud_storage_manager = CloudStorageManager()
    return _cloud_storage_manager
