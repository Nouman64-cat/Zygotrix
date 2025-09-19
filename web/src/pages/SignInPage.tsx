import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../public/zygotrix-logo.png";

import { useAuth } from "../context/AuthContext";

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
  const redirectTo =
    (location.state as LocationState | null)?.from?.pathname ?? "/portal";
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState<string>("");
  const [flashMessage, setFlashMessage] = useState<string>("");

  useEffect(() => {
    if ((location.state as LocationState | null)?.fromSignup) {
      setFlashMessage("Account verified. Please sign in with your credentials.");
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
    <section className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
        <div className="flex justify-center">
          <img src={logo} alt="Zygotrix" className="h-16 w-16" />
        </div>
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-gray/60">
            Sign in
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">
            Access your portal
          </h1>
          <p className="text-sm text-slate-500">
            Use the credentials you created during sign up to unlock the
            Zygotrix portal experience.
          </p>
        </div>

        {flashMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {flashMessage}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-left text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>

          <label className="block text-left text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>

          <button
            type="submit"
            disabled={isAuthenticating}
            className="flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isAuthenticating ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Need an account?{" "}
          <Link
            to="/signup"
            className="font-semibold text-blue-700 hover:text-blue-500"
          >
            Create one now
          </Link>
        </p>
      </div>
    </section>
  );
};

export default SignInPage;
