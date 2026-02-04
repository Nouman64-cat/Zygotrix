"""
GWAS Dataset Service
===================
High-level service for GWAS dataset management.

Orchestrates:
- File upload and storage (DigitalOcean Spaces or local fallback)
- File parsing (VCF, PLINK, CSV)
- Data validation
- Database persistence
"""

import logging
import shutil
import gzip
from pathlib import Path
from typing import Dict, Any, Optional
from fastapi import UploadFile, HTTPException

from ..repositories import (
    get_gwas_dataset_repository,
)
from ..schema.gwas import GwasDatasetStatus, GwasFileFormat
from .gwas_file_parser import VcfParser, PlinkParser, PhenotypeParser, CustomJsonParser
from .cloud_storage import get_cloud_storage_manager

logger = logging.getLogger(__name__)


class GwasDatasetService:
    """Service for managing GWAS datasets."""

    def __init__(self):
        self.storage = get_cloud_storage_manager()
        self.dataset_repo = get_gwas_dataset_repository()

    async def upload_and_parse_dataset(
        self,
        user_id: str,
        file: UploadFile,
        name: str,
        description: Optional[str],
        file_format: GwasFileFormat,
        trait_type: str,
        trait_name: str,
    ) -> Dict[str, Any]:
        """
        Upload and parse a GWAS dataset.

        Workflow:
        1. Create dataset entry in database (status=UPLOADING)
        2. Create storage directories
        3. Save uploaded file
        4. Parse file based on format
        5. Validate data
        6. Save processed data
        7. Update dataset status to READY

        Args:
            user_id: User ID
            file: Uploaded file
            name: Dataset name
            description: Dataset description
            file_format: File format (vcf, plink, custom)
            trait_type: Trait type (quantitative or binary)
            trait_name: Trait name

        Returns:
            Dataset dictionary

        Raises:
            HTTPException: If upload or parsing fails
        """
        dataset_id = None

        try:
            # 1. Create dataset entry with UPLOADING status
            dataset = self.dataset_repo.create(
                user_id=user_id,
                name=name,
                description=description,
                file_format=file_format.value,
                trait_type=trait_type,
                trait_name=trait_name,
                file_path=None,
            )
            dataset_id = dataset.id

            logger.info(f"Created dataset {dataset_id} for user {user_id}")

            # 2. Create storage directories
            self.storage.create_dataset_directory(user_id, dataset_id)

            # 3. Save uploaded file (Streaming)
            import tempfile
            import os
            
            # Create temp file
            suffix = Path(file.filename).suffix
            with tempfile.NamedTemporaryFile(mode='wb', suffix=suffix, delete=False) as tmp_file:
                # Stream copy from upload to temp
                shutil.copyfileobj(file.file, tmp_file)
                tmp_path = Path(tmp_file.name)
            
            try:
                # Upload to storage from path
                file_path = self.storage.save_uploaded_file_from_path(
                    user_id=user_id,
                    dataset_id=dataset_id,
                    source_path=tmp_path,
                    filename=file.filename,
                    file_type="raw",
                )
                
                logger.info(f"Saved file to {file_path}")

                # Update dataset with file path and S3 info
                update_fields = {"file_path": str(file_path)}
                if self.storage.cloud_enabled:
                    update_fields["s3_key"] = str(file_path) # CloudStorageManager returns the key
                    update_fields["s3_bucket"] = self.storage.bucket_name
                
                self.dataset_repo.update(dataset_id, **update_fields)

                # 4. Update status to PROCESSING
                self.dataset_repo.update_status(
                    dataset_id=dataset_id,
                    status=GwasDatasetStatus.PROCESSING,
                )

                # 5. Validate file header only (First 100 lines)
                metadata_extracted = self._validate_and_extract_header(
                    file_path=tmp_path,
                    file_format=file_format,
                )

                # 6. Save metadata
                # Use extracted counts or defaults
                sample_count = metadata_extracted.get("sample_count", 0)
                snp_count = metadata_extracted.get("snp_count", 0)

                metadata = {
                    "name": name,
                    "description": description,
                    "file_format": file_format.value,
                    "trait_type": trait_type,
                    "trait_name": trait_name,
                    "sample_count": sample_count,
                    "snp_count": snp_count,
                    "columns": metadata_extracted.get("columns", [])
                }
                self.storage.save_metadata(user_id, dataset_id, metadata)

                # 7. Update dataset status to READY
                self.dataset_repo.update_status(
                    dataset_id=dataset_id,
                    status=GwasDatasetStatus.READY,
                    num_snps=snp_count,
                    num_samples=sample_count,
                )

                logger.info(
                    f"Dataset {dataset_id} uploaded successfully: "
                    f"~{snp_count} SNPs, "
                    f"~{sample_count} samples"
                )

                return self.dataset_repo.find_by_id(dataset_id)
                
            finally:
                # Cleanup temp file
                try:
                    os.unlink(tmp_path)
                except OSError:
                    pass

        except Exception as e:
            logger.error(f"Dataset upload failed: {str(e)}", exc_info=True)

            # Update status to ERROR
            if dataset_id:
                self.dataset_repo.update_status(
                    dataset_id=dataset_id,
                    status=GwasDatasetStatus.ERROR,
                    error_message=str(e),
                )

            raise HTTPException(
                status_code=400,
                detail=f"Dataset upload failed: {str(e)}"
            )

    def _validate_and_extract_header(
        self,
        file_path: Path,
        file_format: GwasFileFormat,
    ) -> Dict[str, Any]:
        """
        Validate file headers and extract minimal metadata.
        Reads only the first 100 lines.
        """
        metadata = {"sample_count": 0, "snp_count": 0, "columns": []}
        
        try:
            # Determine opener based on extension
            opener = gzip.open if str(file_path).endswith('.gz') else open
            mode = 'rt' # Text mode

            with opener(file_path, mode) as f:
                if file_format == GwasFileFormat.VCF:
                    # Parse VCF Header
                    for i, line in enumerate(f):
                        if i > 1000: # VCF headers can be long, but limit to 1000 lines check
                            break
                        
                        line = line.strip()
                        if line.startswith("#CHROM"):
                            # Header line: #CHROM POS ID REF ALT QUAL FILTER INFO FORMAT sample1 sample2 ...
                            parts = line.split('\t')
                            if len(parts) > 9:
                                samples = parts[9:]
                                metadata["sample_count"] = len(samples)
                                metadata["columns"] = parts[:9]
                                return metadata
                        elif not line.startswith("#"):
                            # Data line before header? Invalid VCF
                            raise ValueError("Invalid VCF: Found data line before #CHROM header")
                    else:
                        raise ValueError("Invalid VCF: No #CHROM header found in first 1000 lines")

                elif file_format == GwasFileFormat.PLINK:
                    # PLINK typically uploads .bed, .bim, .fam
                    # We can check .fam for sample count and .bim for SNP count
                    # But if we only uploaded one file here (the packaged zip or single file), handle accordingly.
                    # For now, just simplistic validation since logic assumes single file upload context in this method
                    # If assume .fam is separate, we can't do much here with just .bed or .bim path.
                    # Placeholder:
                    metadata["sample_count"] = 0 
                    return metadata

                elif file_format == GwasFileFormat.CUSTOM:
                     # Check JSON structure
                    import json
                    # Read first bit to ensure valid JSON start
                    with open(file_path, 'r') as f_txt:
                        start = f_txt.read(1024)
                        if not start.strip().startswith("{") and not start.strip().startswith("["):
                             raise ValueError("Invalid JSON format")
                    return metadata

        except Exception as e:
            raise ValueError(f"File validation failed: {str(e)}")
            
        return metadata

    def delete_dataset(self, user_id: str, dataset_id: str) -> bool:
        """
        Delete a dataset and all associated files.

        Args:
            user_id: User ID
            dataset_id: Dataset ID

        Returns:
            True if deleted successfully
        """
        # Delete from database
        deleted = self.dataset_repo.delete(dataset_id)

        if deleted:
            # Delete files from storage
            self.storage.delete_dataset(user_id, dataset_id)
            logger.info(f"Deleted dataset {dataset_id} and all files")

        return deleted

    def load_dataset_for_analysis(
        self,
        user_id: str,
        dataset_id: str,
    ) -> Optional[Dict[str, Any]]:
        """
        Load processed dataset for analysis.

        Args:
            user_id: User ID
            dataset_id: Dataset ID

        Returns:
            Processed dataset dictionary or None if not found
        """
        # Check dataset exists and belongs to user
        dataset = self.dataset_repo.find_by_id(dataset_id)
        if not dataset or dataset.user_id != user_id:
            return None

        # Load processed data
        processed_data = self.storage.load_processed_data(user_id, dataset_id)

        if not processed_data:
            logger.warning(
                f"Processed data not found for dataset {dataset_id}. "
                "Dataset may need reprocessing."
            )
            return None

        return processed_data


# Singleton instance
_dataset_service: Optional[GwasDatasetService] = None


def get_gwas_dataset_service() -> GwasDatasetService:
    """Get or create singleton dataset service instance."""
    global _dataset_service
    if _dataset_service is None:
        _dataset_service = GwasDatasetService()
    return _dataset_service
