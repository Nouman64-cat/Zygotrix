import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { LOGO_URL } from "../config";

import { useAuth } from "../context/AuthContext";
import DNAStrand from "../components/marketing_site/home/DNAStrand";
import GeneticCode from "../components/marketing_site/home/GeneticCode";
import useDocumentTitle from "../hooks/useDocumentTitle";

type LocationState = {
  from?: { pathname: string };
  fromSignup?: boolean;
};

const SignInPage: React.FC = () => {
  useDocumentTitle("Sign In");

  const { signIn, isAuthenticating } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for redirect URL in multiple places: URL params, then location state, then default
  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get("redirect");
  const stateRedirect = (location.state as LocationState | null)?.from
    ?.pathname;

  // If coming from community, redirect back to community; otherwise go to studio
  let redirectTo = "/studio";
  if (redirectParam) {
    redirectTo = redirectParam;
  } else if (stateRedirect) {
    // Check if coming from community routes
    if (stateRedirect.startsWith("/community")) {
      redirectTo = stateRedirect;
    } else {
      redirectTo = "/studio";
    }
  }
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string>("");
  const [flashMessage, setFlashMessage] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);

  useEffect(() => {
    if ((location.state as LocationState | null)?.fromSignup) {
      setFlashMessage(
        "Account verified. Please sign in with your credentials."
      );
    }
  }, [location.state]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setFlashMessage("");
    try {
      await signIn({ email: form.email, password: form.password });
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      // Extract and display proper error message
      let errorMessage =
        "Invalid credentials. Please check your email and password.";

      if (err?.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-white dark:bg-gray-950 transition-colors duration-300">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[600px] h-[600px] bg-gradient-to-bl from-emerald-50/40 via-teal-50/20 to-transparent dark:from-emerald-900/10 dark:via-teal-900/5 dark:to-transparent rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[600px] h-[600px] bg-gradient-to-tr from-emerald-50/40 via-teal-50/20 to-transparent dark:from-emerald-900/10 dark:via-teal-900/5 dark:to-transparent rounded-full blur-3xl opacity-50" />
      </div>

      {/* Floating Genetic Code Animation */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <GeneticCode />
      </div>

      <div className="relative z-10 grid min-h-screen lg:grid-cols-2">
        {/* Left Side - DNA Visualization */}
        <div className="hidden lg:flex items-center justify-center relative overflow-hidden">
          <div className="relative z-10 w-full max-w-2xl">
            <div className="text-center mb-2">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Secure Access to Your
                <span className="block text-emerald-600 dark:text-emerald-400">
                  Genetic Research Studio
                </span>
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Your gateway to advanced genetic analysis, trait modeling, and
                simulation tools.
              </p>
            </div>

            {/* DNA Strand Visualization */}
            <div className="relative flex items-center justify-center">
              <div className="relative w-full max-w-lg h-[500px]">
                <DNAStrand />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Sign In Form */}
        <div className="flex items-center justify-center px-4 py-16 lg:px-8">
          <div className="w-full max-w-md">
            {/* Form Container */}
            <div className="relative">
              {/* Glow Effect Behind Form */}
              {/* Glow Effect Behind Form */}
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 opacity-0 blur-xl transition-opacity duration-500 hover:opacity-100" />

              <div className="relative space-y-8 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm p-8 shadow-2xl shadow-gray-200/50 dark:shadow-none">
                {/* Logo and Header */}
                <div className="text-center space-y-4">
                  <div className="relative inline-block">
                    <div className="absolute -inset-2 rounded-full bg-emerald-500/10 blur-lg opacity-50" />
                    <img
                      src={LOGO_URL}
                      alt="Zygotrix"
                      className="relative h-16 w-16 mx-auto"
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Sign In
                    </span>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      Welcome Back
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                      Access your Zygotrix studio to continue your genetic
                      research and analysis.
                    </p>
                  </div>
                </div>

                {/* Flash Messages */}
                {flashMessage && (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-100 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                      {flashMessage}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl border border-red-500/30 bg-red-100 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500 dark:bg-red-400" />
                      {error}
                    </div>
                  </div>
                )}

                {/* Sign In Form */}
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          required
                          autoComplete="email"
                          className="w-full rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 px-4 py-3 text-sm text-gray-900 dark:text-white shadow-sm transition-all duration-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white dark:focus:bg-gray-900 group-hover:border-gray-400 dark:group-hover:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500"
                          placeholder="researcher@university.edu"
                        />
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 pointer-events-none transition-opacity duration-300 group-focus-within:opacity-100" />
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          value={form.password}
                          onChange={handleChange}
                          required
                          autoComplete="current-password"
                          className="w-full rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800/50 px-4 py-3 pr-12 text-sm text-gray-900 dark:text-white shadow-sm transition-all duration-300 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:bg-white dark:focus:bg-gray-900 group-hover:border-gray-400 dark:group-hover:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 z-10 cursor-pointer"
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <FaEyeSlash className="h-5 w-5" />
                          ) : (
                            <FaEye className="h-5 w-5" />
                          )}
                        </button>
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 pointer-events-none transition-opacity duration-300 group-focus-within:opacity-100" />
                      </div>
                    </div>
                  </div>

                  {/* Forgot Password Link */}
                  <div className="text-right">
                    <Link
                      to="/forgot-password"
                      className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors duration-300"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="group relative w-full overflow-hidden rounded-full bg-gray-900 dark:bg-white px-6 py-3 text-sm text-white dark:text-gray-900 shadow-lg transition-all duration-300 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 disabled:scale-100 cursor-pointer border border-transparent dark:border-gray-200"
                  >
                    <span className="relative flex items-center justify-center gap-2 font-medium">
                      {isAuthenticating ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 dark:border-gray-900/20 border-t-white dark:border-t-gray-900" />
                          Authenticating...
                        </>
                      ) : (
                        "Login"
                      )}
                    </span>
                  </button>
                </form>

                {/* Sign Up Link */}
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    New to Zygotrix?{" "}
                    <Link
                      to="/signup"
                      state={{ from: { pathname: redirectTo } }}
                      className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors duration-300"
                    >
                      Create your account
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SignInPage;
