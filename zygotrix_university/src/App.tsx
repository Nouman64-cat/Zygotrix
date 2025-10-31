import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import MainLayout from "./layouts/MainLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import OverviewDashboardPage from "./pages/dashboard/OverviewDashboardPage";
import CoursesDashboardPage from "./pages/dashboard/CoursesDashboardPage";
import BrowseCoursesPage from "./pages/dashboard/BrowseCoursesPage";
import LearningPlanDashboardPage from "./pages/dashboard/LearningPlanDashboardPage";
import PracticeDashboardPage from "./pages/dashboard/PracticeDashboardPage";
import AnalyticsDashboardPage from "./pages/dashboard/AnalyticsDashboardPage";
import CommunityDashboardPage from "./pages/dashboard/CommunityDashboardPage";
import SignInPage from "./pages/auth/SignInPage";
import SignUpPage from "./pages/auth/SignUpPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DashboardCourseWorkspacePage from "./pages/dashboard/CourseWorkspacePage";
import AssessmentPage from "./pages/dashboard/AssessmentPage";

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="signin" element={<SignInPage />} />
        <Route path="signup" element={<SignUpPage />} />

        {/* Assessment Page - No Dashboard Layout */}
        <Route
          path="/university/courses/:slug/assessment/:moduleId"
          element={
            <ProtectedRoute>
              <AssessmentPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/university"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<OverviewDashboardPage />} />
          <Route path="courses" element={<CoursesDashboardPage />} />
          <Route path="browse-courses" element={<BrowseCoursesPage />} />
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
      <Toaster />
    </>
  );
};

export default App;
