import { useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft, FiArrowRight, FiMail, FiLock, FiUser, FiRefreshCw } from "react-icons/fi";
import AccentButton from "../../components/common/AccentButton";
import { authService } from "../../services/useCases/authService";

const SignUpPage = () => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"details" | "verify">("details");
  const [message, setMessage] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const handleDetailsSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await authService.startSignup(email.trim(), password, fullName.trim() || undefined);
      setMessage(response.message);
      setExpiresAt(response.expiresAt);
      setStep("verify");
    } catch (err) {
      setError("Unable to start signup. Please check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await authService.verifySignup(email.trim(), otp.trim());
      setMessage(response.message + " You can now sign in.");
    } catch (err) {
      setError("Invalid code. Please verify and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      const response = await authService.resendSignup(email.trim());
      setMessage(response.message);
      setExpiresAt(response.expiresAt);
    } catch (err) {
      setError("Unable to resend code at this time.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#03050f] text-white">
      <div className="relative isolate">
        <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-purple-500/30 via-purple-500/10 to-transparent blur-3xl" />
        <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-16 sm:px-8">
          <div className="grid w-full gap-10 rounded-[2.75rem] border border-white/10 bg-[#050816]/80 p-8 backdrop-blur sm:p-12 md:grid-cols-[1fr_1fr]">
            <div className="space-y-6">
              <Link to="/signin" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-indigo-200">
                <FiArrowLeft /> Back to sign in
              </Link>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Join Zygotrix University.
              </h1>
              <p className="text-sm text-slate-300">
                Create your account to unlock studio-grade courses, adaptive practice, and Simulation Studio missions.
              </p>
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
                <p className="font-semibold text-white">How signup works</p>
                <ol className="mt-3 space-y-2 text-sm text-slate-300 list-decimal list-inside">
                  <li>Enter your details and submit the form.</li>
                  <li>Check your email for the verification code.</li>
                  <li>Enter the code to activate your account.</li>
                  <li>Sign in and access your personalised dashboard.</li>
                </ol>
              </div>
            </div>

            {step === "details" ? (
              <form
                onSubmit={handleDetailsSubmit}
                className="flex flex-col gap-5 rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:p-8"
              >
                <div className="space-y-2">
                  <label className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-200">
                    Full name
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-200" />
                    <input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Taylor Morgan"
                      className="w-full rounded-full border border-white/10 bg-[#0d1327] py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-200">
                    Email address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-200" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@company.com"
                      className="w-full rounded-full border border-white/10 bg-[#0d1327] py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-200">
                    Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-200" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full rounded-full border border-white/10 bg-[#0d1327] py-3 pl-12 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
                    />
                  </div>
                </div>

                {error && (
                  <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Creating account…" : "Continue"}
                </button>

                <p className="text-xs text-slate-400">
                  By continuing you agree to the Zygotrix University terms and privacy policy.
                </p>
              </form>
            ) : (
              <form
                onSubmit={handleVerifySubmit}
                className="flex flex-col gap-5 rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:p-8"
              >
                <div className="space-y-2">
                  <label className="text-sm font-semibold uppercase tracking-[0.3em] text-indigo-200">
                    Verification code
                  </label>
                  <input
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    placeholder="6-digit code"
                    minLength={6}
                    maxLength={6}
                    className="w-full rounded-full border border-white/10 bg-[#0d1327] px-4 py-3 text-center text-lg tracking-[0.5em] text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
                  />
                </div>

                {message && (
                  <p className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs text-indigo-100">
                    {message}
                    {expiresAt && (
                      <span className="ml-1 text-[10px] text-indigo-200">
                        Expires at {new Date(expiresAt).toLocaleTimeString()}
                      </span>
                    )}
                  </p>
                )}

                {error && (
                  <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-200">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Verifying…" : "Verify & activate"}
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-indigo-200 transition hover:border-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FiRefreshCw className={resending ? "animate-spin" : ""} />
                  Resend code
                </button>

                <AccentButton to="/signin" variant="secondary" icon={<FiArrowRight />}>
                  Go to sign in
                </AccentButton>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
