import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiAlertCircle, FiCheck, FiArrowLeft, FiEye, FiEyeOff } from 'react-icons/fi';
import { GiDna2 } from 'react-icons/gi';
import { FaDna } from 'react-icons/fa';
import { Logo } from '../components/common';
import authService from '../services/auth/auth.service';

type Step = 'signup' | 'verify' | 'success';

// Floating DNA Bases Animation
const FloatingDNABases: React.FC = () => {
    const bases = ['A', 'T', 'G', 'C', 'A', 'T', 'G', 'C', 'A', 'G', 'C', 'T'];
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {bases.map((base, i) => (
                <div
                    key={i}
                    className="absolute font-mono font-bold text-emerald-500/10 dark:text-emerald-400/10 select-none"
                    style={{
                        fontSize: `${20 + Math.random() * 30}px`,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animation: `float ${12 + Math.random() * 8}s ease-in-out infinite`,
                        animationDelay: `${i * 0.4}s`,
                    }}
                >
                    {base}
                </div>
            ))}
        </div>
    );
};

// DNA Double Helix Visualization
const DNAHelix: React.FC = () => {
    return (
        <div className="relative w-40 h-80">
            {[...Array(16)].map((_, i) => {
                const rotation = i * 22.5;
                const yPos = i * 5;
                const colors = [
                    { left: 'from-red-400 to-red-600', right: 'from-green-400 to-green-600' },
                    { left: 'from-blue-400 to-blue-600', right: 'from-yellow-400 to-yellow-600' },
                    { left: 'from-green-400 to-green-600', right: 'from-red-400 to-red-600' },
                    { left: 'from-yellow-400 to-yellow-600', right: 'from-blue-400 to-blue-600' },
                ];
                const color = colors[i % 4];

                return (
                    <div
                        key={i}
                        className="absolute left-1/2 w-full flex items-center justify-between px-2"
                        style={{
                            top: `${yPos}%`,
                            transform: `translateX(-50%) rotateY(${rotation}deg)`,
                            animation: `helixRotate 10s linear infinite`,
                            animationDelay: `${i * 0.1}s`,
                        }}
                    >
                        <div
                            className={`w-4 h-4 rounded-full bg-gradient-to-br ${color.left} shadow-lg`}
                            style={{ boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)' }}
                        />
                        <div className="flex-1 h-0.5 mx-2 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600 opacity-60" />
                        <div
                            className={`w-4 h-4 rounded-full bg-gradient-to-br ${color.right} shadow-lg`}
                            style={{ boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)' }}
                        />
                    </div>
                );
            })}
        </div>
    );
};

// Step Indicator
const StepIndicator: React.FC<{ currentStep: Step }> = ({ currentStep }) => {
    const steps = [
        { key: 'signup', label: 'Account' },
        { key: 'verify', label: 'Verify' },
        { key: 'success', label: 'Done' },
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
                                ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                }`}
                        >
                            {i < currentIdx ? <FiCheck className="w-5 h-5" /> : i + 1}
                        </div>
                        <span
                            className={`mt-2 text-xs font-medium transition-colors duration-300 ${i <= currentIdx
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-gray-400 dark:text-gray-500'
                                }`}
                        >
                            {step.label}
                        </span>
                    </div>

                    {/* Connector Line */}
                    {i < steps.length - 1 && (
                        <div
                            className={`w-16 sm:w-20 h-0.5 mx-2 transition-colors duration-300 ${i < currentIdx
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                            style={{ marginTop: '-1.25rem' }}
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
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [fullName, setFullName] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);

    // UI state
    const [step, setStep] = useState<Step>('signup');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const otpInputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

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

        if (!email.trim() || !password.trim()) {
            setError('Please fill in all required fields');
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
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to sign up. Please try again.';
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
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpInputRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
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
        setError('');
        setSuccess('');

        const otpValue = otp.join('');
        if (otpValue.length !== 6) {
            setError('Please enter a valid 6-digit code');
            return;
        }

        setIsLoading(true);

        try {
            const response = await authService.verifyOtp({
                email: email.trim(),
                otp: otpValue,
            });

            setSuccess(response.message);
            setStep('success');
        } catch (err: unknown) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Invalid code. Please try again.';
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
            setOtp(['', '', '', '', '', '']);
        } catch (err: unknown) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to resend code. Please try again.';
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
        <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-emerald-950/20 overflow-hidden relative">
            {/* Animated Background Elements */}
            <FloatingDNABases />

            {/* Glowing Orbs */}
            <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-emerald-500/5 to-transparent rounded-full" />

            {/* Grid Pattern */}
            <div
                className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
                style={{
                    backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.3) 1px, transparent 1px)',
                    backgroundSize: '50px 50px',
                }}
            />

            {/* Left Panel - DNA Visualization (Desktop) */}
            <div className="hidden lg:flex lg:w-1/2 items-center justify-center relative z-10">
                <div className="text-center px-8">
                    {/* Animated Logo */}
                    <div className="relative inline-flex mb-10">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-2xl opacity-30 animate-pulse" style={{ animationDuration: '3s' }} />
                        <div className="relative w-28 h-28 flex items-center justify-center">
                            <Logo size="lg" showText={false} />
                        </div>
                    </div>

                    <h2 className="text-4xl xl:text-5xl font-bold mb-6">
                        <span className="text-gray-800 dark:text-white">
                            {step === 'signup' && 'Join'}
                            {step === 'verify' && 'Almost There!'}
                            {step === 'success' && 'Welcome!'}
                        </span>
                        <span className="block mt-2 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 bg-clip-text text-transparent">
                            {step === 'signup' && 'Zygotrix AI'}
                            {step === 'verify' && 'Verify Your Email'}
                            {step === 'success' && 'You\'re All Set'}
                        </span>
                    </h2>

                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-12 leading-relaxed">
                        {step === 'signup' && 'Start your journey with AI-powered genetics analysis and research tools.'}
                        {step === 'verify' && 'We\'ve sent a verification code to secure your account.'}
                        {step === 'success' && 'Your account is ready. Sign in to start exploring!'}
                    </p>

                    {/* DNA Helix Animation */}
                    <div className="flex justify-center mb-10">
                        <DNAHelix />
                    </div>

                    {/* Feature Tags */}
                    <div className="flex flex-wrap justify-center gap-3">
                        {['AI-Powered', 'Genetics Insights', 'DNA Analysis', 'Research Tools'].map((tag) => (
                            <span
                                key={tag}
                                className="px-4 py-2 rounded-full text-sm font-medium bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 border border-white/50 dark:border-gray-700/50 backdrop-blur-sm shadow-sm"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel - Forms */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative z-10 overflow-y-auto">
                <div className="w-full max-w-md">
                    {/* Form Card */}
                    <div className="relative group">
                        {/* Animated Gradient Border */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 rounded-3xl opacity-20 blur-lg group-hover:opacity-30 transition-opacity duration-500" style={{ animation: 'gradient-x 4s ease infinite', backgroundSize: '200% 200%' }} />

                        <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/50 dark:border-gray-700/50 shadow-2xl shadow-gray-300/20 dark:shadow-black/30 p-5 sm:p-8 lg:p-10">
                            {/* Header */}
                            <div className="text-center mb-4 sm:mb-6">
                                <div className="flex justify-center mb-3 sm:mb-4">
                                    <div className="relative">
                                        <div className="absolute -inset-2 sm:-inset-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full opacity-20 blur-xl animate-pulse" style={{ animationDuration: '3s' }} />
                                        <Logo size="md" showText={false} className="sm:scale-110" />
                                    </div>
                                </div>

                                {/* Step Indicator */}
                                <StepIndicator currentStep={step} />
                            </div>

                            {/* Messages */}
                            {success && (
                                <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 border border-emerald-200/50 dark:border-emerald-800/30" style={{ animation: 'fadeIn 0.3s ease' }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                            <FiCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">{success}</p>
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/10 border border-red-200/50 dark:border-red-800/30" style={{ animation: 'shake 0.5s ease' }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                                            <FiAlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                        </div>
                                        <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
                                    </div>
                                </div>
                            )}

                            {/* Step: Signup Form */}
                            {step === 'signup' && (
                                <form onSubmit={handleSignup} className="space-y-4 sm:space-y-5">
                                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white text-center mb-1 sm:mb-2">Create Account</h2>
                                    <p className="text-gray-600 dark:text-gray-400 text-center text-xs sm:text-sm mb-4 sm:mb-6">Start your genetics research journey</p>

                                    {/* Full Name */}
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Full Name</label>
                                        <div className={`relative transition-transform duration-200 ${focusedField === 'name' ? 'scale-[1.02]' : ''}`}>
                                            <div className={`absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl opacity-0 blur transition-opacity duration-300 ${focusedField === 'name' ? 'opacity-40' : ''}`} />
                                            <div className="relative flex items-center">
                                                <FiUser className="absolute left-4 text-gray-400 dark:text-gray-500 w-5 h-5" />
                                                <input
                                                    type="text"
                                                    value={fullName}
                                                    onChange={(e) => setFullName(e.target.value)}
                                                    onFocus={() => setFocusedField('name')}
                                                    onBlur={() => setFocusedField(null)}
                                                    placeholder="John Doe"
                                                    disabled={isLoading}
                                                    className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none transition-all duration-300"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Email Address *</label>
                                        <div className={`relative transition-transform duration-200 ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
                                            <div className={`absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl opacity-0 blur transition-opacity duration-300 ${focusedField === 'email' ? 'opacity-40' : ''}`} />
                                            <div className="relative flex items-center">
                                                <FiMail className="absolute left-4 text-gray-400 dark:text-gray-500 w-5 h-5" />
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    onFocus={() => setFocusedField('email')}
                                                    onBlur={() => setFocusedField(null)}
                                                    placeholder="your.email@example.com"
                                                    disabled={isLoading}
                                                    required
                                                    className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none transition-all duration-300"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Password *</label>
                                        <div className={`relative transition-transform duration-200 ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
                                            <div className={`absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl opacity-0 blur transition-opacity duration-300 ${focusedField === 'password' ? 'opacity-40' : ''}`} />
                                            <div className="relative flex items-center">
                                                <FiLock className="absolute left-4 text-gray-400 dark:text-gray-500 w-5 h-5" />
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    onFocus={() => setFocusedField('password')}
                                                    onBlur={() => setFocusedField(null)}
                                                    placeholder="At least 8 characters"
                                                    disabled={isLoading}
                                                    required
                                                    className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none transition-all duration-300"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                                >
                                                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="relative w-full group overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    >
                                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                        <span className="relative flex items-center justify-center gap-2">
                                            {isLoading ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                    Creating Account...
                                                </>
                                            ) : (
                                                <>
                                                    <FaDna className="w-5 h-5" />
                                                    Create Account
                                                </>
                                            )}
                                        </span>
                                    </button>

                                    {/* Login Link */}
                                    <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Already have an account?{' '}
                                            <button
                                                type="button"
                                                onClick={() => navigate('/login')}
                                                className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold"
                                            >
                                                Sign In
                                            </button>
                                        </p>
                                    </div>
                                </form>
                            )}

                            {/* Step: OTP Verification */}
                            {step === 'verify' && (
                                <form onSubmit={handleVerifyOtp} className="space-y-4 sm:space-y-6">
                                    <div className="text-center">
                                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1.5 sm:mb-2">Verify Your Email</h2>
                                        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                                            Enter the 6-digit code sent to{' '}
                                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{email}</span>
                                        </p>
                                    </div>

                                    {/* OTP Input */}
                                    <div className="flex justify-center gap-2">
                                        {otp.map((digit, index) => (
                                            <input
                                                key={index}
                                                ref={(el) => { otpInputRefs.current[index] = el }}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                                onPaste={handleOtpPaste}
                                                disabled={isLoading}
                                                className="w-10 h-10 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-lg sm:rounded-xl bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:border-emerald-500 focus:outline-none transition-all duration-200 disabled:opacity-50"
                                            />
                                        ))}
                                    </div>

                                    {expiresAt && (
                                        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                                            Code expires in <span className="font-semibold">{formatExpiryTime(expiresAt)}</span>
                                        </p>
                                    )}

                                    {/* Verify Button */}
                                    <button
                                        type="submit"
                                        disabled={isLoading || otp.join('').length !== 6}
                                        className="relative w-full group overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    >
                                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
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
                                            className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium disabled:opacity-50"
                                        >
                                            Didn't receive the code? Resend
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setStep('signup')}
                                            className="flex items-center justify-center gap-2 w-full text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                        >
                                            <FiArrowLeft className="w-4 h-4" />
                                            Back to signup
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Step: Success */}
                            {step === 'success' && (
                                <div className="text-center space-y-6">
                                    <div className="relative inline-flex items-center justify-center w-24 h-24 mx-auto">
                                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-xl opacity-40 animate-pulse" />
                                        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                                            <FiCheck className="w-12 h-12 text-white" />
                                        </div>
                                    </div>

                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Account Created!</h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Your Zygotrix AI account is ready. Sign in to start exploring!
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => navigate('/login')}
                                        className="relative w-full group overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
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
                    <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-4 sm:mt-6">
                        By creating an account, you agree to our Terms of Service and Privacy Policy
                    </p>

                    {/* Mobile DNA Icon */}
                    <div className="hidden sm:flex lg:hidden justify-center mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-xl opacity-30" />
                            <GiDna2 className="relative w-10 h-10 text-emerald-600 dark:text-emerald-400" style={{ animation: 'spin 15s linear infinite' }} />
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
      `}</style>
        </div>
    );
};
