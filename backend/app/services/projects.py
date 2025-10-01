from typing import Any, Dict, List, Optional, Mapping
from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException
from pymongo.errors import PyMongoError, DuplicateKeyError
from app.config import get_settings


def _serialize_project_doc(document: Mapping[str, Any]) -> Dict[str, Any]:
    """Convert a MongoDB project document into an API-friendly dict.

    - Copies all fields
    - Converts ObjectId in _id to a string id
    - Removes the original _id key
    """
    data: Dict[str, Any] = dict(document)
    if data.get("_id") is not None:
        try:
            data["id"] = str(data["_id"])  # expose as string id
        finally:
            data.pop("_id", None)
    return data


# Project CRUD and registry


def get_user_projects(
    user_id: str, page: int = 1, page_size: int = 20
) -> tuple[list, int]:
    from app.services.common import get_projects_collection
    from app.schema.projects import Project

    collection = get_projects_collection(required=True)
    assert collection is not None, "Projects collection is required"
    skip = (page - 1) * page_size
    query = {"owner_id": user_id, "is_template": {"$ne": True}}
    total = collection.count_documents(query)
    cursor = collection.find(query).sort("updated_at", -1).skip(skip).limit(page_size)
    projects = [Project.model_validate(_serialize_project_doc(doc)) for doc in cursor]
    return projects, total


def create_project(
    name: str,
    description: Optional[str],
    project_type: str,
    owner_id: str,
    tags: List[str],
    from_template: Optional[str] = None,
    color: Optional[str] = "bg-blue-500",
) -> Any:
    from .common import get_projects_collection
    from app.schema.projects import Project

    collection = get_projects_collection(required=True)
    assert collection is not None, "Projects collection is required"
    now = datetime.now(timezone.utc)
    project_doc = {
        "name": name,
        "description": description,
        "type": project_type,
        "owner_id": owner_id,
        "tools": [],
        "created_at": now,
        "updated_at": now,
        "tags": tags,
        "is_template": False,
        "template_category": None,
        "color": color,
    }
    if from_template:
        templates_objs = get_project_templates()
        template_obj = next((t for t in templates_objs if t.id == from_template), None)
        if template_obj:
            project_doc["tools"] = [tool.model_dump() for tool in template_obj.tools]
    result = collection.insert_one(project_doc)
    project_doc["id"] = str(result.inserted_id)
    return Project.model_validate(project_doc)


def get_project(project_id: str, user_id: str) -> Optional[Any]:
    from .common import get_projects_collection
    from app.schema.projects import Project

    collection = get_projects_collection(required=True)
    assert collection is not None, "Projects collection is required"
    try:
        object_id = ObjectId(project_id)
    except Exception:
        return None
    query = {"_id": object_id, "owner_id": user_id, "is_template": {"$ne": True}}
    print(f"[DEBUG] get_project query: {query}")
    project_doc = collection.find_one(query)
    print(f"[DEBUG] get_project raw result: {project_doc}")
    if not project_doc:
        return None
    return Project.model_validate(_serialize_project_doc(project_doc))


def update_project(
    project_id: str, user_id: str, updates: Dict[str, Any]
) -> Optional[Any]:
    from .common import get_projects_collection
    from app.schema.projects import Project

    collection = get_projects_collection(required=True)
    assert collection is not None, "Projects collection is required"
    try:
        object_id = ObjectId(project_id)
    except Exception:
        return None
    if "tools" in updates and updates["tools"]:
        tools_data = []
        for tool in updates["tools"]:
            if hasattr(tool, "model_dump"):
                tools_data.append(tool.model_dump())
            elif isinstance(tool, dict):
                tools_data.append(tool)
        updates["tools"] = tools_data
    updates["updated_at"] = datetime.now(timezone.utc)
    query = {"_id": object_id, "owner_id": user_id, "is_template": {"$ne": True}}
    print(f"[DEBUG] update_project query: {query}")
    result = collection.find_one_and_update(
        query,
        {"$set": updates},
        return_document=True,
    )
    if not result:
        return None
    return Project.model_validate(_serialize_project_doc(result))


def delete_project(project_id: str, user_id: str) -> bool:
    from .common import get_projects_collection

    collection = get_projects_collection(required=True)
    assert collection is not None, "Projects collection is required"
    try:
        object_id = ObjectId(project_id)
    except Exception:
        return False
    query = {"_id": object_id, "owner_id": user_id, "is_template": {"$ne": True}}
    print(f"[DEBUG] delete_project query: {query}")
    result = collection.delete_one(query)
    print(f"[DEBUG] delete_project result: {result.deleted_count}")
    return result.deleted_count > 0


def get_project_templates() -> List[Any]:
    from app.schema.projects import ProjectTemplate, MendelianProjectTool

    templates = [
        ProjectTemplate(
            id="mendelian_basic",
            name="Basic Mendelian Inheritance",
            description="Explore simple dominant and recessive traits like eye color and blood type",
            category="mendelian",
            tools=[
                MendelianProjectTool(
                    id="eye_color_study",
                    name="Eye Color Study",
                    trait_configurations={
                        "eye_color": {"parent1": "Bb", "parent2": "bb"}
                    },
                    position={"x": 100, "y": 100},
                ),
                MendelianProjectTool(
                    id="blood_type_study",
                    name="Blood Type Study",
                    trait_configurations={
                        "blood_type": {"parent1": "AB", "parent2": "OO"}
                    },
                    position={"x": 400, "y": 100},
                ),
            ],
            tags=["beginner", "mendelian", "genetics"],
        ),
        ProjectTemplate(
            id="mendelian_advanced",
            name="Advanced Mendelian Patterns",
            description="Study complex inheritance patterns including codominance and incomplete dominance",
            category="mendelian",
            tools=[
                MendelianProjectTool(
                    id="blood_type_codominance",
                    name="Blood Type Codominance",
                    trait_configurations={
                        "blood_type": {"parent1": "AB", "parent2": "AO"}
                    },
                    position={"x": 100, "y": 300},
                ),
            ],
            tags=["advanced", "mendelian", "genetics"],
        ),
    ]
    return templates
