import React from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

type RequireAuthProps = {
  children: React.ReactElement;
};

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { user, isAuthenticating } = useAuth();
  const location = useLocation();

  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          {/* Logo */}
          <div className="mb-8">
            <img
              src="/zygotrix-logo.png"
              alt="Zygotrix Logo"
              className="w-24 h-24 mx-auto"
            />
          </div>

          {/* Brand Name */}
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Zygotrix</h1>

          {/* Tagline */}
          <p className="text-gray-600 mb-8 text-lg">
            Genomics Analysis Platform
          </p>

          {/* Loading Indicator */}
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>

          <p className="text-gray-500 mt-4">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  return children;
};

export default RequireAuth;
