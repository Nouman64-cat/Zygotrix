import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import logo from "../../public/zygotrix-logo.png";

import {
  requestSignupOtp,
  resendSignupOtp,
  verifySignupOtp,
} from "../services/auth.api";
import type { SignupInitiateResponse } from "../types/auth";
import DNAStrand from "../components/marketing_site/home/DNAStrand";
import GeneticCode from "../components/marketing_site/home/GeneticCode";

const formatExpiry = (value: string | null): string | null => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
  return "We could not complete your request. Please try again.";
};

type LocationState = {
  from?: { pathname: string };
};

const SignUpPage: React.FC = () => {
  const OTP_LENGTH = 6;
  const navigate = useNavigate();
  const location = useLocation();

  // Check for redirect URL in location state
  const redirectTo =
    (location.state as LocationState | null)?.from?.pathname || "/studio";
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
  });
  const [otpDigits, setOtpDigits] = useState<string[]>(
    Array(OTP_LENGTH).fill("")
  );
  const otpInputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const [pendingEmail, setPendingEmail] = useState<string>("");
  const [step, setStep] = useState<"form" | "otp" | "success">("form");
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);

  const updateExpiryState = (response: SignupInitiateResponse) => {
    setMessage(response.message);
    setExpiresAt(response.expires_at);
  };

  useEffect(() => {
    if (step === "otp") {
      const timer = window.setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 80);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [step]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      const response = await requestSignupOtp({
        email: form.email,
        password: form.password,
        full_name: form.full_name.trim() ? form.full_name : undefined,
      });
      setPendingEmail(form.email);
      setOtpDigits(Array(OTP_LENGTH).fill(""));
      updateExpiryState(response);
      setStep("otp");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpInputChange =
    (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value.replace(/[^0-9]/g, "");
      setOtpDigits((current) => {
        const next = [...current];
        next[index] = value.slice(-1);
        return next;
      });
      if (value && index < OTP_LENGTH - 1) {
        otpInputsRef.current[index + 1]?.focus();
      }
    };

  const handleOtpKeyDown =
    (index: number) => (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
        event.preventDefault();
        otpInputsRef.current[index - 1]?.focus();
        setOtpDigits((current) => {
          const next = [...current];
          next[index - 1] = "";
          return next;
        });
      }
      if (event.key === "ArrowLeft" && index > 0) {
        otpInputsRef.current[index - 1]?.focus();
      }
      if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
        otpInputsRef.current[index + 1]?.focus();
      }
    };

  const handleOtpPaste =
    (index: number) => (event: React.ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault();
      const raw = (event.clipboardData.getData("text") || "").replace(
        /[^0-9]/g,
        ""
      );
      if (!raw) {
        return;
      }
      setOtpDigits((current) => {
        const next = [...current];
        for (let offset = 0; offset < OTP_LENGTH; offset += 1) {
          const target = index + offset;
          if (target >= OTP_LENGTH) {
            break;
          }
          next[target] = raw[offset] ?? next[target];
        }
        return next;
      });
      const targetIndex = Math.min(index + raw.length, OTP_LENGTH - 1);
      window.requestAnimationFrame(() => {
        otpInputsRef.current[targetIndex]?.focus();
      });
    };

  const handleVerifySubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    const otp = otpDigits.join("");
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      if (otp.length !== OTP_LENGTH) {
        throw new Error("Please enter the complete verification code.");
      }
      const response = await verifySignupOtp({ email: pendingEmail, otp });
      setMessage(response.message);
      setStep("success");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!pendingEmail) {
      return;
    }
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      const response = await resendSignupOtp({ email: pendingEmail });
      updateExpiryState(response);
      setOtpDigits(Array(OTP_LENGTH).fill(""));
      window.setTimeout(() => otpInputsRef.current[0]?.focus(), 80);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartOver = () => {
    setStep("form");
    setPendingEmail("");
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    setError("");
    setMessage("");
    setExpiresAt(null);
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50/30 to-emerald-50/30 dark:from-slate-900 dark:via-blue-900/10 dark:to-emerald-900/10">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A8A]/5 via-transparent to-[#10B981]/5 dark:from-[#1E3A8A]/5 dark:via-transparent dark:to-[#10B981]/5" />

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
              <h2 className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">
                {step === "form" && (
                  <>
                    Begin Your Journey in
                    <span className="block bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent">
                      Genetic Research
                    </span>
                  </>
                )}
                {step === "otp" && (
                  <>
                    Almost There!
                    <span className="block bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent">
                      Verify Your Email
                    </span>
                  </>
                )}
                {step === "success" && (
                  <>
                    Account Created!
                    <span className="block bg-gradient-to-r from-blue-600 to-emerald-600 dark:from-blue-400 dark:to-emerald-400 bg-clip-text text-transparent">
                      Ready to Explore
                    </span>
                  </>
                )}
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                {step === "form" &&
                  "Join thousands of researchers using Zygotrix for cutting-edge genetic analysis."}
                {step === "otp" &&
                  "We've sent a verification code to secure your account and begin your research journey."}
                {step === "success" &&
                  "Your account is ready! Sign in to access powerful genetic modeling tools."}
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

        {/* Right Side - Sign Up Forms */}
        <div className="flex items-center justify-center px-4 py-16 lg:px-8">
          <div className="w-full max-w-md">
            {/* Form Container */}
            <div className="relative">
              {/* Glow Effect Behind Form */}
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#1E3A8A]/10 via-[#3B82F6]/10 to-[#10B981]/10 opacity-0 blur-xl transition-opacity duration-500 hover:opacity-100" />

              <div className="relative space-y-8 rounded-3xl border border-slate-200 dark:border-slate-700/80 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm p-8 shadow-2xl shadow-slate-300/30 dark:shadow-black/20">
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
                </div>

                {/* Step: Registration Form */}
                {step === "form" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 dark:bg-blue-900/20 px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                        Create Account
                      </span>
                      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Join Zygotrix
                      </h1>
                      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                        Enter your details to create your research account and
                        unlock genetic modeling tools.
                      </p>
                    </div>

                    {error && (
                      <div className="rounded-2xl border border-red-500/30 bg-red-100 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 animate-fade-in">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-red-500 dark:bg-red-400" />
                          {error}
                        </div>
                      </div>
                    )}

                    <form className="space-y-5" onSubmit={handleSubmitForm}>
                      <div className="space-y-4">
                        <div className="group">
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Full Name (Optional)
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              name="full_name"
                              value={form.full_name}
                              onChange={handleChange}
                              placeholder="Dr. Amina Farooq"
                              className="w-full rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 px-4 py-3 text-sm text-slate-900 dark:text-white shadow-inner transition-all duration-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-900 group-hover:border-slate-400 dark:group-hover:border-slate-500 placeholder-slate-400 dark:placeholder-slate-500"
                            />
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#1E3A8A]/5 to-[#10B981]/5 opacity-0 pointer-events-none transition-opacity duration-300 group-focus-within:opacity-100" />
                          </div>
                        </div>

                        <div className="group">
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
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
                              placeholder="researcher@university.edu"
                              className="w-full rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 px-4 py-3 text-sm text-slate-900 dark:text-white shadow-inner transition-all duration-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-900 group-hover:border-slate-400 dark:group-hover:border-slate-500 placeholder-slate-400 dark:placeholder-slate-500"
                            />
                            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#1E3A8A]/5 to-[#10B981]/5 opacity-0 pointer-events-none transition-opacity duration-300 group-focus-within:opacity-100" />
                          </div>
                        </div>

                        <div className="group">
                          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Password
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              name="password"
                              value={form.password}
                              onChange={handleChange}
                              minLength={8}
                              required
                              autoComplete="new-password"
                              placeholder="Minimum 8 characters"
                              className="w-full rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 px-4 py-3 pr-12 text-sm text-slate-900 dark:text-white shadow-inner transition-all duration-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-900 group-hover:border-slate-400 dark:group-hover:border-slate-500 placeholder-slate-400 dark:placeholder-slate-500"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200 z-10 cursor-pointer"
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

                      {/* Terms and Privacy Agreement */}
                      <div className="flex items-start gap-3">
                        <div className="flex items-center h-5 mt-0.5">
                          <input
                            id="agree-terms"
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-blue-600 focus:ring-blue-500 focus:ring-2 focus:ring-offset-0 cursor-pointer transition-colors"
                          />
                        </div>
                        <label
                          htmlFor="agree-terms"
                          className="text-sm text-slate-600 dark:text-slate-400 cursor-pointer"
                        >
                          I agree to the{" "}
                          <Link
                            to="/terms"
                            className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors underline"
                            target="_blank"
                          >
                            Terms of Service
                          </Link>{" "}
                          and{" "}
                          <Link
                            to="/privacy"
                            className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors underline"
                            target="_blank"
                          >
                            Privacy Policy
                          </Link>
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting || !agreedToTerms}
                        className="group relative w-full overflow-hidden rounded-full bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] px-6 py-3 text-sm text-white shadow-lg shadow-[#1E3A8A]/30 transition-all duration-300 hover:shadow-[#1E3A8A]/50 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 disabled:scale-100 cursor-pointer"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#162b63] to-[#2563EB] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        <span className="relative flex items-center justify-center gap-2">
                          {isSubmitting ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                              Sending Code...
                            </>
                          ) : (
                            "Send Verification Code"
                          )}
                        </span>
                      </button>
                    </form>

                    <div className="text-center">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Already have an account?{" "}
                        <Link
                          to="/signin"
                          state={{ from: { pathname: redirectTo } }}
                          className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors duration-300"
                        >
                          Sign in here
                        </Link>
                      </p>
                    </div>
                  </div>
                )}

                {/* Step: OTP Verification */}
                {step === "otp" && (
                  <div className="space-y-6">
                    <div className="text-center space-y-2">
                      <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 dark:bg-blue-900/20 px-4 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                        Verify Code
                      </span>
                      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Check Your Email
                      </h1>
                      <div className="space-y-1">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          We sent a 6-digit code to{" "}
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {pendingEmail}
                          </span>
                        </p>
                        {message && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {message}
                          </p>
                        )}
                        {formatExpiry(expiresAt) && (
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            Expires at{" "}
                            <span className="font-semibold">
                              {formatExpiry(expiresAt)}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    {error && (
                      <div className="rounded-2xl border border-red-500/30 bg-red-100 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 animate-fade-in">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-red-500 dark:bg-red-400" />
                          {error}
                        </div>
                      </div>
                    )}

                    <form className="space-y-6" onSubmit={handleVerifySubmit}>
                      <div className="space-y-4">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 text-center">
                          Verification Code
                        </label>
                        <div className="flex justify-center gap-2">
                          {otpDigits.map((digit, index) => (
                            <input
                              key={index}
                              ref={(element) => {
                                otpInputsRef.current[index] = element;
                              }}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={1}
                              value={digit}
                              onChange={handleOtpInputChange(index)}
                              onKeyDown={handleOtpKeyDown(index)}
                              onPaste={handleOtpPaste(index)}
                              className="h-14 w-12 rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-center text-lg font-bold text-slate-900 dark:text-white shadow-inner transition-all duration-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-900 hover:border-slate-400 dark:hover:border-slate-500"
                            />
                          ))}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={
                          isSubmitting ||
                          otpDigits.join("").length !== OTP_LENGTH
                        }
                        className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#1E3A8A] to-[#3B82F6] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1E3A8A]/30 transition-all duration-300 hover:shadow-[#1E3A8A]/50 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70 disabled:scale-100 cursor-pointer"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#162b63] to-[#2563EB] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        <span className="relative flex items-center justify-center gap-2">
                          {isSubmitting ? (
                            <>
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                              Verifying...
                            </>
                          ) : (
                            "Verify & Create Account"
                          )}
                        </span>
                      </button>
                    </form>

                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={isSubmitting}
                        className="w-full rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800/50 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-all duration-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                      >
                        {isSubmitting ? "Sending..." : "Resend Code"}
                      </button>

                      <div className="text-center">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Wrong email?{" "}
                          <button
                            type="button"
                            onClick={handleStartOver}
                            className="font-semibold cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors duration-300"
                          >
                            Change email
                          </button>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step: Success */}
                {step === "success" && (
                  <div className="space-y-6 text-center">
                    <div className="space-y-4">
                      <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-[#10B981] to-[#059669] mx-auto">
                        <svg
                          className="w-10 h-10 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>

                      <div className="space-y-2">
                        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 dark:bg-emerald-900/20 px-4 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                          Success
                        </span>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                          Account Created!
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                          {message ||
                            "Your Zygotrix account is ready. Sign in to begin your genetic research journey."}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigate("/signin", {
                          replace: true,
                          state: {
                            fromSignup: true,
                            from: { pathname: redirectTo },
                          },
                        })
                      }
                      className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#10B981] to-[#059669] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#10B981]/30 transition-all duration-300 hover:shadow-[#10B981]/50 hover:scale-[1.02]"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#047857] to-[#065f46] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                      <span className="relative">Continue to Sign In</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SignUpPage;
