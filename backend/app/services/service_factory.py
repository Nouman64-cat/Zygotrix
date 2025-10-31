from ..repositories.course_repository import CourseRepository
from ..repositories.progress_repository import ProgressRepository
from ..repositories.assessment_repository import AssessmentRepository
from ..integrations.hygraph_client import HygraphClient
from ..serializers import CourseSerializer, ProgressSerializer
from ..services.course_service import CourseService
from ..services.progress_service import ProgressService
from ..services.assessment_service import AssessmentService

from ..services.dashboard_service import DashboardService
from ..config import get_settings


class ServiceFactory:

    def __init__(self):
        self.settings = get_settings()

        self.course_repo = CourseRepository()
        self.progress_repo = ProgressRepository()
        self.assessment_repo = AssessmentRepository()

        self.hygraph_client = HygraphClient()

        self.course_serializer = CourseSerializer()
        self.progress_serializer = ProgressSerializer()

        self.course_service = CourseService(
            course_repo=self.course_repo,
            progress_repo=self.progress_repo,
            hygraph_client=self.hygraph_client,
            serializer=self.course_serializer,
        )

        self.progress_service = ProgressService(
            progress_repo=self.progress_repo,
            course_repo=self.course_repo,
            serializer=self.progress_serializer,
        )

        self.assessment_service = AssessmentService()

        self.dashboard_service = DashboardService(
            course_service=self.course_service,
            progress_service=self.progress_service,
        )

    def get_course_service(self) -> CourseService:

        return self.course_service

    def get_progress_service(self) -> ProgressService:

        return self.progress_service

    def get_assessment_service(self) -> AssessmentService:

        return self.assessment_service

    def get_dashboard_service(self) -> DashboardService:

        return self.dashboard_service


_service_factory = None


def get_service_factory() -> ServiceFactory:

    global _service_factory
    if _service_factory is None:
        _service_factory = ServiceFactory()
    return _service_factory
