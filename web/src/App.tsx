import React from "react";
import { Route, Routes } from "react-router-dom";

import RequireAuth from "./components/dashboard/RequireAuth";
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
import GeneticCrossPage from "./pages/GeneticCrossPage";

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
        path="portal"
        element={
          <RequireAuth>
            <PortalPage />
          </RequireAuth>
        }
      />
      <Route
        path="portal/projects"
        element={
          <RequireAuth>
            <ProjectsPage />
          </RequireAuth>
        }
      />
      <Route
        path="portal/browse-traits"
        element={
          <RequireAuth>
            <BrowseTraitsPage />
          </RequireAuth>
        }
      />
      <Route
        path="portal/genetic-cross"
        element={
          <RequireAuth>
            <GeneticCrossPage />
          </RequireAuth>
        }
      />
      <Route
        path="portal/analytics"
        element={
          <RequireAuth>
            <AnalyticsPage />
          </RequireAuth>
        }
      />
      <Route
        path="portal/data"
        element={
          <RequireAuth>
            <DataManagementPage />
          </RequireAuth>
        }
      />
      <Route
        path="portal/data/import"
        element={
          <RequireAuth>
            <DataImportPage />
          </RequireAuth>
        }
      />
      <Route
        path="portal/profile"
        element={
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        }
      />
      <Route
        path="portal/preferences"
        element={
          <RequireAuth>
            <PreferencesPage />
          </RequireAuth>
        }
      />
      <Route
        path="portal/settings"
        element={
          <RequireAuth>
            <SettingsPage />
          </RequireAuth>
        }
      />
      <Route
        path="portal/population"
        element={
          <RequireAuth>
            <PopulationSimPage />
          </RequireAuth>
        }
      />
      <Route
        path="portal/pgs-demo"
        element={
          <RequireAuth>
            <PGSDemoPage />
          </RequireAuth>
        }
      />
      <Route
        path="portal/workspace/:projectId"
        element={
          <RequireAuth>
            <ProjectWorkspace />
          </RequireAuth>
        }
      />
      <Route path="signin" element={<SignInPage />} />
      <Route path="signup" element={<SignUpPage />} />
    </Routes>
  );
};

export default App;
