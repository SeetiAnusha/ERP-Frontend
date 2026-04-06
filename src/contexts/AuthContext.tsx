import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import axios from '../api/axios';

// Types
interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    accessToken: string;
  };
  message: string;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  // Check if authentication is enabled
  const isAuthEnabled = (): boolean => {
    // TEMPORARY: Disable auth for testing
    // return false;
    
    // Check environment variable first (for development)
    const envEnabled = import.meta.env.VITE_AUTH_ENABLED === 'true';
    // Check localStorage (for runtime control)
    const localEnabled = localStorage.getItem('AUTH_ENABLED') === 'true';
    
    console.log('🔐 Auth Check:', { envEnabled, localEnabled, result: envEnabled || localEnabled });
    
    return envEnabled || localEnabled;
  };

  // Get stored token
  const getStoredToken = (): string | null => {
    return localStorage.getItem('accessToken');
  };

  // Store token
  const storeToken = (token: string): void => {
    localStorage.setItem('accessToken', token);
    // Set default authorization header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  // Remove token
  const removeToken = (): void => {
    localStorage.removeItem('accessToken');
    delete axios.defaults.headers.common['Authorization'];
  };

  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await axios.post<AuthResponse>('/auth/login', {
        email,
        password,
      });

      if (response.data.success) {
        const { user: userData, accessToken } = response.data.data;
        
        // ✅ CRITICAL: Clear ALL cache before setting new user to prevent showing previous user's data
        queryClient.clear();
        console.log('🗑️ [Login] Cleared all React Query cache before login');
        
        setUser(userData);
        storeToken(accessToken);
        
        // Enable auth flag
        localStorage.setItem('AUTH_ENABLED', 'true');
        
        console.log('✅ [Login] Login successful for user:', userData.email);
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: RegisterData): Promise<void> => {
    try {
      setIsLoading(true);
      
      const response = await axios.post('/auth/register', userData);

      if (response.data.success) {
        // Registration successful - user needs to verify email
        // Don't auto-login, redirect to verification page
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = (): void => {
    console.log('🚪 [Logout] Starting logout process...');
    
    // Clear user state
    setUser(null);
    removeToken();
    
    // ✅ CRITICAL: Clear ALL React Query cache to prevent showing previous user's data
    queryClient.clear();
    console.log('🗑️ [Logout] Cleared all React Query cache');
    
    // Call logout endpoint to clear refresh token cookie
    axios.post('/auth/logout').catch(() => {
      // Ignore errors on logout
    });
    
    console.log('✅ [Logout] Logout complete');
  };

  // Refresh token function
  const refreshToken = async (): Promise<void> => {
    try {
      const response = await axios.post<AuthResponse>('/auth/refresh-token');
      
      if (response.data.success) {
        const { accessToken } = response.data.data;
        storeToken(accessToken);
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      // If refresh fails, logout user
      logout();
      throw error;
    }
  };

  // Get current user profile
  const getCurrentUser = async (): Promise<void> => {
    try {
      const response = await axios.get<AuthResponse>('/auth/profile');
      
      if (response.data.success) {
        setUser(response.data.data.user);
      } else {
        throw new Error('Failed to get user profile');
      }
    } catch (error) {
      // If getting profile fails, logout user
      logout();
    }
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if auth is enabled
        if (!isAuthEnabled()) {
          console.log('Authentication disabled, skipping auth initialization');
          setIsLoading(false);
          return;
        }

        const token = getStoredToken();
        
        if (token) {
          console.log('Found stored token, attempting to get user profile');
          // Set token in axios headers
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Try to get current user
          await getCurrentUser();
        } else {
          console.log('No stored token found');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Setup axios interceptor for token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Only attempt refresh for 401 errors, if auth is enabled, and not already retried
        if (
          error.response?.status === 401 && 
          !originalRequest._retry && 
          isAuthEnabled() &&
          originalRequest.url !== '/auth/refresh-token' && // Don't retry refresh token calls
          originalRequest.url !== '/auth/login' && // Don't retry login calls
          getStoredToken() // Only if we have a token
        ) {
          originalRequest._retry = true;
          
          try {
            await refreshToken();
            // Retry original request with new token
            return axios(originalRequest);
          } catch (refreshError) {
            // Refresh failed, logout user
            console.log('Token refresh failed, logging out user');
            logout();
            return Promise.reject(refreshError);
          }
        }
        
        // For refresh token failures or when auth is disabled, just reject
        if (error.response?.status === 401 && originalRequest.url === '/auth/refresh-token') {
          console.log('Refresh token endpoint failed, logging out user');
          logout();
        }
        
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on unmount
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []); // Remove dependencies to prevent recreating interceptor

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && isAuthEnabled(),
    isLoading,
    login,
    register,
    logout,
    refreshToken,
  };

  console.log('🔐 Auth State:', { 
    user: !!user, 
    isAuthEnabled: isAuthEnabled(), 
    isAuthenticated: !!user && isAuthEnabled(),
    isLoading 
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;