import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface OnboardingCheckProps {
  children: React.ReactNode;
}

const OnboardingCheck: React.FC<OnboardingCheckProps> = ({ children }) => {
  const { user, isAuthenticating } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Don't check if still authenticating or already on onboarding page
    if (isAuthenticating || location.pathname === "/onboarding") {
      return;
    }

    // If user is loaded and hasn't completed onboarding, redirect to onboarding
    if (user && !user.onboarding_completed) {
      navigate("/onboarding", { replace: true });
    }
  }, [user, isAuthenticating, navigate, location.pathname]);

  // Show nothing while checking (parent RequireAuth will handle loading state)
  if (isAuthenticating) {
    return null;
  }

  // If onboarding not completed and not on onboarding page, show nothing (redirect will happen)
  if (user && !user.onboarding_completed && location.pathname !== "/onboarding") {
    return null;
  }

  return <>{children}</>;
};

export default OnboardingCheck;
