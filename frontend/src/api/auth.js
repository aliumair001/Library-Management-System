/**
 * Authentication API calls.
 * All JWT-related authentication endpoints.
 */

import api from './axios';

/**
 * User signup
 * @param {Object} data - {name, email, password}
 * @returns {Promise} Response with message and email
 */
export const signup = async (data) => {
  const response = await api.post('/auth/signup', data);
  return response.data;
};

/**
 * Verify OTP after signup
 * @param {Object} data - {email, otp_code}
 * @returns {Promise} Response with verification status
 */
export const verifyOTP = async (data) => {
  const response = await api.post('/auth/verify-otp', data);
  return response.data;
};

/**
 * Resend OTP
 * @param {string} email - User email
 * @returns {Promise} Response with OTP sent status
 */
export const resendOTP = async (email) => {
  const response = await api.post('/auth/resend-otp', { email });
  return response.data;
};

/**
 * User login
 * @param {Object} data - {email, password}
 * @returns {Promise} Response with tokens and user data
 */
export const login = async (data) => {
  const response = await api.post('/auth/login', data);
  return response.data;
};

/**
 * Logout user (revoke refresh token)
 * @returns {Promise} Response with logout status
 */
export const logout = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (refreshToken) {
    const response = await api.post('/auth/logout', {
      refresh_token: refreshToken
    });
    return response.data;
  }
};

/**
 * Forgot password - Request OTP
 * @param {string} email - User email
 * @returns {Promise} Response with OTP sent status
 */
export const forgotPassword = async (email) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

/**
 * Reset password with OTP
 * @param {Object} data - {email, otp_code, new_password}
 * @returns {Promise} Response with reset status
 */
export const resetPassword = async (data) => {
  const response = await api.post('/auth/reset-password', data);
  return response.data;
};

/**
 * Get current user profile
 * @returns {Promise} User data
 */
export const getCurrentUser = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

/**
 * Update user profile
 * @param {Object} data - {name?, bio?, profile_picture?}
 * @returns {Promise} Updated user data
 */
export const updateProfile = async (data) => {
  const response = await api.put('/users/me/profile', data);
  return response.data;
};