import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import { GiDna2 } from 'react-icons/gi';
import { FaDna } from 'react-icons/fa';
import { useAuth } from '../contexts';
import { Logo } from '../components/common';

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

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
      await login({ email: email.trim(), password });
      navigate('/chat');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to login. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
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
            <span className="text-gray-800 dark:text-white">Welcome to</span>
            <span className="block mt-2 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 bg-clip-text text-transparent">
              Zygotrix AI
            </span>
          </h2>

          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-12 leading-relaxed">
            Your intelligent genetics companion for research, analysis, and discovery.
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

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-12 relative z-10 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Form Card */}
          <div className="relative group">
            {/* Animated Gradient Border */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 rounded-3xl opacity-20 blur-lg group-hover:opacity-30 transition-opacity duration-500" style={{ animation: 'gradient-x 4s ease infinite', backgroundSize: '200% 200%' }} />

            <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/50 dark:border-gray-700/50 shadow-2xl shadow-gray-300/20 dark:shadow-black/30 p-5 sm:p-8 lg:p-10">
              {/* Header */}
              <div className="text-center mb-5 sm:mb-8">
                <div className="flex justify-center mb-4 sm:mb-6">
                  <div className="relative">
                    <div className="absolute -inset-2 sm:-inset-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full opacity-20 blur-xl animate-pulse" style={{ animationDuration: '3s' }} />
                    <Logo size="md" showText={false} className="sm:scale-110" />
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-[10px] sm:text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-3 sm:mb-4">
                  <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Secure Login
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                  Welcome Back
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  Sign in to continue to Zygotrix AI
                </p>
              </div>

              {/* Error Message */}
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

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {/* Email */}
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Email Address
                  </label>
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
                        autoComplete="email"
                        required
                        className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-sm sm:text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none transition-all duration-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Password
                  </label>
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
                        placeholder="Enter your password"
                        disabled={isLoading}
                        autoComplete="current-password"
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

                {/* Forgot Password Link */}
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => navigate('/forgot-password')}
                    className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="relative w-full group overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold text-white shadow-lg shadow-emerald-500/30 transition-all duration-300 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {/* Shine Effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                  <span className="relative flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <FaDna className="w-5 h-5" />
                        Sign In
                      </>
                    )}
                  </span>
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-5 sm:my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-white dark:bg-gray-900 text-sm text-gray-500 dark:text-gray-400">
                    New to Zygotrix AI?
                  </span>
                </div>
              </div>

              {/* Sign Up Link */}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="w-full py-3 sm:py-3.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-sm sm:text-base text-gray-700 dark:text-gray-300 font-semibold hover:border-emerald-500 hover:text-emerald-600 dark:hover:border-emerald-400 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all duration-300"
              >
                Create an Account
              </button>
            </div>
          </div>

          {/* Terms */}
          <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-4 sm:mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy
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
      `}</style>
    </div>
  );
};
