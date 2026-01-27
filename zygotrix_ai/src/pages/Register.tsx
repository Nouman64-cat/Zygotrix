import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiMail,
  FiLock,
  FiUser,
  FiAlertCircle,
  FiCheck,
  FiArrowLeft,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import { GiDna2 } from "react-icons/gi";
import { FaDna } from "react-icons/fa";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import authService from "../services/auth/auth.service";

type Step = "signup" | "verify" | "success";

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



// Step Indicator
const StepIndicator: React.FC<{ currentStep: Step }> = ({ currentStep }) => {
  const steps = [
    { key: "signup", label: "Account" },
    { key: "verify", label: "Verify" },
    { key: "success", label: "Done" },
  ];

  const getCurrentIndex = () => steps.findIndex((s) => s.key === currentStep);
  const currentIdx = getCurrentIndex();

  return (
    <div className="flex items-center justify-center mb-6">
      {steps.map((step, i) => (
        <React.Fragment key={step.key}>
          {/* Step Circle + Label */}
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${i <= currentIdx
                ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                : "bg-slate-100 text-slate-400"
                }`}
            >
              {i < currentIdx ? <FiCheck className="w-5 h-5" /> : i + 1}
            </div>
            <span
              className={`mt-2 text-xs font-medium transition-colors duration-300 ${i <= currentIdx
                ? "text-slate-900"
                : "text-slate-400"
                }`}
            >
              {step.label}
            </span>
          </div>

          {/* Connector Line */}
          {i < steps.length - 1 && (
            <div
              className={`w-16 sm:w-20 h-0.5 mx-2 transition-colors duration-300 ${i < currentIdx
                ? "bg-slate-900"
                : "bg-slate-100"
                }`}
              style={{ marginTop: "-1.25rem" }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export const Register: React.FC = () => {
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  // UI state
  const [step, setStep] = useState<Step>("signup");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const otpInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return "Password must be at least 8 characters long";
    }
    return null;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim() || !password.trim() || !fullName.trim() || !phone.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.signup({
        email: email.trim(),

        password,
        full_name: fullName.trim() || undefined,
        phone: phone.trim(),
      });

      setExpiresAt(response.expires_at);
      setSuccess(response.message);
      setStep("verify");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { detail?: string } } })?.response
            ?.data?.detail || "Failed to sign up. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pastedData) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      otpInputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.verifyOtp({
        email: email.trim(),
        otp: otpValue,
      });

      setSuccess(response.message);
      setStep("success");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { detail?: string } } })?.response
            ?.data?.detail || "Invalid code. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await authService.resendOtp({
        email: email.trim(),
      });

      setExpiresAt(response.expires_at);
      setSuccess(response.message);
      setOtp(["", "", "", "", "", ""]);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { detail?: string } } })?.response
            ?.data?.detail || "Failed to resend code. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatExpiryTime = (expiresAtStr: string): string => {
    const expiresDate = new Date(expiresAtStr);
    const now = new Date();
    const diffMs = expiresDate.getTime() - now.getTime();
    const diffMins = Math.max(0, Math.ceil(diffMs / 60000));
    return `${diffMins} minute${diffMins !== 1 ? "s" : ""}`;
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
                <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-[10px]">AI</div>
                {[1, 2, 3].map(i => <div key={i} className="w-5 h-5 rounded-md bg-white/5 active:bg-white/10" />)}
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
                          <div className="h-1 rounded-full w-full bg-gradient-to-r from-emerald-500/40 to-teal-500/40" style={{ width: `${Math.random() * 50 + 40}%` }} />
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

      {/* Right Panel - Forms */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative z-10 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Form Card */}
          <div className="relative group">

            <div className="relative bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 p-6 sm:p-10 lg:p-12">
              {/* Header */}
              <div className="text-center mb-4 sm:mb-6">

                {/* Step Indicator */}
                <StepIndicator currentStep={step} />
              </div>

              {/* Messages */}
              {success && (
                <div
                  className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100"
                  style={{ animation: "fadeIn 0.3s ease" }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <FiCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-sm text-emerald-700 font-medium">
                      {success}
                    </p>
                  </div>
                </div>
              )}

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

              {/* Step: Signup Form */}
              {step === "signup" && (
                <form
                  onSubmit={handleSignup}
                  className="space-y-4 sm:space-y-5"
                >
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-1 sm:mb-2">
                    Create Account
                  </h2>
                  <p className="text-slate-500 text-center text-xs sm:text-sm mb-4 sm:mb-6">
                    Start your genetics research journey
                  </p>

                  {/* Full Name */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Full Name *
                    </label>
                    <div
                      className={`relative transition-transform duration-200 ${focusedField === "name" ? "scale-[1.01]" : ""
                        }`}
                    >
                      <div className="relative flex items-center">
                        <FiUser className="absolute left-3 text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          onFocus={() => setFocusedField("name")}
                          onBlur={() => setFocusedField(null)}
                          placeholder="John Doe"
                          disabled={isLoading}
                          required
                          className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Email Address *
                    </label>
                    <div
                      className={`relative transition-transform duration-200 ${focusedField === "email" ? "scale-[1.01]" : ""
                        }`}
                    >
                      <div className="relative flex items-center">
                        <FiMail className="absolute left-3 text-slate-400 w-4 h-4" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setFocusedField("email")}
                          onBlur={() => setFocusedField(null)}
                          placeholder="your.email@example.com"
                          disabled={isLoading}
                          required
                          className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Phone Number *
                    </label>
                    <div
                      className={`relative transition-transform duration-200 ${focusedField === "phone" ? "scale-[1.01]" : ""
                        }`}
                    >
                      <PhoneInput
                        country={"us"}
                        value={phone}
                        onChange={(phone) => setPhone(phone)}
                        onFocus={() => setFocusedField("phone")}
                        onBlur={() => setFocusedField(null)}
                        inputClass="!w-full !pl-12 !pr-4 !py-2.5 sm:!py-3 !rounded-xl !bg-slate-50 !border !border-slate-200 !text-sm !text-slate-900 !placeholder-slate-400 focus:!border-emerald-500 focus:!outline-none focus:!ring-4 focus:!ring-emerald-500/10 !transition-all !duration-300 !h-auto !shadow-none"
                        containerClass="!w-full"
                        buttonClass="!rounded-l-xl !border-0 !bg-transparent !pl-2 hover:!bg-transparent"
                        dropdownClass="!bg-white !text-slate-900 !border-slate-200 !shadow-xl !rounded-xl overflow-hidden"
                        buttonStyle={{ backgroundColor: "transparent", border: "none" }}
                        inputStyle={{ width: "100%", height: "46px" }}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">
                      Password *
                    </label>
                    <div
                      className={`relative transition-transform duration-200 ${focusedField === "password" ? "scale-[1.01]" : ""
                        }`}
                    >
                      <div className="relative flex items-center">
                        <FiLock className="absolute left-3 text-slate-400 w-4 h-4" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setFocusedField("password")}
                          onBlur={() => setFocusedField(null)}
                          placeholder="At least 8 characters"
                          disabled={isLoading}
                          required
                          className="w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all duration-300"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                        >
                          {showPassword ? (
                            <FiEyeOff className="w-4 h-4" />
                          ) : (
                            <FiEye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="relative w-full group overflow-hidden rounded-xl bg-slate-900 px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all duration-300 hover:shadow-slate-900/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
                  >
                    <span className="relative flex items-center justify-center gap-2">
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          <FaDna className="w-4 h-4 text-emerald-400" />
                          Create Account
                        </>
                      )}
                    </span>
                  </button>

                  {/* Login Link */}
                  <div className="text-center pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-500">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => navigate("/login")}
                        className="text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer"
                      >
                        Sign In
                      </button>
                    </p>
                  </div>
                </form>
              )}

              {/* Step: OTP Verification */}
              {step === "verify" && (
                <form
                  onSubmit={handleVerifyOtp}
                  className="space-y-4 sm:space-y-6"
                >
                  <div className="text-center">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1.5 sm:mb-2">
                      Verify Your Email
                    </h2>
                    <p className="text-slate-500 text-xs sm:text-sm">
                      Enter the 6-digit code sent to{" "}
                      <span className="font-semibold text-emerald-600">
                        {email}
                      </span>
                    </p>
                  </div>

                  {/* OTP Input */}
                  <div className="flex justify-center gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          otpInputRefs.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={handleOtpPaste}
                        disabled={isLoading}
                        className="w-10 h-10 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-lg sm:rounded-xl bg-slate-50 border-2 border-slate-200 text-slate-900 focus:border-emerald-500 focus:outline-none transition-all duration-200 disabled:opacity-50"
                      />
                    ))}
                  </div>

                  {expiresAt && (
                    <p className="text-center text-xs text-slate-500">
                      Code expires in{" "}
                      <span className="font-semibold">
                        {formatExpiryTime(expiresAt)}
                      </span>
                    </p>
                  )}

                  {/* Verify Button */}
                  <button
                    type="submit"
                    disabled={isLoading || otp.join("").length !== 6}
                    className="relative w-full group overflow-hidden rounded-xl bg-slate-900 px-5 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold text-white shadow-lg shadow-slate-900/20 transition-all duration-300 hover:shadow-slate-900/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 cursor-pointer"
                  >
                    <span className="relative flex items-center justify-center gap-2">
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <FiCheck className="w-5 h-5" />
                          Verify Email
                        </>
                      )}
                    </span>
                  </button>

                  {/* Resend & Back */}
                  <div className="space-y-3 text-center">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isLoading}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50 cursor-pointer"
                    >
                      Didn't receive the code? Resend
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep("signup")}
                      className="flex items-center justify-center gap-2 w-full text-sm text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      <FiArrowLeft className="w-4 h-4" />
                      Back to signup
                    </button>
                  </div>
                </form>
              )}

              {/* Step: Success */}
              {step === "success" && (
                <div className="text-center space-y-6">
                  <div className="relative inline-flex items-center justify-center w-24 h-24 mx-auto">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-xl opacity-40 animate-pulse" />
                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                      <FiCheck className="w-12 h-12 text-white" />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      Account Created!
                    </h2>
                    <p className="text-slate-600">
                      Your Zygotrix AI account is ready. Sign in to start
                      exploring!
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="relative w-full group overflow-hidden rounded-xl bg-slate-900 px-5 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold text-white shadow-lg shadow-slate-900/20 transition-all duration-300 hover:shadow-slate-900/40 hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
                  >
                    <span className="relative flex items-center justify-center gap-2">
                      <FaDna className="w-5 h-5" />
                      Continue to Sign In
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Terms */}
          <p className="text-center text-[10px] sm:text-xs text-slate-500 mt-3 sm:mt-4">
            By creating an account, you agree to our{" "}
            <a
              href="https://zygotrix.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-emerald-600 transition-colors cursor-pointer"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="https://zygotrix.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-emerald-600 transition-colors cursor-pointer"
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
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
