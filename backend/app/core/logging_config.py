"""
Logging configuration for Zygotrix Backend.

Configures:
- Console logging (INFO level and above)
- File logging for errors (ERROR level and above to logs/error.log)
- Rotating file handler to prevent log files from growing too large
"""

import logging
import logging.handlers
import os
from pathlib import Path


def setup_logging():
    """
    Configure logging for the application.

    Creates two handlers:
    1. Console handler - logs INFO and above to stdout
    2. File handler - logs ERROR and above to logs/error.log
    """
    # Get the backend directory (parent of app directory)
    backend_dir = Path(__file__).parent.parent.parent
    logs_dir = backend_dir / "logs"

    # Ensure logs directory exists
    logs_dir.mkdir(exist_ok=True)

    # Create formatters
    detailed_formatter = logging.Formatter(
        fmt='%(asctime)s - %(name)s - %(levelname)s - %(filename)s:%(lineno)d - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    console_formatter = logging.Formatter(
        fmt='%(levelname)s:%(name)s:%(message)s'
    )

    # Console handler (INFO and above)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(console_formatter)

    # File handler for errors (ERROR and above)
    # Uses RotatingFileHandler to prevent unlimited growth
    error_log_path = logs_dir / "error.log"
    error_file_handler = logging.handlers.RotatingFileHandler(
        filename=error_log_path,
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=5,  # Keep 5 backup files
        encoding='utf-8'
    )
    error_file_handler.setLevel(logging.ERROR)
    error_file_handler.setFormatter(detailed_formatter)

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    # Remove any existing handlers
    root_logger.handlers.clear()

    # Add handlers
    root_logger.addHandler(console_handler)
    root_logger.addHandler(error_file_handler)

    # Log initial message
    logger = logging.getLogger(__name__)
    logger.info(f"Logging configured - Error logs: {error_log_path}")

    return root_logger


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance for a module.

    Args:
        name: Module name (usually __name__)

    Returns:
        Logger instance
    """
    return logging.getLogger(name)
