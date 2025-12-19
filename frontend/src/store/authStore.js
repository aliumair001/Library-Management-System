/**
 * Authentication Store - Professional State Management
 * 
 * Centralized state management for all authentication flows:
 * - Login
 * - Signup
 * - Forgot Password
 * - Reset Password
 * - OTP Verification
 * 
 * Uses Zustand for lightweight, performant state management
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as authAPI from '../api/auth';

// ============================================
// Validation Utilities
// ============================================

const ALLOWED_EMAIL_DOMAINS = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'yahoo.co', 'live.com'];

export const validateEmail = (email) => {
    if (!email) return { valid: false, message: '' };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, message: 'Invalid email format' };
    }

    const domain = email.toLowerCase().split('@')[1];
    if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
        return { valid: false, message: 'Email must be from Gmail, Outlook, or Yahoo' };
    }

    return { valid: true, message: 'Valid email' };
};

export const validatePassword = (password) => {
    return {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasSpecialChar: /[!@#$%^&*(),.?"':{}|<>_\-+=\[\]\\;'`~]/.test(password),
    };
};

export const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '' };

    const validation = validatePassword(password);
    let score = 0;
    if (validation.minLength) score++;
    if (validation.hasUppercase) score++;
    if (validation.hasLowercase) score++;
    if (validation.hasSpecialChar) score++;
    if (password.length >= 12) score++; // Bonus for longer passwords

    const strengths = [
        { label: 'Very Weak', color: 'bg-red-500' },
        { label: 'Weak', color: 'bg-orange-500' },
        { label: 'Fair', color: 'bg-yellow-500' },
        { label: 'Good', color: 'bg-lime-500' },
        { label: 'Strong', color: 'bg-green-500' },
    ];

    return { score, ...strengths[Math.min(score, 4)], validation };
};

export const isPasswordValid = (password) => {
    const validation = validatePassword(password);
    return validation.minLength &&
        validation.hasUppercase &&
        validation.hasLowercase &&
        validation.hasSpecialChar;
};

// ============================================
// Initial States
// ============================================

const initialAuthState = {
    user: null,
    isAuthenticated: false,
    isInitialized: false,
};

const initialLoginState = {
    email: '',
    password: '',
    rememberMe: false,
    loading: false,
    error: null,
    successMessage: null,
};

const initialSignupState = {
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    loading: false,
    error: null,
    success: false,
};

const initialForgotPasswordState = {
    email: '',
    loading: false,
    error: null,
    success: false,
    otpSent: false,
};

const initialResetPasswordState = {
    email: '',
    otpDigits: ['', '', '', '', '', ''],
    newPassword: '',
    confirmPassword: '',
    loading: false,
    error: null,
    success: false,
};

const initialOTPState = {
    email: '',
    otpDigits: ['', '', '', '', '', ''],
    loading: false,
    error: null,
    success: false,
    resendLoading: false,
    resendCooldown: 0,
};

// ============================================
// Main Auth Store
// ============================================

export const useAuthStore = create(
    persist(
        (set, get) => ({
            // Auth State
            ...initialAuthState,

            // Login Form State
            login: { ...initialLoginState },

            // Signup Form State
            signup: { ...initialSignupState },

            // Forgot Password State
            forgotPassword: { ...initialForgotPasswordState },

            // Reset Password State
            resetPassword: { ...initialResetPasswordState },

            // OTP Verification State
            otp: { ...initialOTPState },

            // ========================================
            // Auth Actions
            // ========================================

            initializeAuth: async () => {
                try {
                    const accessToken = localStorage.getItem('accessToken');
                    const refreshToken = localStorage.getItem('refreshToken');

                    if (accessToken && refreshToken) {
                        try {
                            const currentUser = await authAPI.getCurrentUser();
                            set({
                                user: currentUser,
                                isAuthenticated: true,
                                isInitialized: true
                            });
                        } catch (error) {
                            // Token invalid, clear everything
                            get().clearAuth();
                            set({ isInitialized: true });
                        }
                    } else {
                        set({ isInitialized: true });
                    }
                } catch (error) {
                    console.error('Auth initialization error:', error);
                    set({ isInitialized: true });
                }
            },

            setUser: (user) => set({ user, isAuthenticated: !!user }),

            updateUser: (userData) => {
                set({ user: userData });
                localStorage.setItem('user', JSON.stringify(userData));
            },

            clearAuth: () => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                set({ user: null, isAuthenticated: false });
            },

            // ========================================
            // Login Actions
            // ========================================

            setLoginField: (field, value) =>
                set((state) => ({
                    login: { ...state.login, [field]: value, error: null }
                })),

            setLoginError: (error) =>
                set((state) => ({
                    login: { ...state.login, error, loading: false }
                })),

            setLoginSuccess: (message) =>
                set((state) => ({
                    login: { ...state.login, successMessage: message, error: null }
                })),

            clearLoginMessage: () =>
                set((state) => ({
                    login: { ...state.login, successMessage: null }
                })),

            performLogin: async (navigate) => {
                const { login } = get();

                set((state) => ({
                    login: { ...state.login, loading: true, error: null }
                }));

                try {
                    const response = await authAPI.login({
                        email: login.email,
                        password: login.password
                    });

                    // Store tokens
                    localStorage.setItem('accessToken', response.tokens.access_token);
                    localStorage.setItem('refreshToken', response.tokens.refresh_token);
                    localStorage.setItem('user', JSON.stringify(response.user));

                    // Update state
                    set({
                        user: response.user,
                        isAuthenticated: true,
                        login: { ...initialLoginState }
                    });

                    navigate('/dashboard');
                    return { success: true };
                } catch (error) {
                    const message = error.response?.data?.detail || 'Login failed. Please try again.';
                    set((state) => ({
                        login: { ...state.login, error: message, loading: false }
                    }));
                    return { success: false, error: message };
                }
            },

            resetLoginState: () =>
                set((state) => ({
                    login: { ...initialLoginState }
                })),

            // ========================================
            // Signup Actions
            // ========================================

            setSignupField: (field, value) =>
                set((state) => ({
                    signup: { ...state.signup, [field]: value, error: null }
                })),

            setSignupError: (error) =>
                set((state) => ({
                    signup: { ...state.signup, error, loading: false }
                })),

            validateSignupForm: () => {
                const { signup } = get();

                // Validate email
                const emailValidation = validateEmail(signup.email);
                if (!emailValidation.valid) {
                    return { valid: false, error: emailValidation.message };
                }

                // Validate password
                const passwordValidation = validatePassword(signup.password);
                if (!passwordValidation.minLength) {
                    return { valid: false, error: 'Password must be at least 8 characters' };
                }
                if (!passwordValidation.hasUppercase) {
                    return { valid: false, error: 'Password must contain at least one uppercase letter' };
                }
                if (!passwordValidation.hasLowercase) {
                    return { valid: false, error: 'Password must contain at least one lowercase letter' };
                }
                if (!passwordValidation.hasSpecialChar) {
                    return { valid: false, error: 'Password must contain at least one special character' };
                }

                // Validate password match
                if (signup.password !== signup.confirmPassword) {
                    return { valid: false, error: 'Passwords do not match' };
                }

                return { valid: true };
            },

            performSignup: async (navigate) => {
                const { signup, validateSignupForm } = get();

                // Validate form
                const validation = validateSignupForm();
                if (!validation.valid) {
                    set((state) => ({
                        signup: { ...state.signup, error: validation.error }
                    }));
                    return { success: false, error: validation.error };
                }

                set((state) => ({
                    signup: { ...state.signup, loading: true, error: null }
                }));

                try {
                    await authAPI.signup({
                        name: signup.name,
                        email: signup.email,
                        password: signup.password
                    });

                    set((state) => ({
                        signup: { ...state.signup, loading: false, success: true },
                        otp: { ...state.otp, email: signup.email }
                    }));

                    navigate('/verify-otp', { state: { email: signup.email } });
                    return { success: true };
                } catch (error) {
                    let message = error.response?.data?.detail || 'Signup failed. Please try again.';
                    if (Array.isArray(error.response?.data?.detail)) {
                        message = error.response.data.detail.map(e => e.msg).join(', ');
                    }
                    if (!error.response) {
                        message = 'Cannot connect to server. Make sure backend is running.';
                    }

                    set((state) => ({
                        signup: { ...state.signup, error: message, loading: false }
                    }));
                    return { success: false, error: message };
                }
            },

            resetSignupState: () =>
                set({ signup: { ...initialSignupState } }),

            // ========================================
            // Forgot Password Actions
            // ========================================

            setForgotPasswordEmail: (email) =>
                set((state) => ({
                    forgotPassword: { ...state.forgotPassword, email, error: null }
                })),

            setForgotPasswordError: (error) =>
                set((state) => ({
                    forgotPassword: { ...state.forgotPassword, error, loading: false }
                })),

            performForgotPassword: async (navigate) => {
                const { forgotPassword } = get();

                set((state) => ({
                    forgotPassword: { ...state.forgotPassword, loading: true, error: null }
                }));

                try {
                    await authAPI.forgotPassword(forgotPassword.email);

                    set((state) => ({
                        forgotPassword: { ...state.forgotPassword, loading: false, success: true, otpSent: true },
                        resetPassword: { ...state.resetPassword, email: forgotPassword.email }
                    }));

                    navigate('/reset-password', { state: { email: forgotPassword.email } });
                    return { success: true };
                } catch (error) {
                    const message = error.response?.data?.detail || 'Failed to send OTP';
                    set((state) => ({
                        forgotPassword: { ...state.forgotPassword, error: message, loading: false }
                    }));
                    return { success: false, error: message };
                }
            },

            resetForgotPasswordState: () =>
                set({ forgotPassword: { ...initialForgotPasswordState } }),

            // ========================================
            // Reset Password Actions
            // ========================================

            setResetPasswordEmail: (email) =>
                set((state) => ({
                    resetPassword: { ...state.resetPassword, email }
                })),

            setResetPasswordField: (field, value) =>
                set((state) => ({
                    resetPassword: { ...state.resetPassword, [field]: value, error: null }
                })),

            setResetPasswordOTPDigit: (index, value) =>
                set((state) => {
                    const newDigits = [...state.resetPassword.otpDigits];
                    newDigits[index] = value.replace(/\D/g, '').slice(-1);
                    return {
                        resetPassword: { ...state.resetPassword, otpDigits: newDigits, error: null }
                    };
                }),

            setResetPasswordOTPFromPaste: (pastedData) =>
                set((state) => {
                    const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');
                    const newDigits = ['', '', '', '', '', ''];
                    digits.forEach((digit, i) => {
                        newDigits[i] = digit;
                    });
                    return {
                        resetPassword: { ...state.resetPassword, otpDigits: newDigits, error: null }
                    };
                }),

            setResetPasswordError: (error) =>
                set((state) => ({
                    resetPassword: { ...state.resetPassword, error, loading: false }
                })),

            validateResetPasswordForm: () => {
                const { resetPassword } = get();
                const otp = resetPassword.otpDigits.join('');

                if (otp.length !== 6) {
                    return { valid: false, error: 'Please enter the complete 6-digit OTP' };
                }

                const passwordValidation = validatePassword(resetPassword.newPassword);
                if (!passwordValidation.minLength) {
                    return { valid: false, error: 'Password must be at least 8 characters' };
                }
                if (!passwordValidation.hasUppercase) {
                    return { valid: false, error: 'Password must contain at least one uppercase letter' };
                }
                if (!passwordValidation.hasLowercase) {
                    return { valid: false, error: 'Password must contain at least one lowercase letter' };
                }
                if (!passwordValidation.hasSpecialChar) {
                    return { valid: false, error: 'Password must contain at least one special character' };
                }

                if (resetPassword.newPassword !== resetPassword.confirmPassword) {
                    return { valid: false, error: 'Passwords do not match' };
                }

                return { valid: true };
            },

            performResetPassword: async (navigate) => {
                const { resetPassword, validateResetPasswordForm } = get();

                const validation = validateResetPasswordForm();
                if (!validation.valid) {
                    set((state) => ({
                        resetPassword: { ...state.resetPassword, error: validation.error }
                    }));
                    return { success: false, error: validation.error };
                }

                set((state) => ({
                    resetPassword: { ...state.resetPassword, loading: true, error: null }
                }));

                try {
                    await authAPI.resetPassword({
                        email: resetPassword.email,
                        otp_code: resetPassword.otpDigits.join(''),
                        new_password: resetPassword.newPassword
                    });

                    set((state) => ({
                        resetPassword: { ...state.resetPassword, loading: false, success: true }
                    }));

                    setTimeout(() => {
                        navigate('/login', {
                            state: { message: 'Password reset successful! Please login with your new password.' }
                        });
                    }, 1500);

                    return { success: true };
                } catch (error) {
                    const message = error.response?.data?.detail || 'Password reset failed';
                    set((state) => ({
                        resetPassword: {
                            ...state.resetPassword,
                            error: message,
                            loading: false,
                            otpDigits: ['', '', '', '', '', '']
                        }
                    }));
                    return { success: false, error: message };
                }
            },

            resetResetPasswordState: () =>
                set({ resetPassword: { ...initialResetPasswordState } }),

            // ========================================
            // OTP Verification Actions
            // ========================================

            setOTPEmail: (email) =>
                set((state) => ({
                    otp: { ...state.otp, email }
                })),

            setOTPDigit: (index, value) =>
                set((state) => {
                    const newDigits = [...state.otp.otpDigits];
                    newDigits[index] = value.replace(/\D/g, '').slice(-1);
                    return {
                        otp: { ...state.otp, otpDigits: newDigits, error: null }
                    };
                }),

            setOTPFromPaste: (pastedData) =>
                set((state) => {
                    const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');
                    const newDigits = ['', '', '', '', '', ''];
                    digits.forEach((digit, i) => {
                        newDigits[i] = digit;
                    });
                    return {
                        otp: { ...state.otp, otpDigits: newDigits, error: null }
                    };
                }),

            setOTPError: (error) =>
                set((state) => ({
                    otp: { ...state.otp, error, loading: false }
                })),

            performVerifyOTP: async (navigate) => {
                const { otp } = get();
                const otpCode = otp.otpDigits.join('');

                if (otpCode.length !== 6) {
                    set((state) => ({
                        otp: { ...state.otp, error: 'Please enter the complete 6-digit OTP' }
                    }));
                    return { success: false, error: 'Please enter the complete 6-digit OTP' };
                }

                set((state) => ({
                    otp: { ...state.otp, loading: true, error: null }
                }));

                try {
                    await authAPI.verifyOTP({
                        email: otp.email,
                        otp_code: otpCode
                    });

                    set((state) => ({
                        otp: { ...state.otp, loading: false, success: true }
                    }));

                    setTimeout(() => {
                        navigate('/login', {
                            state: {
                                message: 'Email verified successfully! Please login.',
                                email: otp.email
                            }
                        });
                    }, 1500);

                    return { success: true };
                } catch (error) {
                    const message = error.response?.data?.detail || 'Verification failed';
                    set((state) => ({
                        otp: {
                            ...state.otp,
                            error: message,
                            loading: false,
                            otpDigits: ['', '', '', '', '', '']
                        }
                    }));
                    return { success: false, error: message };
                }
            },

            performResendOTP: async () => {
                const { otp } = get();

                set((state) => ({
                    otp: { ...state.otp, resendLoading: true, error: null }
                }));

                try {
                    await authAPI.resendOTP(otp.email);

                    set((state) => ({
                        otp: { ...state.otp, resendLoading: false, resendCooldown: 60 }
                    }));

                    // Start cooldown timer
                    const interval = setInterval(() => {
                        const currentCooldown = get().otp.resendCooldown;
                        if (currentCooldown <= 1) {
                            clearInterval(interval);
                            set((state) => ({
                                otp: { ...state.otp, resendCooldown: 0 }
                            }));
                        } else {
                            set((state) => ({
                                otp: { ...state.otp, resendCooldown: currentCooldown - 1 }
                            }));
                        }
                    }, 1000);

                    return { success: true };
                } catch (error) {
                    const message = error.response?.data?.detail || 'Failed to resend OTP';
                    set((state) => ({
                        otp: { ...state.otp, error: message, resendLoading: false }
                    }));
                    return { success: false, error: message };
                }
            },

            resetOTPState: () =>
                set({ otp: { ...initialOTPState } }),

            // ========================================
            // Logout Action
            // ========================================

            performLogout: async (navigate) => {
                try {
                    await authAPI.logout();
                } catch (error) {
                    console.error('Logout error:', error);
                } finally {
                    get().clearAuth();
                    set({
                        login: { ...initialLoginState },
                        signup: { ...initialSignupState },
                        forgotPassword: { ...initialForgotPasswordState },
                        resetPassword: { ...initialResetPasswordState },
                        otp: { ...initialOTPState },
                    });
                    navigate('/login');
                }
            },
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);

// ============================================
// Selector Hooks for Performance
// ============================================

export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsInitialized = () => useAuthStore((state) => state.isInitialized);

export const useLoginState = () => useAuthStore((state) => state.login);
export const useSignupState = () => useAuthStore((state) => state.signup);
export const useForgotPasswordState = () => useAuthStore((state) => state.forgotPassword);
export const useResetPasswordState = () => useAuthStore((state) => state.resetPassword);
export const useOTPState = () => useAuthStore((state) => state.otp);
