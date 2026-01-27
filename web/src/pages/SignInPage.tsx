import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useDocumentTitle from "../hooks/useDocumentTitle";
import {
  FiMail,
  FiLock,
  FiAlertCircle,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { GiDna2 } from "react-icons/gi";
import { FaDna } from "react-icons/fa";

// Helper function for deterministic pseudo-random numbers
const pseudoRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Floating DNA Bases Animation
const FloatingDNABases: React.FC = () => {
  const bases = React.useMemo(
    () => ["A", "T", "G", "C", "A", "T", "G", "C", "A", "G", "C", "T"],
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {bases.map((base, i) => (
        <div
          key={i}
          className="absolute font-mono font-bold text-emerald-900/10 select-none"
          style={{
            fontSize: `${20 + pseudoRandom(i * 13.5 + 1) * 30}px`,
            left: `${pseudoRandom(i * 37.2 + 2) * 100}%`,
            top: `${pseudoRandom(i * 19.8 + 3) * 100}%`,
            animation: `float ${12 + pseudoRandom(i * 41.4 + 4) * 8}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }}
        >
          {base}
        </div>
      ))}
    </div>
  );
};

const SignInPage: React.FC = () => {
  useDocumentTitle("Login | Zygotrix");
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user } = useAuth(); // Using correct properties from AuthContext

  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user types
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsAuthenticating(true);

    try {
      await signIn({ email: form.email, password: form.password });
      // Navigation is handled by the useEffect above upon successful authentication
    } catch (err: any) {
      console.error("Login failed:", err);
      // Extract error message from response if available
      const message =
        err.response?.data?.detail ||
        err.message ||
        "Invalid email or password";
      setError(message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 overflow-hidden relative font-sans">
      {/* Animated Background Elements */}
      <FloatingDNABases />

      {/* Glowing Orbs - Simplified for light theme */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal-100/50 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Left Panel - CSS Laptop Mockup */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 bg-slate-900 flex-col items-center justify-center overflow-hidden p-8">
        {/* Background Gradients */}
        <div className="absolute top-0 -left-1/4 w-full h-full bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 -right-1/4 w-full h-full bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />

        {/* Text Content */}
        <div className="relative z-20 text-center mb-12 max-w-md">
          <h2 className="text-3xl font-bold text-white mb-4">
            Scientific Intelligence <br />
            <span className="text-emerald-400">Reimagined</span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Experience the next generation of genetic analysis with our advanced AI-powered workstation.
          </p>
        </div>

        {/* Laptop Mockup */}
        <div className="relative z-10 transform hover:scale-[1.02] transition-transform duration-700 ease-out">
          {/* Screen Frame */}
          <div className="relative mx-auto bg-slate-800 rounded-t-xl border-[4px] border-slate-700 w-[420px] h-[260px] shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/10">
            {/* Camera Notch Area */}
            <div className="absolute top-0 inset-x-0 h-4 bg-slate-800 z-20 flex justify-center">
              <div className="w-20 h-full bg-slate-900/50 rounded-b-md flex items-center justify-center gap-1">
                <div className="w-1 h-1 rounded-full bg-slate-600"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-900/80 ring-1 ring-emerald-500/30"></div>
              </div>
            </div>

            {/* Screen Content: Dashboard UI */}
            <div className="flex-1 bg-slate-950 flex pt-4 relative overflow-hidden">
              {/* Sidebar */}
              <div className="w-12 border-r border-white/5 flex flex-col items-center py-3 gap-3">
                <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[10px]">
                  AI
                </div>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-md bg-white/5 active:bg-white/10"
                  />
                ))}
              </div>

              {/* Main Content */}
              <div className="flex-1 p-3 space-y-3 overflow-hidden">
                {/* Header Row */}
                <div className="flex justify-between items-center">
                  <div className="h-2 w-24 bg-white/10 rounded-full" />
                  <div className="flex gap-2">
                    <div className="h-5 w-16 bg-emerald-500/10 rounded-full border border-emerald-500/20" />
                  </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-3 gap-3 h-full pb-6">
                  {/* Card 1: Gene Sequence */}
                  <div className="col-span-2 bg-white/5 rounded-lg p-2 border border-white/5 overflow-hidden relative">
                    <div className="flex justify-between items-center mb-2">
                      <div className="h-1.5 w-12 bg-white/10 rounded-full" />
                      <div className="h-1.5 w-6 bg-emerald-400/50 rounded-full" />
                    </div>
                    <div className="space-y-1.5 animate-pulse">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex gap-1">
                          <div
                            className="h-1 rounded-full w-full bg-gradient-to-r from-emerald-500/40 to-teal-500/40"
                            style={{ width: `${Math.random() * 50 + 40}%` }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card 2: Stats */}
                  <div className="col-span-1 bg-white/5 rounded-lg p-2 border border-white/5 flex flex-col justify-between">
                    <div className="h-8 w-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin mb-1" />
                    <div className="h-1.5 w-10 bg-white/10 rounded-full" />
                  </div>

                  {/* Card 3: Chat/Analysis */}
                  <div className="col-span-3 bg-white/5 rounded-lg p-2 border border-white/5 h-20 relative overflow-hidden">
                    <div className="absolute top-2 left-2 right-2 space-y-2">
                      <div className="flex gap-2 items-center">
                        <div className="w-4 h-4 rounded-full bg-emerald-500/20" />
                        <div className="h-1.5 w-3/4 bg-white/10 rounded-full" />
                      </div>
                      <div className="flex gap-2 items-center">
                        <div className="w-4 h-4 rounded-full bg-purple-500/20" />
                        <div className="h-1.5 w-1/2 bg-white/10 rounded-full" />
                      </div>
                    </div>
                    {/* Scan line */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent h-1/2 animate-[scan_3s_ease-in-out_infinite]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Laptop Base */}
          <div className="relative mx-auto bg-slate-700 rounded-b-xl h-[16px] w-[460px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] border-t border-slate-600">
            <div className="absolute left-1/2 top-0 -translate-x-1/2 w-32 h-[4px] bg-slate-800 rounded-b-md shadow-inner"></div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative z-10 overflow-y-auto w-full">
        <div className="w-full max-w-md">
          {/* Form Card */}
          <div className="relative group">
            <div className="relative bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 sm:p-10 lg:p-12">
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">
                  Welcome Back
                </h1>
                <p className="text-sm text-slate-500">
                  Sign in to continue to <span className="font-bold text-emerald-600">Zygotrix</span>
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100"
                  style={{ animation: "shake 0.5s ease" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <FiAlertCircle className="w-4 h-4 text-red-600" />
                    </div>
                    <p className="text-sm text-red-700 font-medium">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                    Email Address
                  </label>
                  <div
                    className={`relative transition-transform duration-200 ${focusedField === "email" ? "scale-[1.01]" : ""
                      }`}
                  >
                    <div className="relative flex items-center">
                      <FiMail className="absolute left-3.5 text-slate-400 w-5 h-5" />
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        onFocus={() => setFocusedField("email")}
                        onBlur={() => setFocusedField(null)}
                        placeholder="your.email@example.com"
                        disabled={isAuthenticating}
                        autoComplete="email"
                        required
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-sm font-semibold text-slate-700">
                      Password
                    </label>
                  </div>

                  <div
                    className={`relative transition-transform duration-200 ${focusedField === "password" ? "scale-[1.01]" : ""
                      }`}
                  >
                    <div className="relative flex items-center">
                      <FiLock className="absolute left-3.5 text-slate-400 w-5 h-5" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        onFocus={() => setFocusedField("password")}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Enter your password"
                        disabled={isAuthenticating}
                        autoComplete="current-password"
                        required
                        className="w-full pl-11 pr-12 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        {showPassword ? (
                          <FiEyeOff className="w-5 h-5" />
                        ) : (
                          <FiEye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="relative w-full group overflow-hidden rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all duration-300 hover:shadow-slate-900/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
                >
                  <span className="relative flex items-center justify-center gap-2">
                    {isAuthenticating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <FaDna className="w-4 h-4 text-emerald-400" />
                        Sign In
                      </>
                    )}
                  </span>
                </button>
              </form>

              {/* Sign Up Link */}
              <div className="text-center pt-6 border-t border-slate-100 mt-6">
                <p className="text-sm text-slate-500">
                  New to Zygotrix?{" "}
                  <Link
                    to="/signup"
                    className="text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer"
                  >
                    Create Account
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Terms */}
          <p className="text-center text-xs text-slate-400 mt-6">
            By signing in, you agree to our{" "}
            <a
              href="https://zygotrix.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-slate-600 transition-colors cursor-pointer"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="https://zygotrix.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-slate-600 transition-colors cursor-pointer"
            >
              Privacy Policy
            </a>
          </p>

          {/* Mobile DNA Icon */}
          <div className="hidden sm:flex lg:hidden justify-center mt-6">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-100 rounded-full blur-xl opacity-50" />
              <GiDna2
                className="relative w-10 h-10 text-emerald-600"
                style={{ animation: "spin 15s linear infinite" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.1; }
          50% { transform: translateY(-20px) rotate(5deg); opacity: 0.15; }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes helixRotate {
          0% { transform: translateX(-50%) rotateY(0deg); }
          100% { transform: translateX(-50%) rotateY(360deg); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SignInPage;
