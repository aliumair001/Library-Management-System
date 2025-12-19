/**
 * OTP Verification Page - Premium Design with Zustand State Management
 * 
 * Modern, beautiful OTP verification with:
 * - Individual input boxes for each digit
 * - Glassmorphism design
 * - Smooth animations
 * - Centralized state management
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  useAuthStore,
  useOTPState
} from '../store/authStore';

const VerifyOTP = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  // Zustand store
  const {
    setOTPEmail,
    setOTPDigit,
    setOTPFromPaste,
    performVerifyOTP,
    performResendOTP,
    resetOTPState
  } = useAuthStore();
  const otpState = useOTPState();

  // Refs for input focus management
  const inputRefs = useRef([]);

  // Local countdown state (updates frequently, keep local)
  const [countdown, setCountdown] = useState(60);

  // Initialize email and redirect if no email
  useEffect(() => {
    if (!email) {
      toast.error('Please signup first');
      navigate('/signup');
    } else {
      setOTPEmail(email);
    }
  }, [email, navigate]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-submit when all digits are filled
  useEffect(() => {
    const otp = otpState.otpDigits.join('');
    if (otp.length === 6 && otpState.otpDigits.every(d => d !== '')) {
      handleVerify();
    }
  }, [otpState.otpDigits]);

  const handleDigitChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setOTPDigit(index, value);

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace - move to previous input
    if (e.key === 'Backspace' && !otpState.otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    setOTPFromPaste(pastedData);

    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    const focusIndex = Math.min(digits.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleVerify = async () => {
    const result = await performVerifyOTP(navigate);

    if (result.success) {
      toast.success('Email verified successfully! 🎉');
    } else {
      toast.error(result.error);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    const result = await performResendOTP();

    if (result.success) {
      toast.success('OTP has been resent to your email!');
      setCountdown(60);
      inputRefs.current[0]?.focus();
    } else {
      toast.error(result.error);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-30 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Main Card */}
      <div className={`relative max-w-md w-full transition-all duration-500 ${otpState.success ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
        {/* Glass Card */}
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden">
          {/* Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer"></div>

          {/* Header */}
          <div className="text-center mb-8 relative z-10">
            {/* Animated Icon */}
            <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl animate-pulse opacity-50"></div>
              <div className="relative bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl p-4 shadow-lg">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-2">
              Verify Your Email
            </h2>
            <p className="text-gray-300">
              We've sent a verification code to
            </p>
            <p className="text-cyan-400 font-semibold mt-1 text-lg">{email}</p>
          </div>

          {/* Test Mode Badge */}
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-amber-200 font-medium">Test Mode</p>
                <p className="text-amber-100">
                  Use OTP: <span className="font-mono font-bold text-lg text-white bg-amber-500/30 px-2 py-0.5 rounded">123456</span>
                </p>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {otpState.error && (
            <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm animate-shake">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-red-200 text-sm">{otpState.error}</p>
              </div>
            </div>
          )}

          {/* OTP Input Group */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-300 mb-4 text-center">
              Enter 6-Digit Verification Code
            </label>
            <div className="flex justify-center gap-3" onPaste={handlePaste}>
              {otpState.otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={otpState.loading || otpState.success}
                  className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all duration-300 bg-white/10 backdrop-blur-sm focus:outline-none
                    ${digit ? 'border-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'border-white/20 text-gray-300'}
                    ${otpState.error ? 'border-red-500/50 animate-shake' : ''}
                    focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20
                    disabled:opacity-50 disabled:cursor-not-allowed
                    hover:border-cyan-400/50
                  `}
                  autoFocus={index === 0}
                />
              ))}
            </div>
            <p className="text-center text-sm text-gray-400 mt-3">
              {otpState.otpDigits.filter(d => d).length}/6 digits entered
            </p>
          </div>

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={otpState.loading || otpState.otpDigits.join('').length !== 6 || otpState.success}
            className="w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300 group-hover:scale-105"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative flex items-center justify-center gap-2">
              {otpState.loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying...
                </>
              ) : otpState.success ? (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Verified!
                </>
              ) : (
                <>
                  Verify Email
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </span>
          </button>

          {/* Resend OTP */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Didn't receive the code?{' '}
              <button
                onClick={handleResend}
                disabled={otpState.resendLoading || countdown > 0}
                className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {otpState.resendLoading ? (
                  'Sending...'
                ) : countdown > 0 ? (
                  <span className="flex items-center gap-1 inline-flex">
                    Resend in
                    <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-white">
                      {countdown}s
                    </span>
                  </span>
                ) : (
                  'Resend OTP'
                )}
              </button>
            </p>
          </div>

          {/* Back to Signup */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Signup
            </Link>
          </div>
        </div>
      </div>

      {/* Success Animation Overlay */}
      {otpState.success && (
        <div className="absolute inset-0 flex items-center justify-center z-50 animate-fadeIn">
          <div className="text-center">
            <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mb-6 animate-bounce-slow mx-auto shadow-2xl shadow-green-500/30">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Verified Successfully!</h3>
            <p className="text-gray-300">Redirecting to login...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifyOTP;
