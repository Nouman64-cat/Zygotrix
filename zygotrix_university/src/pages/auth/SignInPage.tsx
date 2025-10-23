import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiLock, FiMail, FiArrowRight, FiEye, FiEyeOff } from "react-icons/fi";
import AccentButton from "../../components/common/AccentButton";
import { useAuth } from "../../context/AuthContext";

const SignInPage = () => {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const redirectTo = params.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(redirectTo, { replace: true });
    }
  }, [user, redirectTo, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch {
      setError(
        "Unable to sign in. Please check your credentials and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      <div className="relative isolate">
        <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-indigo-500/30 via-indigo-500/10 to-transparent blur-3xl" />
        <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-16 sm:px-8">
          <div className="grid w-full gap-10 rounded-[2.75rem] border border-border bg-overlay p-8 backdrop-blur transition-colors sm:p-12 md:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-accent bg-accent-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-accent transition-colors">
                Zygotrix University
              </span>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Welcome back, builder.
              </h1>
              <p className="text-sm text-muted">
                Sign in with your Zygotrix credentials to access your programs,
                Simulation Studio missions, and adaptive practice dashboard.
              </p>
              <div className="rounded-[2rem] border border-border bg-background-subtle p-6 text-sm text-muted transition-colors">
                <p className="font-semibold text-foreground">
                  Need an account?
                </p>
                <p className="mt-2 text-sm text-muted">
                  Join the next cohort and unlock studio-crafted learning
                  experiences.
                </p>
                <AccentButton
                  to="/signup"
                  variant="secondary"
                  className="mt-4"
                  icon={<FiArrowRight />}
                >
                  Create an account
                </AccentButton>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-5 rounded-[2rem] border border-border bg-surface p-6 transition-colors sm:p-8"
            >
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
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
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
                {submitting ? "Signing in…" : "Sign in"}
              </button>

              <p className="text-xs text-muted">
                By continuing you agree to the Zygotrix University terms and
                privacy policy.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;
