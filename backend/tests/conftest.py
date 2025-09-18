import os
import sys
from pathlib import Path

os.environ.setdefault("MONGODB_URI", "mongomock://localhost")
os.environ.setdefault("MONGODB_DB_NAME", "zygotrix_test")

CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_ROOT = CURRENT_DIR.parent
REPO_ROOT = BACKEND_ROOT.parent
ENGINE_SRC = REPO_ROOT / "zygotrix_engine" / "zygotrix_engine"

for candidate in (BACKEND_ROOT, REPO_ROOT, ENGINE_SRC):
    str_path = str(candidate)
    if str_path not in sys.path:
        sys.path.insert(0, str_path)