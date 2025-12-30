"""
GWAS Dataset Storage Management

Handles file storage for GWAS datasets including:
- VCF files (Variant Call Format)
- PLINK binary format (.bed/.bim/.fam)
- Phenotype CSV files
- Processed dataset files

Storage structure:
    data/gwas_datasets/{user_id}/{dataset_id}/
        - raw/           (original uploaded files)
        - processed/     (parsed and validated data)
        - metadata.json  (dataset information)
"""

import json
import os
import shutil
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.config import settings


class GwasStorageManager:
    """Manages file storage for GWAS datasets."""

    def __init__(self, base_path: Optional[str] = None):
        """
        Initialize storage manager.

        Args:
            base_path: Base directory for GWAS datasets.
                      Defaults to backend/data/gwas_datasets/
        """
        if base_path is None:
            # Default to data/gwas_datasets in backend directory
            backend_dir = Path(__file__).parent.parent.parent
            base_path = backend_dir / "data" / "gwas_datasets"

        self.base_path = Path(base_path)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def get_dataset_path(self, user_id: str, dataset_id: str) -> Path:
        """Get the root path for a dataset."""
        return self.base_path / user_id / dataset_id

    def get_raw_data_path(self, user_id: str, dataset_id: str) -> Path:
        """Get the raw data directory for uploaded files."""
        return self.get_dataset_path(user_id, dataset_id) / "raw"

    def get_processed_data_path(self, user_id: str, dataset_id: str) -> Path:
        """Get the processed data directory."""
        return self.get_dataset_path(user_id, dataset_id) / "processed"

    def create_dataset_directory(self, user_id: str, dataset_id: str) -> Dict[str, Path]:
        """
        Create directory structure for a new dataset.

        Returns:
            Dictionary with paths: {root, raw, processed}
        """
        root_path = self.get_dataset_path(user_id, dataset_id)
        raw_path = self.get_raw_data_path(user_id, dataset_id)
        processed_path = self.get_processed_data_path(user_id, dataset_id)

        # Create directories
        root_path.mkdir(parents=True, exist_ok=True)
        raw_path.mkdir(parents=True, exist_ok=True)
        processed_path.mkdir(parents=True, exist_ok=True)

        return {
            "root": root_path,
            "raw": raw_path,
            "processed": processed_path,
        }

    async def save_uploaded_file(
        self,
        user_id: str,
        dataset_id: str,
        file_data: bytes,
        filename: str,
        file_type: str = "raw",
    ) -> Path:
        """
        Save an uploaded file to storage.

        Args:
            user_id: User ID
            dataset_id: Dataset ID
            file_data: File content as bytes
            filename: Original filename
            file_type: 'raw' or 'processed'

        Returns:
            Path where file was saved
        """
        if file_type == "raw":
            target_dir = self.get_raw_data_path(user_id, dataset_id)
        elif file_type == "processed":
            target_dir = self.get_processed_data_path(user_id, dataset_id)
        else:
            raise ValueError(f"Invalid file_type: {file_type}")

        target_dir.mkdir(parents=True, exist_ok=True)
        file_path = target_dir / filename

        # Write file
        with open(file_path, "wb") as f:
            f.write(file_data)

        return file_path

    def save_metadata(
        self,
        user_id: str,
        dataset_id: str,
        metadata: Dict[str, Any],
    ) -> Path:
        """
        Save dataset metadata as JSON.

        Args:
            metadata: Dictionary containing dataset information
                     (name, format, sample_count, snp_count, etc.)

        Returns:
            Path to metadata file
        """
        root_path = self.get_dataset_path(user_id, dataset_id)
        metadata_path = root_path / "metadata.json"

        # Add timestamp
        metadata["last_updated"] = datetime.utcnow().isoformat()

        with open(metadata_path, "w") as f:
            json.dump(metadata, f, indent=2)

        return metadata_path

    def load_metadata(self, user_id: str, dataset_id: str) -> Optional[Dict[str, Any]]:
        """Load dataset metadata from JSON file."""
        metadata_path = self.get_dataset_path(user_id, dataset_id) / "metadata.json"

        if not metadata_path.exists():
            return None

        with open(metadata_path, "r") as f:
            return json.load(f)

    def save_processed_data(
        self,
        user_id: str,
        dataset_id: str,
        data: Dict[str, Any],
        filename: str = "processed_data.json",
    ) -> Path:
        """
        Save processed dataset (SNPs, samples, phenotypes) as JSON.

        Args:
            data: Dictionary with keys: snps, samples, phenotypes, metadata
            filename: Output filename

        Returns:
            Path to saved file
        """
        processed_path = self.get_processed_data_path(user_id, dataset_id)
        output_path = processed_path / filename

        with open(output_path, "w") as f:
            json.dump(data, f, indent=2)

        return output_path

    def load_processed_data(
        self,
        user_id: str,
        dataset_id: str,
        filename: str = "processed_data.json",
    ) -> Optional[Dict[str, Any]]:
        """Load processed dataset from JSON file."""
        processed_path = self.get_processed_data_path(user_id, dataset_id)
        data_path = processed_path / filename

        if not data_path.exists():
            return None

        with open(data_path, "r") as f:
            return json.load(f)

    def list_files(
        self,
        user_id: str,
        dataset_id: str,
        file_type: str = "raw",
    ) -> List[Dict[str, Any]]:
        """
        List all files in a dataset directory.

        Args:
            file_type: 'raw' or 'processed'

        Returns:
            List of file info dictionaries with keys: name, size, modified
        """
        if file_type == "raw":
            target_dir = self.get_raw_data_path(user_id, dataset_id)
        elif file_type == "processed":
            target_dir = self.get_processed_data_path(user_id, dataset_id)
        else:
            raise ValueError(f"Invalid file_type: {file_type}")

        if not target_dir.exists():
            return []

        files = []
        for file_path in target_dir.iterdir():
            if file_path.is_file():
                stat = file_path.stat()
                files.append({
                    "name": file_path.name,
                    "size": stat.st_size,
                    "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                })

        return files

    def delete_dataset(self, user_id: str, dataset_id: str) -> bool:
        """
        Delete entire dataset directory.

        Returns:
            True if deleted, False if not found
        """
        dataset_path = self.get_dataset_path(user_id, dataset_id)

        if not dataset_path.exists():
            return False

        shutil.rmtree(dataset_path)
        return True

    def get_dataset_size(self, user_id: str, dataset_id: str) -> int:
        """
        Calculate total size of dataset in bytes.

        Returns:
            Total size in bytes
        """
        dataset_path = self.get_dataset_path(user_id, dataset_id)

        if not dataset_path.exists():
            return 0

        total_size = 0
        for dirpath, dirnames, filenames in os.walk(dataset_path):
            for filename in filenames:
                file_path = Path(dirpath) / filename
                total_size += file_path.stat().st_size

        return total_size

    def validate_file_extension(self, filename: str, allowed_extensions: List[str]) -> bool:
        """
        Check if file has an allowed extension.

        Args:
            filename: File name to check
            allowed_extensions: List of extensions like ['.vcf', '.vcf.gz', '.bed']

        Returns:
            True if valid, False otherwise
        """
        filename_lower = filename.lower()
        return any(filename_lower.endswith(ext) for ext in allowed_extensions)

    def get_file_format(self, filename: str) -> Optional[str]:
        """
        Detect file format from filename.

        Returns:
            'vcf', 'vcf_gz', 'plink', 'csv', or None
        """
        filename_lower = filename.lower()

        if filename_lower.endswith(".vcf.gz"):
            return "vcf_gz"
        elif filename_lower.endswith(".vcf"):
            return "vcf"
        elif filename_lower.endswith(".bed"):
            return "plink"  # PLINK binary format
        elif filename_lower.endswith(".csv"):
            return "csv"
        else:
            return None
