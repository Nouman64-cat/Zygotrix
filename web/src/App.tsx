import React from "react";
import { Route, Routes } from "react-router-dom";

import RequireAuth from "./components/dashboard/RequireAuth";
import OnboardingCheck from "./components/dashboard/OnboardingCheck";
import MainLayout from "./layouts/MainLayout";
import CommunityLayout from "./layouts/CommunityLayout";
import AboutPage from "./pages/AboutPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ContactPage from "./pages/ContactPage";
import DnaGeneratorPage from "./pages/DnaGeneratorPage";
import PunnettSquarePage from "./pages/PunnettSquarePage";
import DnaToProteinPage from "./pages/DnaToProteinPage";
import ZygoAIPage from "./pages/ZygoAIPage";
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
import ProteinFoldGenerationPage from "./pages/ProteinFoldGenerationPage";
import OnboardingPage from "./pages/OnboardingPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminNewsletterPage from "./pages/AdminNewsletterPage";
import AdminContactPage from "./pages/AdminContactPage";
import AdminTokenUsagePage from "./pages/AdminTokenUsagePage";
import AdminJobQueuePage from "./pages/AdminJobQueuePage";
import AdminChatbotSettingsPage from "./pages/AdminChatbotSettingsPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import ZygotrixAIChatPage from "./pages/ZygotrixAIChatPage";
import { SimulationToolProvider } from "./context/SimulationToolContext";

const AppContent: React.FC = () => {

  return (
    <>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="dna-generator" element={<DnaGeneratorPage />} />
          <Route path="punnett-square" element={<PunnettSquarePage />} />
          <Route path="dna-to-protein" element={<DnaToProteinPage />} />
          <Route path="zygoai" element={<ZygoAIPage />} />
          <Route path="team/:slug" element={<TeamMemberPage />} />
          <Route path="joint-phenotype" element={<JointPhenotypePage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="blogs" element={<BlogsPage />} />
          <Route path="blogs/:slug" element={<BlogDetailPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="terms" element={<TermsPage />} />
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
                <SimulationToolProvider>
                  <SimulationStudioPage />
                </SimulationToolProvider>
              </OnboardingCheck>
            </RequireAuth>
          }
        />
        <Route
          path="studio/protein-fold-generation"
          element={
            <RequireAuth>
              <OnboardingCheck>
                <ProteinFoldGenerationPage />
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
            <RequireAuth allowedRoles={["super_admin"]}>
              <AdminUsersPage />
            </RequireAuth>
          }
        />
        <Route
          path="studio/admin/newsletter"
          element={
            <RequireAuth allowedRoles={["super_admin"]}>
              <AdminNewsletterPage />
            </RequireAuth>
          }
        />
        <Route
          path="studio/admin/contact"
          element={
            <RequireAuth allowedRoles={["super_admin"]}>
              <AdminContactPage />
            </RequireAuth>
          }
        />
        <Route
          path="studio/admin/token-usage"
          element={
            <RequireAuth allowedRoles={["admin", "super_admin"]}>
              <AdminTokenUsagePage />
            </RequireAuth>
          }
        />
        <Route
          path="studio/admin/chatbot-settings"
          element={
            <RequireAuth allowedRoles={["admin", "super_admin"]}>
              <AdminChatbotSettingsPage />
            </RequireAuth>
          }
        />
        <Route
          path="studio/admin/job-queue"
          element={
            <RequireAuth allowedRoles={["super_admin"]}>
              <AdminJobQueuePage />
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

        {/* Zygotrix AI Chat Routes */}
        <Route
          path="ai"
          element={
            <RequireAuth>
              <ZygotrixAIChatPage />
            </RequireAuth>
          }
        />
        <Route
          path="ai/c/:conversationId"
          element={
            <RequireAuth>
              <ZygotrixAIChatPage />
            </RequireAuth>
          }
        />
      </Routes>
    </>
  );
};

const App: React.FC = () => {
  return <AppContent />;
};

export default App;
