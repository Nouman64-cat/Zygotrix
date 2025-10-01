def _project_accessible(project_id: str, user_id: str) -> bool:
    collection = get_projects_collection(required=True)
    try:
        object_id = ObjectId(project_id)
    except Exception:
        return False
    project = collection.find_one(
        {"_id": object_id, "owner_id": user_id, "is_template": {"$ne": True}}
    )
    return project is not None


from typing import List, Optional, Dict, Any
from app.schema.projects import (
    ProjectLinePayload,
    ProjectLineSaveResponse,
    ProjectLineSnapshot,
    ProjectNotePayload,
    ProjectNoteSaveResponse,
    ProjectNoteSnapshot,
    ProjectDrawingPayload,
    ProjectDrawingSaveResponse,
    ProjectDrawingSnapshot,
    MendelianToolCreateRequest,
    MendelianToolUpdateRequest,
    MendelianProjectTool,
)

# The following functions implement project workspace functionality
# for saving and retrieving lines, notes, and drawings.

from bson import ObjectId
from datetime import datetime, timezone
from pymongo.errors import PyMongoError, DuplicateKeyError
from app.services.common import (
    get_projects_collection,
    get_project_lines_collection,
    get_project_notes_collection,
    get_project_drawings_collection,
)


def _serialize_project_line(document: Dict[str, Any]) -> "ProjectLine":
    """Convert MongoDB line document to ProjectLine model."""
    from app.schema.projects import ProjectLine

    data = dict(document)
    if "_id" in data:
        data.pop("_id")
    return ProjectLine(**data)


def _serialize_project_note(document: Dict[str, Any]) -> "ProjectNote":
    """Convert MongoDB note document to ProjectNote model."""
    from app.schema.projects import ProjectNote

    data = dict(document)
    if "_id" in data:
        data.pop("_id")
    return ProjectNote(**data)


def _serialize_project_drawing(document: Dict[str, Any]) -> "ProjectDrawing":
    """Convert MongoDB drawing document to ProjectDrawing model."""
    from app.schema.projects import ProjectDrawing

    data = dict(document)
    if "_id" in data:
        data.pop("_id")
    return ProjectDrawing(**data)


def create_tool(project_id: str, user_id: str, tool_data: Dict) -> Optional[Dict]:
    collection = get_projects_collection(required=True)
    assert collection is not None, "Projects collection is required"
    try:
        object_id = ObjectId(project_id)
    except Exception:
        return None
    tool_id = str(ObjectId())
    tool_data["id"] = tool_id
    tool_data["type"] = "mendelian"
    result = collection.find_one_and_update(
        {"_id": object_id, "owner_id": user_id, "is_template": {"$ne": True}},
        {
            "$push": {"tools": tool_data},
            "$set": {"updated_at": datetime.now(timezone.utc)},
        },
        return_document=True,
    )
    if not result:
        return None
    for tool in result.get("tools", []):
        if tool.get("id") == tool_id:
            return tool
    return None


def update_tool(
    project_id: str, tool_id: str, user_id: str, updates: Dict
) -> Optional[Dict]:
    collection = get_projects_collection(required=True)
    assert collection is not None, "Projects collection is required"
    try:
        object_id = ObjectId(project_id)
    except Exception:
        return None
    update_fields = {f"tools.$.{k}": v for k, v in updates.items()}
    update_fields["updated_at"] = datetime.now(timezone.utc)
    result = collection.find_one_and_update(
        {
            "_id": object_id,
            "owner_id": user_id,
            "is_template": {"$ne": True},
            "tools.id": tool_id,
        },
        {"$set": update_fields},
        return_document=True,
    )
    if not result:
        return None
    for tool in result.get("tools", []):
        if tool.get("id") == tool_id:
            return tool
    return None


def delete_tool(project_id: str, tool_id: str, user_id: str) -> bool:
    collection = get_projects_collection(required=True)
    assert collection is not None, "Projects collection is required"
    try:
        object_id = ObjectId(project_id)
    except Exception:
        return False
    result = collection.find_one_and_update(
        {"_id": object_id, "owner_id": user_id, "is_template": {"$ne": True}},
        {
            "$pull": {"tools": {"id": tool_id}},
            "$set": {"updated_at": datetime.now(timezone.utc)},
        },
    )
    return result is not None


def get_project_line_snapshot(
    project_id: str, user_id: str
) -> Optional[ProjectLineSnapshot]:
    from app.schema.projects import ProjectLineSnapshot

    if not _project_accessible(project_id, user_id):
        return None
    collection = get_project_lines_collection(required=True)
    assert collection is not None, "Project lines collection is required"
    try:
        cursor = collection.find({"project_id": project_id}).sort("line_id", 1)
    except PyMongoError:
        cursor = []
    lines = [_serialize_project_line(doc) for doc in cursor]
    snapshot_version = max((line.version for line in lines), default=0)
    return ProjectLineSnapshot(lines=lines, snapshot_version=snapshot_version)


