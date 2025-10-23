import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiArrowRight,
  FiMail,
  FiLock,
  FiUser,
  FiRefreshCw,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import AccentButton from "../../components/common/AccentButton";
import { authService } from "../../services/useCases/authService";

const SignUpPage = () => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"details" | "verify">("details");
  const [message, setMessage] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const handleDetailsSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await authService.startSignup(
        email.trim(),
        password,
        fullName.trim() || undefined
      );
      setMessage(response.message);
      setExpiresAt(response.expiresAt);
      setStep("verify");
    } catch {
      setError(
        "Unable to start signup. Please check your details and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifySubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await authService.verifySignup(email.trim(), otp.trim());
      setMessage(response.message + " You can now sign in.");
    } catch {
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
    } catch {
      setError("Unable to resend code at this time.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <div className="relative isolate">
        <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-purple-500/30 via-purple-500/10 to-transparent blur-3xl" />
        <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-16 sm:px-8">
          <div className="grid w-full gap-10 rounded-[2.75rem] border border-border bg-overlay p-8 backdrop-blur transition-colors sm:p-12 md:grid-cols-[1fr_1fr]">
            <div className="space-y-6">
              <Link
                to="/signin"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-accent transition-colors hover:text-foreground"
              >
                <FiArrowLeft /> Back to sign in
              </Link>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Join Zygotrix University.
              </h1>
              <p className="text-sm text-muted">
                Create your account to unlock studio-grade courses, adaptive
                practice, and Simulation Studio missions.
              </p>
              <div className="rounded-[2rem] border border-border bg-background-subtle p-6 text-sm text-muted transition-colors">
                <p className="font-semibold text-foreground">
                  How signup works
                </p>
                <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-muted">
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
                className="flex flex-col gap-5 rounded-[2rem] border border-border bg-surface p-6 transition-colors sm:p-8"
              >
                <div className="space-y-2">
                  <label className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">
                    Full name
                  </label>
                  <div className="relative">
                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-accent" />
                    <input
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="Taylor Morgan"
                      className="w-full rounded-full border border-border bg-background-subtle py-3 pl-12 pr-4 text-sm text-foreground placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 ring-offset-theme"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">
                    Email address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-accent" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@company.com"
                      className="w-full rounded-full border border-border bg-background-subtle py-3 pl-12 pr-4 text-sm text-foreground placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 ring-offset-theme"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">
                    Password
                  </label>
                  <div className="relative">
                    <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-accent" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full rounded-full border border-border bg-background-subtle py-3 pl-12 pr-12 text-sm text-foreground placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 ring-offset-theme"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-accent transition-colors cursor-pointer"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <FiEyeOff className="h-4 w-4" />
                      ) : (
                        <FiEye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-500">
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

                <p className="text-xs text-muted">
                  By continuing you agree to the Zygotrix University terms and
                  privacy policy.
                </p>

                <p className="text-center text-sm text-muted">
                  Already have an account?{" "}
                  <Link
                    to="/signin"
                    className="font-semibold text-accent hover:text-foreground transition-colors cursor-pointer"
                  >
                    Sign in
                  </Link>
                </p>
              </form>
            ) : (
              <form
                onSubmit={handleVerifySubmit}
                className="flex flex-col gap-5 rounded-[2rem] border border-border bg-surface p-6 transition-colors sm:p-8"
              >
                <div className="space-y-2">
                  <label className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">
                    Verification code
                  </label>
                  <input
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    placeholder="6-digit code"
                    minLength={6}
                    maxLength={6}
                    className="w-full rounded-full border border-border bg-background-subtle px-4 py-3 text-center text-lg tracking-[0.5em] text-foreground placeholder:text-muted transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2 ring-offset-theme"
                  />
                </div>

                {message && (
                  <p className="rounded-xl border border-accent bg-accent-soft px-4 py-2 text-xs text-foreground">
                    {message}
                    {expiresAt && (
                      <span className="ml-1 text-[10px] text-accent">
                        Expires at {new Date(expiresAt).toLocaleTimeString()}
                      </span>
                    )}
                  </p>
                )}

                {error && (
                  <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm text-rose-500">
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
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-secondary-button bg-secondary-button px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-secondary-button transition-colors hover:bg-secondary-button-hover disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FiRefreshCw className={resending ? "animate-spin" : ""} />
                  Resend code
                </button>

                <AccentButton
                  to="/signin"
                  variant="secondary"
                  icon={<FiArrowRight />}
                >
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
