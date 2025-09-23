import React from "react";
import { Route, Routes } from "react-router-dom";

import RequireAuth from "./components/RequireAuth";
import MainLayout from "./layouts/MainLayout";
import AboutPage from "./pages/AboutPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ContactPage from "./pages/ContactPage";
import DataManagementPage from "./pages/DataManagementPage";
import HomePage from "./pages/HomePage";
import JointPhenotypePage from "./pages/JointPhenotypePage";
import PlaygroundPage from "./pages/PlaygroundPage";
import PortalPage from "./pages/PortalPage";
import PreferencesPage from "./pages/PreferencesPage";
import ProfilePage from "./pages/ProfilePage";
import ProjectWorkspace from "./pages/ProjectWorkspace";
import SettingsPage from "./pages/SettingsPage";
import TraitManagementPage from "./pages/TraitManagementPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import ProjectsPage from "./pages/ProjectsPage";

const App: React.FC = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="playground" element={<PlaygroundPage />} />
        <Route path="joint-phenotype" element={<JointPhenotypePage />} />
        <Route path="contact" element={<ContactPage />} />
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
        path="portal/traits"
        element={
          <RequireAuth>
            <TraitManagementPage />
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
