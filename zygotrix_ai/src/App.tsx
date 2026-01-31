import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ThemeProvider, VoiceControlProvider, PreferencesProvider, ConversationsProvider } from './contexts';
import { ProtectedRoute } from './components/common';
import { Chat, Login, Register, ForgotPassword, SettingsPage } from './pages';
import PedigreeWorkspace from './components/pedigree/PedigreeWorkspace';

const App = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <PreferencesProvider>
            <ConversationsProvider>
              <VoiceControlProvider>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route
                    path="/chat/:conversationId"
                    element={
                      <ProtectedRoute>
                        <Chat />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/chat"
                    element={
                      <ProtectedRoute>
                        <Chat />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <SettingsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/pedigree"
                    element={
                      <ProtectedRoute>
                        <PedigreeWorkspace />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/" element={<Navigate to="/chat" replace />} />
                  <Route path="*" element={<Navigate to="/chat" replace />} />
                </Routes>
              </VoiceControlProvider>
            </ConversationsProvider>
          </PreferencesProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;