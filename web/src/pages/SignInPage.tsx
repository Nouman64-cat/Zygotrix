import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import logo from "../../public/zygotrix-logo.png";

import { useAuth } from "../context/AuthContext";
import DNAStrand from "../components/marketing_site/home/DNAStrand";
import GeneticCode from "../components/marketing_site/home/GeneticCode";

type LocationState = {
  from?: { pathname: string };
  fromSignup?: boolean;
};

const extractErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message);
      if (parsed && typeof parsed === "object" && "detail" in parsed) {
        return String(parsed.detail);
      }
    } catch {
      /* noop */
    }
    return error.message;
  }
  return "Something went wrong. Please try again.";
};

const SignInPage: React.FC = () => {
  const { signIn, isAuthenticating } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for redirect URL in multiple places: URL params, then location state, then default
  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get("redirect");
  const stateRedirect = (location.state as LocationState | null)?.from
    ?.pathname;
  const redirectTo = redirectParam || stateRedirect || "/portal";
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
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A]/5 via-transparent to-[#10B981]/5" />

        {/* Molecular Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(circle at 20px 20px, #1E3A8A 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Floating Genetic Code Animation */}
        <GeneticCode />
      </div>

      <div className="relative z-10 grid min-h-screen lg:grid-cols-2">
        {/* Left Side - DNA Visualization */}
        <div className="hidden lg:flex items-center justify-center relative overflow-hidden">
          {/* Background Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A]/10 via-[#3B82F6]/5 to-[#10B981]/10" />

          <div className="relative z-10 w-full max-w-2xl">
            <div className="text-center mb-2">
              <h2 className="text-4xl font-bold text-[#1E3A8A] mb-4">
                Secure Access to Your
                <span className="block bg-gradient-to-r from-[#1E3A8A] to-[#10B981] bg-clip-text text-transparent">
                  Genetic Research Portal
                </span>
              </h2>
              <p className="text-lg text-slate-600 max-w-md mx-auto">
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
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#1E3A8A]/10 via-[#3B82F6]/10 to-[#10B981]/10 opacity-0 blur-xl transition-opacity duration-500 hover:opacity-100" />

              <div className="relative space-y-8 rounded-3xl border border-white/80 bg-white/95 backdrop-blur-sm p-8 shadow-2xl shadow-slate-200/60">
                {/* Logo and Header */}
                <div className="text-center space-y-4">
                  <div className="relative inline-block">
                    <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-[#1E3A8A]/20 to-[#10B981]/20 blur-lg opacity-50" />
                    <img
                      src={logo}
                      alt="Zygotrix"
                      className="relative h-16 w-16 mx-auto"
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#1E3A8A]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#1E3A8A]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] animate-pulse" />
                      Sign In
                    </span>
                    <h1 className="text-3xl font-bold text-[#1E3A8A]">
                      Welcome Back
                    </h1>
                    <p className="text-sm text-slate-600 max-w-sm mx-auto">
                      Access your Zygotrix portal to continue your genetic
                      research and analysis.
                    </p>
                  </div>
                </div>

                {/* Flash Messages */}
                {flashMessage && (
                  <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100/50 px-4 py-3 text-sm text-emerald-700 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {flashMessage}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-gradient-to-r from-red-50 to-red-100/50 px-4 py-3 text-sm text-red-600 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      {error}
                    </div>
                  </div>
                )}

                {/* Sign In Form */}
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
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
                          className="w-full rounded-full border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-900 shadow-inner transition-all duration-300 focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:bg-white group-hover:border-slate-300"
                          placeholder="researcher@university.edu"
                        />
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#1E3A8A]/5 to-[#10B981]/5 opacity-0 pointer-events-none transition-opacity duration-300 group-focus-within:opacity-100" />
                      </div>
                    </div>

                    <div className="group">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
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
                          className="w-full rounded-full border border-slate-200 bg-white/80 px-4 py-3 pr-12 text-sm text-slate-900 shadow-inner transition-all duration-300 focus:border-[#3B82F6] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/20 focus:bg-white group-hover:border-slate-300"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors duration-200 z-10 cursor-pointer"
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
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#1E3A8A]/5 to-[#10B981]/5 opacity-0 pointer-events-none transition-opacity duration-300 group-focus-within:opacity-100" />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="group relative w-full overflow-hidden rounded-full bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] px-6 py-3 text-sm text-white shadow-lg shadow-[#1E3A8A]/30 transition-all duration-300 hover:shadow-[#1E3A8A]/50 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 disabled:scale-100"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#162b63] to-[#2563EB] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="relative flex items-center justify-center gap-2">
                      {isAuthenticating ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                          Authenticating...
                        </>
                      ) : (
                        "Access Portal"
                      )}
                    </span>
                  </button>
                </form>

                {/* Sign Up Link */}
                <div className="text-center">
                  <p className="text-sm text-slate-600">
                    New to Zygotrix?{" "}
                    <Link
                      to="/signup"
                      state={{ from: { pathname: redirectTo } }}
                      className="font-semibold text-[#1E3A8A] hover:text-[#3B82F6] transition-colors duration-300"
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
