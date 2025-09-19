import React from "react";
import { Route, Routes } from "react-router-dom";

import RequireAuth from "./components/RequireAuth";
import MainLayout from "./layouts/MainLayout";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import HomePage from "./pages/HomePage";
import PlaygroundPage from "./pages/PlaygroundPage";
import PortalPage from "./pages/PortalPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";

const App: React.FC = () => {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="playground" element={<PlaygroundPage />} />
        <Route path="portal" element={<RequireAuth><PortalPage /></RequireAuth>} />
        <Route path="contact" element={<ContactPage />} />
      </Route>
      <Route path="signin" element={<SignInPage />} />
      <Route path="signup" element={<SignUpPage />} />
    </Routes>
  );
};

export default App;
