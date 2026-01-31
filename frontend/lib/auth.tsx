'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// ============================================
// Types
// ============================================

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

// ============================================
// API URL
// ============================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ============================================
// Context
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// Provider
// ============================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const storedUser = localStorage.getItem('user');

    if (!accessToken || !refreshToken) {
      setIsLoading(false);
      return;
    }

    // Try to use stored user first for fast UI
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // Invalid stored user
      }
    }

    // Verify token with backend (with timeout)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else if (response.status === 401) {
        // Try to refresh token
        await refreshAuth();
      } else {
        logout();
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('Auth check timeout - using stored user');
      } else {
        console.error('Auth check failed:', error);
      }
      // Keep user logged in if offline, tokens are still valid
    }

    setIsLoading(false);
  };

  const refreshAuth = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      logout();
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (response.ok) {
        const data: TokenResponse = await response.json();
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
    }
  };

  const login = async (email: string, password: string) => {
    let response: Response;
    
    try {
      response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
    } catch (error) {
      // Network error - server not reachable
      throw new Error('Impossible de contacter le serveur. Vérifiez que le backend est lancé sur http://localhost:8000');
    }

    if (!response.ok) {
      // Try to get the specific error message from the backend
      let errorMessage = 'Une erreur est survenue';
      
      try {
        const errorData = await response.json();
        
        // Handle Pydantic validation errors (array of errors)
        if (errorData.detail && Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((err: { msg: string }) => err.msg).join('. ');
        } 
        // Handle simple error messages
        else if (errorData.detail && typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        }
        // Handle other error formats
        else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Could not parse JSON response
        errorMessage = `Erreur serveur (${response.status})`;
      }
      
      throw new Error(errorMessage);
    }

    const data: TokenResponse = await response.json();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    let response: Response;
    
    try {
      response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
          last_name: lastName
        })
      });
    } catch (error) {
      // Network error - server not reachable
      throw new Error('Impossible de contacter le serveur. Vérifiez que le backend est lancé sur http://localhost:8000');
    }

    if (!response.ok) {
      // Try to get the specific error message from the backend
      let errorMessage = 'Une erreur est survenue';
      
      try {
        const errorData = await response.json();
        
        // Handle Pydantic validation errors (array of errors)
        if (errorData.detail && Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((err: { msg: string }) => err.msg).join('. ');
        } 
        // Handle simple error messages
        else if (errorData.detail && typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        }
        // Handle other error formats
        else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Could not parse JSON response
        errorMessage = `Erreur serveur (${response.status})`;
      }
      
      throw new Error(errorMessage);
    }

    const data: TokenResponse = await response.json();
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('refresh_token', data.refresh_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ============================================
// Hook
// ============================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ============================================
// API Helper
// ============================================

export async function authFetch(url: string, options: RequestInit = {}) {
  const accessToken = localStorage.getItem('access_token');
  
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      ...options.headers
    }
  });

  // If unauthorized, try to refresh token
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (refreshToken) {
      const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken })
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('refresh_token', data.refresh_token);
        
        // Retry original request
        return fetch(`${API_URL}${url}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.access_token}`,
            ...options.headers
          }
        });
      }
    }
  }

  return response;
}
