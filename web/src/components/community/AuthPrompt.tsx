import React from "react";
import { useNavigate } from "react-router-dom";
import { FiAlertCircle, FiLogIn, FiUserPlus } from "react-icons/fi";

interface AuthPromptProps {
  message?: string;
  action?: string;
}

const AuthPrompt: React.FC<AuthPromptProps> = ({
  message = "You must be logged in to perform this action",
  action = "continue",
}) => {
  const navigate = useNavigate();

  const handleSignIn = () => {
    navigate("/signin", {
      state: { from: { pathname: window.location.pathname } },
    });
  };

  const handleSignUp = () => {
    navigate("/signup", {
      state: { from: { pathname: window.location.pathname } },
    });
  };

  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <FiAlertCircle className="h-5 w-5 text-blue-600" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-blue-900 mb-1">
            Authentication Required
          </h3>
          <p className="text-sm text-blue-700 mb-4">{message}</p>
          <div className="flex gap-3">
            <button
              onClick={handleSignIn}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition shadow-sm"
            >
              <FiLogIn className="h-4 w-4" />
              Sign In to {action}
            </button>
            <button
              onClick={handleSignUp}
              className="inline-flex items-center gap-2 rounded-lg bg-white border border-blue-200 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition shadow-sm"
            >
              <FiUserPlus className="h-4 w-4" />
              Create Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPrompt;
