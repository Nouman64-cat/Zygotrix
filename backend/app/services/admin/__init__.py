"""
Admin services package.

Utilities and helpers for admin functionality.
"""
from .serializers import (
    serialize_admin_user_list_item,
    serialize_admin_user_list,
)

# Re-export user management functions from the parent admin module
# We need to import from the actual admin.py file which is at services/admin.py
# Since this package shadows that file, we need a workaround
import importlib.util
import os

# Load admin.py functions directly
_admin_py_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "admin.py")
_spec = importlib.util.spec_from_file_location("admin_module", _admin_py_path)
_admin_module = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_admin_module)

# Re-export the functions
get_all_users = _admin_module.get_all_users
get_user_by_id_admin = _admin_module.get_user_by_id_admin
deactivate_user = _admin_module.deactivate_user
reactivate_user = _admin_module.reactivate_user
delete_user = _admin_module.delete_user
update_user_role = _admin_module.update_user_role
get_user_stats = _admin_module.get_user_stats
is_super_admin = _admin_module.is_super_admin
is_admin_or_super_admin = _admin_module.is_admin_or_super_admin
promote_to_super_admin = _admin_module.promote_to_super_admin

__all__ = [
    "serialize_admin_user_list_item",
    "serialize_admin_user_list",
    "get_all_users",
    "get_user_by_id_admin",
    "deactivate_user",
    "reactivate_user",
    "delete_user",
    "update_user_role",
    "get_user_stats",
    "is_super_admin",
    "is_admin_or_super_admin",
    "promote_to_super_admin",
]

