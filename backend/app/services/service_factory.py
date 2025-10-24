"""Service factory for dependency injection."""

from ..repositories.course_repository import CourseRepository
from ..repositories.progress_repository import ProgressRepository
from ..repositories.assessment_repository import AssessmentRepository
from ..integrations.hygraph_client import HygraphClient
from ..serializers import CourseSerializer, ProgressSerializer
from ..services.course_service import CourseService
from ..services.progress_service import ProgressService
from ..services.assessment_service import AssessmentService
from ..config import get_settings


class ServiceFactory:
    """Factory for creating service instances with proper dependencies."""

    def __init__(self):
        # Get config
        self.settings = get_settings()

        # Create repositories (singleton-like)
        self.course_repo = CourseRepository()
        self.progress_repo = ProgressRepository()
        self.assessment_repo = AssessmentRepository()

        # Create integrations (HygraphClient gets settings internally)
        self.hygraph_client = HygraphClient()

        # Create serializers
        self.course_serializer = CourseSerializer()
        self.progress_serializer = ProgressSerializer()

    def get_course_service(self) -> CourseService:
        """Get CourseService instance."""
        return CourseService(
            course_repo=self.course_repo,
            progress_repo=self.progress_repo,
            hygraph_client=self.hygraph_client,
            serializer=self.course_serializer,
        )

    def get_progress_service(self) -> ProgressService:
        """Get ProgressService instance."""
        return ProgressService(
            progress_repo=self.progress_repo,
            course_repo=self.course_repo,
            serializer=self.progress_serializer,
        )

    def get_assessment_service(self) -> AssessmentService:
        """Get AssessmentService instance."""
        return AssessmentService(
            assessment_repo=self.assessment_repo, progress_repo=self.progress_repo
        )


# Global service factory instance
_service_factory = None


def get_service_factory() -> ServiceFactory:
    """Get the global service factory instance."""
    global _service_factory
    if _service_factory is None:
        _service_factory = ServiceFactory()
    return _service_factory
