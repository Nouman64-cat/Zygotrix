from fastapi import APIRouter
from app.services.projects import get_project_templates
from ..schema.projects import ProjectTemplateListResponse

router = APIRouter(prefix="/api/project-templates", tags=["ProjectTemplates"])


@router.get("/", response_model=ProjectTemplateListResponse)
def list_project_templates() -> ProjectTemplateListResponse:
    templates = get_project_templates()
    return ProjectTemplateListResponse(templates=templates)
