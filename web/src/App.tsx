import React from "react";
import { Route, Routes } from "react-router-dom";

import RequireAuth from "./components/dashboard/RequireAuth";
import OnboardingCheck from "./components/dashboard/OnboardingCheck";
import MainLayout from "./layouts/MainLayout";
import CommunityLayout from "./layouts/CommunityLayout";
import AboutPage from "./pages/AboutPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ContactPage from "./pages/ContactPage";
import DataManagementPage from "./pages/DataManagementPage";
import HomePage from "./pages/HomePage";
import JointPhenotypePage from "./pages/JointPhenotypePage";
import PortalPage from "./pages/PortalPage";
import BlogsPage from "./pages/BlogsPage";
import BlogDetailPage from "./pages/BlogDetailPage";
import PreferencesPage from "./pages/PreferencesPage";
import ProfilePage from "./pages/ProfilePage";
import ProjectWorkspace from "./pages/ProjectWorkspace";
import SettingsPage from "./pages/SettingsPage";
import BrowseTraitsPage from "./pages/BrowseTraitsPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import ProjectsPage from "./pages/ProjectsPage";
import TeamMemberPage from "./pages/TeamMemberPage";
import DataImportPage from "./pages/DataImportPage";
import PopulationSimPage from "./pages/PopulationSimPage";
import PGSDemoPage from "./pages/PGSDemoPage";
import CommunityPage from "./pages/CommunityPage";
import QuestionDetailPage from "./pages/QuestionDetailPage";
import AskQuestionPage from "./pages/AskQuestionPage";
import SimulationStudioPage from "./pages/SimulationStudioPage";
import OnboardingPage from "./pages/OnboardingPage";
import AdminUsersPage from "./pages/AdminUsersPage";

const App: React.FC = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="team/:slug" element={<TeamMemberPage />} />
        <Route path="joint-phenotype" element={<JointPhenotypePage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="blogs" element={<BlogsPage />} />
        <Route path="blogs/:slug" element={<BlogDetailPage />} />
      </Route>

      {/* Community Routes - Separate Layout */}
      <Route path="community" element={<CommunityLayout />}>
        <Route index element={<CommunityPage />} />
        <Route path="questions/:id" element={<QuestionDetailPage />} />
        <Route path="ask" element={<AskQuestionPage />} />
      </Route>
      <Route
        path="studio"
        element={
          <RequireAuth>
            <OnboardingCheck>
              <PortalPage />
            </OnboardingCheck>
          </RequireAuth>
        }
      />
      <Route
        path="studio/projects"
        element={
          <RequireAuth>
            <OnboardingCheck>
              <ProjectsPage />
            </OnboardingCheck>
          </RequireAuth>
        }
      />
      <Route
        path="studio/browse-traits"
        element={
          <RequireAuth>
            <OnboardingCheck>
              <BrowseTraitsPage />
            </OnboardingCheck>
          </RequireAuth>
        }
      />
      <Route
        path="studio/simulation-studio"
        element={
          <RequireAuth>
            <OnboardingCheck>
              <SimulationStudioPage />
            </OnboardingCheck>
          </RequireAuth>
        }
      />
      <Route
        path="studio/analytics"
        element={
          <RequireAuth>
            <OnboardingCheck>
              <AnalyticsPage />
            </OnboardingCheck>
          </RequireAuth>
        }
      />
      <Route
        path="studio/data"
        element={
          <RequireAuth>
            <OnboardingCheck>
              <DataManagementPage />
            </OnboardingCheck>
          </RequireAuth>
        }
      />
      <Route
        path="studio/data/import"
        element={
          <RequireAuth>
            <OnboardingCheck>
              <DataImportPage />
            </OnboardingCheck>
          </RequireAuth>
        }
      />
      <Route
        path="studio/profile"
        element={
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        }
      />
      <Route
        path="studio/preferences"
        element={
          <RequireAuth>
            <PreferencesPage />
          </RequireAuth>
        }
      />
      <Route
        path="studio/settings"
        element={
          <RequireAuth>
            <SettingsPage />
          </RequireAuth>
        }
      />
      <Route
        path="studio/population"
        element={
          <RequireAuth>
            <OnboardingCheck>
              <PopulationSimPage />
            </OnboardingCheck>
          </RequireAuth>
        }
      />
      <Route
        path="studio/pgs-demo"
        element={
          <RequireAuth>
            <OnboardingCheck>
              <PGSDemoPage />
            </OnboardingCheck>
          </RequireAuth>
        }
      />
      <Route
        path="studio/admin/users"
        element={
          <RequireAuth>
            <AdminUsersPage />
          </RequireAuth>
        }
      />
      <Route
        path="studio/workspace/:projectId"
        element={
          <RequireAuth>
            <OnboardingCheck>
              <ProjectWorkspace />
            </OnboardingCheck>
          </RequireAuth>
        }
      />
      <Route path="signin" element={<SignInPage />} />
      <Route path="signup" element={<SignUpPage />} />
      <Route
        path="onboarding"
        element={
          <RequireAuth>
            <OnboardingPage />
          </RequireAuth>
        }
      />
    </Routes>
  );
};

export default App;
