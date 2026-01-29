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

            # 3. Save uploaded file
            file_content = await file.read()
            file_path = await self.storage.save_uploaded_file(
                user_id=user_id,
                dataset_id=dataset_id,
                file_data=file_content,
                filename=file.filename,
                file_type="raw",
            )

            logger.info(f"Saved file to {file_path}")

            # Update dataset with file path
            self.dataset_repo.update(dataset_id, file_path=str(file_path))

            # 4. Update status to PROCESSING
            self.dataset_repo.update_status(
                dataset_id=dataset_id,
                status=GwasDatasetStatus.PROCESSING,
            )

            # 5. Parse file based on format
            # For cloud storage, we parse directly from the file content
            parsed_data = self._parse_dataset_content(
                file_content=file_content,
                filename=file.filename,
                file_format=file_format,
            )

            # 6. Save processed data
            self.storage.save_processed_data(
                user_id=user_id,
                dataset_id=dataset_id,
                data=parsed_data,
            )

            # 7. Save metadata
            # Extract counts with defaults
            sample_count = parsed_data["metadata"].get("sample_count", len(parsed_data.get("samples", [])))
            snp_count = parsed_data["metadata"].get("snp_count", len(parsed_data.get("snps", [])))

            metadata = {
                "name": name,
                "description": description,
                "file_format": file_format.value,
                "trait_type": trait_type,
                "trait_name": trait_name,
                "sample_count": sample_count,
                "snp_count": snp_count,
            }
            self.storage.save_metadata(user_id, dataset_id, metadata)

            # 8. Update dataset status to READY
            self.dataset_repo.update_status(
                dataset_id=dataset_id,
                status=GwasDatasetStatus.READY,
                num_snps=snp_count,
                num_samples=sample_count,
            )

            logger.info(
                f"Dataset {dataset_id} processed successfully: "
                f"{snp_count} SNPs, "
                f"{sample_count} samples"
            )

            # Return updated dataset
            return self.dataset_repo.find_by_id(dataset_id)

        except Exception as e:
            logger.error(f"Dataset upload/parsing failed: {str(e)}", exc_info=True)

            # Update status to ERROR if dataset was created
            if dataset_id:
                self.dataset_repo.update_status(
                    dataset_id=dataset_id,
                    status=GwasDatasetStatus.ERROR,
                    error_message=str(e),
                )

            raise HTTPException(
                status_code=400,
                detail=f"Dataset upload/parsing failed: {str(e)}"
            )

    def _parse_dataset_content(
        self,
        file_content: bytes,
        filename: str,
        file_format: GwasFileFormat,
    ) -> Dict[str, Any]:
        """
        Parse dataset from file content (bytes).
        
        Uses a temporary file for compatibility with existing parsers.
        This approach works for both local and cloud storage.

        Args:
            file_content: File content as bytes
            filename: Original filename
            file_format: File format enum

        Returns:
            Parsed data dictionary

        Raises:
            ValueError: If format is unsupported
        """
        import tempfile
        import os
        
        logger.info(f"Parsing {file_format.value} file: {filename}")

        # Create a temporary file to parse
        # This is needed because existing parsers expect file paths
        suffix = Path(filename).suffix
        with tempfile.NamedTemporaryFile(mode='wb', suffix=suffix, delete=False) as tmp_file:
            tmp_file.write(file_content)
            tmp_path = Path(tmp_file.name)
        
        try:
            if file_format == GwasFileFormat.VCF:
                parser = VcfParser(tmp_path)
                return parser.parse()

            elif file_format == GwasFileFormat.PLINK:
                # For PLINK, file_path should be .bed file
                parser = PlinkParser(tmp_path)
                return parser.parse()

            elif file_format == GwasFileFormat.CUSTOM:
                # Custom JSON format
                parser = CustomJsonParser(tmp_path)
                return parser.parse()

            else:
                raise ValueError(f"Unsupported file format: {file_format.value}")
        finally:
            # Clean up temporary file
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

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
