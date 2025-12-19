/**
 * Authentication Context - Integrated with Zustand
 * 
 * This context provides backward compatibility with existing components
 * while delegating actual state management to Zustand store.
 * 
 * Manages global authentication state including:
 * - User data
 * - JWT tokens
 * - Login/logout functions
 * - Token persistence
 */

import { createContext, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/authStore';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  // Get state and actions from Zustand store
  const {
    user,
    isAuthenticated,
    isInitialized,
    initializeAuth,
    updateUser,
    performLogin,
    performLogout,
  } = useAuthStore();

  /**
   * Initialize auth state on mount
   * Restore session if tokens exist
   */
  useEffect(() => {
    initializeAuth();
  }, []);

  /**
   * Login wrapper for backward compatibility
   */
  const handleLogin = async (email, password) => {
    // Set the login fields in store first
    useAuthStore.getState().setLoginField('email', email);
    useAuthStore.getState().setLoginField('password', password);

    const result = await performLogin(navigate);

    if (!result.success) {
      throw new Error(result.error);
    }

    toast.success('Login successful!');
  };

  /**
   * Logout wrapper
   */
  const handleLogout = async () => {
    await performLogout(navigate);
    toast.info('Logged out successfully');
  };

  const value = {
    user,
    loading: !isInitialized,
    login: handleLogin,
    logout: handleLogout,
    updateUser,
    isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use auth context
 * Usage: const { user, login, logout } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};