def save_project_lines(
    project_id: str, user_id: str, lines: List[ProjectLinePayload]
) -> Optional[ProjectLineSaveResponse]:
    from app.schema.projects import ProjectLineSaveResponse, ProjectLineSaveSummary

    if not _project_accessible(project_id, user_id):
        return None

    collection = get_project_lines_collection(required=True)
    assert collection is not None, "Project lines collection is required"

    summary = ProjectLineSaveSummary()

    for line_payload in lines:
        line_doc = {
            "id": line_payload.id,
            "project_id": project_id,
            "start_point": {
                "x": line_payload.start_point.x,
                "y": line_payload.start_point.y,
            },
            "end_point": {"x": line_payload.end_point.x, "y": line_payload.end_point.y},
            "stroke_color": line_payload.stroke_color,
            "stroke_width": line_payload.stroke_width,
            "arrow_type": line_payload.arrow_type,
            "is_deleted": line_payload.is_deleted,
            "updated_at": line_payload.updated_at,
            "version": line_payload.version,
            "origin": line_payload.origin,
        }
        try:
            collection.replace_one(
                {"project_id": project_id, "id": line_payload.id}, line_doc, upsert=True
            )
            summary.updated += 1
        except Exception:
            summary.ignored += 1

    # Return updated snapshot
    snapshot = get_project_line_snapshot(project_id, user_id)
    if snapshot:
        return ProjectLineSaveResponse(
            lines=snapshot.lines,
            snapshot_version=snapshot.snapshot_version,
            summary=summary,
        )
    return None


def get_project_note_snapshot(
    project_id: str, user_id: str
) -> Optional[ProjectNoteSnapshot]:
    from app.schema.projects import ProjectNoteSnapshot

    if not _project_accessible(project_id, user_id):
        return None
    collection = get_project_notes_collection(required=True)
    assert collection is not None, "Project notes collection is required"
    try:
        cursor = collection.find({"project_id": project_id}).sort("note_id", 1)
    except PyMongoError:
        cursor = []
    notes = [_serialize_project_note(doc) for doc in cursor]
    snapshot_version = max((note.version for note in notes), default=0)
    return ProjectNoteSnapshot(notes=notes, snapshot_version=snapshot_version)


def save_project_notes(
    project_id: str, user_id: str, notes: List[ProjectNotePayload]
) -> Optional[ProjectNoteSaveResponse]:
    from app.schema.projects import ProjectNoteSaveResponse, ProjectNoteSaveSummary

    if not _project_accessible(project_id, user_id):
        return None

    collection = get_project_notes_collection(required=True)
    assert collection is not None, "Project notes collection is required"

    summary = ProjectNoteSaveSummary()

    for note_payload in notes:
        note_doc = {
            "id": note_payload.id,
            "project_id": project_id,
            "content": note_payload.content,
            "position": {"x": note_payload.position.x, "y": note_payload.position.y},
            "size": {
                "width": note_payload.size.width,
                "height": note_payload.size.height,
            },
            "is_deleted": note_payload.is_deleted,
            "updated_at": note_payload.updated_at,
            "version": note_payload.version,
            "origin": note_payload.origin,
        }
        try:
            collection.replace_one(
                {"project_id": project_id, "id": note_payload.id}, note_doc, upsert=True
            )
            summary.updated += 1
        except Exception:
            summary.ignored += 1

    # Return updated snapshot
    snapshot = get_project_note_snapshot(project_id, user_id)
    if snapshot:
        return ProjectNoteSaveResponse(
            notes=snapshot.notes,
            snapshot_version=snapshot.snapshot_version,
            summary=summary,
        )
    return None


def get_project_drawing_snapshot(
    project_id: str, user_id: str
) -> Optional[ProjectDrawingSnapshot]:
    from app.schema.projects import ProjectDrawingSnapshot

    if not _project_accessible(project_id, user_id):
        return None
    collection = get_project_drawings_collection(required=True)
    assert collection is not None, "Project drawings collection is required"
    try:
        cursor = collection.find({"project_id": project_id}).sort("drawing_id", 1)
    except PyMongoError:
        cursor = []
    drawings = [_serialize_project_drawing(doc) for doc in cursor]
    snapshot_version = max((drawing.version for drawing in drawings), default=0)
    return ProjectDrawingSnapshot(drawings=drawings, snapshot_version=snapshot_version)


def save_project_drawings(
    project_id: str, user_id: str, drawings: List[ProjectDrawingPayload]
) -> Optional[ProjectDrawingSaveResponse]:
    from app.schema.projects import (
        ProjectDrawingSaveResponse,
        ProjectDrawingSaveSummary,
    )

    if not _project_accessible(project_id, user_id):
        return None

    collection = get_project_drawings_collection(required=True)
    assert collection is not None, "Project drawings collection is required"

    summary = ProjectDrawingSaveSummary()

    for drawing_payload in drawings:
        drawing_doc = {
            "id": drawing_payload.id,
            "project_id": project_id,
            "points": [{"x": p.x, "y": p.y} for p in drawing_payload.points],
            "stroke_color": drawing_payload.stroke_color,
            "stroke_width": drawing_payload.stroke_width,
            "is_deleted": drawing_payload.is_deleted,
            "updated_at": drawing_payload.updated_at,
            "version": drawing_payload.version,
            "origin": drawing_payload.origin,
        }
        try:
            collection.replace_one(
                {"project_id": project_id, "id": drawing_payload.id},
                drawing_doc,
                upsert=True,
            )
            summary.updated += 1
        except Exception:
            summary.ignored += 1

    # Return updated snapshot
    snapshot = get_project_drawing_snapshot(project_id, user_id)
    if snapshot:
        return ProjectDrawingSaveResponse(
            drawings=snapshot.drawings,
            snapshot_version=snapshot.snapshot_version,
            summary=summary,
        )
    return None
