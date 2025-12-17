import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiAlertCircle, FiCheck, FiArrowLeft } from 'react-icons/fi';
import { Button, Input, Logo } from '../components/common';
import authService from '../services/auth/auth.service';

type Step = 'signup' | 'verify';

export const Register: React.FC = () => {
    const navigate = useNavigate();

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [otp, setOtp] = useState('');

    // UI state
    const [step, setStep] = useState<Step>('signup');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);

    const validatePassword = (pwd: string): string | null => {
        if (pwd.length < 8) {
            return 'Password must be at least 8 characters long';
        }
        return null;
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
            setError('Please fill in all required fields');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
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
            });

            setExpiresAt(response.expires_at);
            setSuccess(response.message);
            setStep('verify');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error
                ? err.message
                : (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to sign up. Please try again.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!otp.trim() || otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setIsLoading(true);

        try {
            const response = await authService.verifyOtp({
                email: email.trim(),
                otp: otp.trim(),
            });

            setSuccess(response.message);

            // Redirect to login after successful verification
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error
                ? err.message
                : (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Invalid OTP. Please try again.';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            const response = await authService.resendOtp({
                email: email.trim(),
            });

            setExpiresAt(response.expires_at);
            setSuccess(response.message);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error
                ? err.message
                : (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to resend OTP. Please try again.';
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
        return `${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-black/20 p-8 space-y-6 border border-transparent dark:border-gray-800">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        <div className="flex justify-center mb-4">
                            <Logo size="lg" showText={false} />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                            {step === 'signup' ? 'Create Account' : 'Verify Email'}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            {step === 'signup'
                                ? 'Sign up to start using Zygotrix AI'
                                : `Enter the 6-digit code sent to ${email}`}
                        </p>
                    </div>

                    {/* Success Message */}
                    {success && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 flex items-start gap-3">
                            <FiCheck className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" size={20} />
                            <p className="text-sm text-emerald-800 dark:text-emerald-400">{success}</p>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                            <FiAlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
                            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {/* Signup Form */}
                    {step === 'signup' && (
                        <form onSubmit={handleSignup} className="space-y-4">
                            <Input
                                type="text"
                                label="Full Name"
                                placeholder="John Doe"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                leftIcon={<FiUser size={18} />}
                                disabled={isLoading}
                                autoComplete="name"
                            />

                            <Input
                                type="email"
                                label="Email Address"
                                placeholder="your.email@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                leftIcon={<FiMail size={18} />}
                                disabled={isLoading}
                                autoComplete="email"
                                required
                            />

                            <Input
                                type="password"
                                label="Password"
                                placeholder="At least 8 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                leftIcon={<FiLock size={18} />}
                                disabled={isLoading}
                                autoComplete="new-password"
                                required
                            />

                            <Input
                                type="password"
                                label="Confirm Password"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                leftIcon={<FiLock size={18} />}
                                disabled={isLoading}
                                autoComplete="new-password"
                                required
                            />

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full !bg-emerald-600 hover:!bg-emerald-700"
                                isLoading={isLoading}
                                disabled={isLoading}
                                size="lg"
                            >
                                Create Account
                            </Button>
                        </form>
                    )}

                    {/* OTP Verification Form */}
                    {step === 'verify' && (
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Verification Code
                                </label>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    maxLength={6}
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50"
                                />
                                {expiresAt && (
                                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                                        Code expires in {formatExpiryTime(expiresAt)}
                                    </p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full !bg-emerald-600 hover:!bg-emerald-700"
                                isLoading={isLoading}
                                disabled={isLoading || otp.length !== 6}
                                size="lg"
                            >
                                Verify Email
                            </Button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={isLoading}
                                    className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium disabled:opacity-50"
                                >
                                    Didn't receive the code? Resend
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setStep('signup')}
                                className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                                <FiArrowLeft size={16} />
                                Back to signup
                            </button>
                        </form>
                    )}

                    {/* Login Link */}
                    {step === 'signup' && (
                        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"
                                    onClick={() => navigate('/login')}
                                >
                                    Sign In
                                </button>
                            </p>
                        </div>
                    )}
                </div>

                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                    By creating an account, you agree to our Terms of Service and Privacy Policy
                </p>
            </div>
        </div>
    );
};
