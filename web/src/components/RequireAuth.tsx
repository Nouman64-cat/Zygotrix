import React from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

type RequireAuthProps = {
  children: React.ReactElement;
};

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { user, isAuthenticating } = useAuth();
  const location = useLocation();

  if (isAuthenticating) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-gray/80">
        Checking access...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  return children;
};

export default RequireAuth;
