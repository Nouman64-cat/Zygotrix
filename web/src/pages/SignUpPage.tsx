import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../../public/zygotrix-logo.png";

import {
  requestSignupOtp,
  resendSignupOtp,
  verifySignupOtp,
} from "../services/authApi";
import type { SignupInitiateResponse } from "../types/auth";

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

const SignUpPage: React.FC = () => {
  const OTP_LENGTH = 6;
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
  });
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const otpInputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const [pendingEmail, setPendingEmail] = useState<string>("");
  const [step, setStep] = useState<"form" | "otp" | "success">("form");
  const [error, setError] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

  const handleOtpInputChange = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleOtpKeyDown = (index: number) => (event: React.KeyboardEvent<HTMLInputElement>) => {
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

  const handleOtpPaste = (index: number) => (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const raw = (event.clipboardData.getData("text") || "").replace(/[^0-9]/g, "");
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

  const handleVerifySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
    <section className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-16">
      <div className="w-full max-w-xl space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
        <div className="flex justify-center">
          <img src={logo} alt="Zygotrix" className="h-16 w-16" />
        </div>

        {step === "form" && (
          <>
            <div className="space-y-2 text-center">
              <p className="text-xs uppercase tracking-[0.35em] text-gray/60">Create account</p>
              <h1 className="text-3xl font-semibold text-slate-900">Join the Zygotrix portal</h1>
              <p className="text-sm text-slate-500">
                Submit your details and we will send a one-time password to verify your email address.
              </p>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmitForm}>
              <label className="block text-left text-sm font-medium text-slate-700">
                Full name (optional)
                <input
                  type="text"
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Dr. Amina Farooq"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>

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
                  minLength={8}
                  required
                  autoComplete="new-password"
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link to="/signin" className="font-semibold text-blue-700 hover:text-blue-500">
                Sign in instead
              </Link>
            </p>
          </>
        )}

        {step === "otp" && (
          <>
            <div className="space-y-2 text-center">
              <p className="text-xs uppercase tracking-[0.35em] text-gray/60">Verify OTP</p>
              <h1 className="text-3xl font-semibold text-slate-900">Check your inbox</h1>
              <p className="text-sm text-slate-500">
                We sent a six-digit code to <span className="font-semibold">{pendingEmail}</span>. Enter it below to
                complete your signup.
              </p>
              {message && <p className="text-xs text-slate-500">{message}</p>}
              {formatExpiry(expiresAt) && (
                <p className="text-xs text-slate-400">
                  Code expires at <span className="font-semibold">{formatExpiry(expiresAt)}</span>
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleVerifySubmit}>
              <fieldset className="flex flex-col gap-3">
                <legend className="sr-only">One-time password</legend>
                <label className="text-left text-sm font-medium text-slate-700" aria-hidden="true">
                  One-time password
                </label>
                <div className="flex justify-between gap-2" role="group" aria-label="One-time password inputs">
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
                      className="flex h-14 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-center text-lg font-semibold text-slate-900 shadow-inner transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  ))}
                </div>
              </fieldset>

              <button
                type="submit"
                disabled={isSubmitting || otpDigits.join("").length !== OTP_LENGTH}
                className="flex w-full items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isSubmitting ? "Verifying..." : "Verify"}
              </button>
            </form>

            <button
              type="button"
              onClick={handleResend}
              disabled={isSubmitting}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
            >
              {isSubmitting ? "Sending..." : "Resend OTP"}
            </button>

            <p className="text-center text-sm text-slate-500">
              Entered the wrong email?{" "}
              <button
                type="button"
                onClick={handleStartOver}
                className="font-semibold text-blue-700 hover:text-blue-500"
              >
                Start over
              </button>
            </p>
          </>
        )}

        {step === "success" && (
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.35em] text-gray/60">All set</p>
              <h1 className="text-3xl font-semibold text-slate-900">Account verified</h1>
              <p className="text-sm text-slate-500">{message || "You can now sign in with your credentials."}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/signin", { replace: true, state: { fromSignup: true } })}
              className="mx-auto flex w-full max-w-[14rem] items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-slate-800"
            >
              Go to sign in
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default SignUpPage;
