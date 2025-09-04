import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, LoginRequest, RegisterRequest, ApiError } from '../api/types';
import apiClient from '../api/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<boolean>;
  register: (userData: RegisterRequest) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    if (apiClient.isAuthenticated()) {
      try {
        const userData = await apiClient.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Error checking auth status:', error);
        // Token might be invalid, remove it
        await apiClient.logout();
      }
    }
    setLoading(false);
  };

  const login = async (credentials: LoginRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.login(credentials);
      setUser(response.user);
      
      setLoading(false);
      return true;
    } catch (error) {
      setLoading(false);
      
      if (error && typeof error === 'object' && 'message' in error) {
        const apiError = error as ApiError;
        setError(apiError.message);
        
        // Handle specific field errors
        if (apiError.errors) {
          const fieldErrors = Object.values(apiError.errors).flat();
          if (fieldErrors.length > 0) {
            setError(fieldErrors[0]);
          }
        }
      } else {
        setError('Error de inicio de sesión. Verifica tus credenciales.');
      }
      
      return false;
    }
  };

  const register = async (userData: RegisterRequest): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.register(userData);
      setUser(response.user);
      
      setLoading(false);
      return true;
    } catch (error) {
      setLoading(false);
      
      if (error && typeof error === 'object' && 'message' in error) {
        const apiError = error as ApiError;
        setError(apiError.message);
        
        // Handle specific field errors
        if (apiError.errors) {
          const fieldErrors = Object.entries(apiError.errors)
            .map(([field, errors]) => `${field}: ${errors.join(', ')}`)
            .join('\n');
          setError(fieldErrors);
        }
      } else {
        setError('Error durante el registro. Intenta nuevamente.');
      }
      
      return false;
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setUser(null);
      setError(null);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};