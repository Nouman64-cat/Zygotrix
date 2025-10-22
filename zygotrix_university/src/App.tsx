import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import HomePage from "./pages/HomePage";
import CoursesPage from "./pages/CoursesPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import PathsPage from "./pages/PathsPage";
import PracticePage from "./pages/PracticePage";
import CommunityPage from "./pages/CommunityPage";
import ResourcesPage from "./pages/ResourcesPage";
import SimulationStudioPage from "./pages/SimulationStudioPage";
import AboutPage from "./pages/AboutPage";
import SupportPage from "./pages/SupportPage";
import EnterprisePage from "./pages/EnterprisePage";
import ContactPage from "./pages/ContactPage";
import AccessibilityPage from "./pages/AccessibilityPage";
import NewsletterPage from "./pages/NewsletterPage";
import NotFoundPage from "./pages/NotFoundPage";
import OverviewDashboardPage from "./pages/dashboard/OverviewDashboardPage";
import CoursesDashboardPage from "./pages/dashboard/CoursesDashboardPage";
import LearningPlanDashboardPage from "./pages/dashboard/LearningPlanDashboardPage";
import PracticeDashboardPage from "./pages/dashboard/PracticeDashboardPage";
import AnalyticsDashboardPage from "./pages/dashboard/AnalyticsDashboardPage";
import CommunityDashboardPage from "./pages/dashboard/CommunityDashboardPage";
import SignInPage from "./pages/auth/SignInPage";
import SignUpPage from "./pages/auth/SignUpPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DashboardCourseWorkspacePage from "./pages/dashboard/CourseWorkspacePage";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="courses/:slug" element={<CourseDetailPage />} />
        <Route path="paths" element={<PathsPage />} />
        <Route path="practice" element={<PracticePage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="resources" element={<ResourcesPage />} />
        <Route path="simulation-studio" element={<SimulationStudioPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="enterprise" element={<EnterprisePage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="accessibility" element={<AccessibilityPage />} />
        <Route path="newsletter" element={<NewsletterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="signin" element={<SignInPage />} />
      <Route path="signup" element={<SignUpPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<OverviewDashboardPage />} />
        <Route path="courses" element={<CoursesDashboardPage />} />
        <Route
          path="courses/:slug"
          element={<DashboardCourseWorkspacePage />}
        />
        <Route path="plan" element={<LearningPlanDashboardPage />} />
        <Route path="practice" element={<PracticeDashboardPage />} />
        <Route path="analytics" element={<AnalyticsDashboardPage />} />
        <Route path="community" element={<CommunityDashboardPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
