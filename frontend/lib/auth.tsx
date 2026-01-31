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
    // Try to use stored user info (not tokens) first for fast UI
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // Invalid stored user
      }
    }

    // Verify session with backend (via Cookies)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${API_URL}/auth/me`, {
        credentials: 'include', // Important: Send cookies
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else if (response.status === 401) {
        // Try to refresh token (via Cookie)
        await refreshAuth();
      } else {
        // Not authenticated
        if (!storedUser) logout(); // Only logout if we didn't have a stored user to avoid flickering
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.warn('Auth check timeout - using stored user');
      } else {
        console.error('Auth check failed:', error);
      }
      // Keep user logged in if offline (using localStorage data)
    }

    setIsLoading(false);
  };

  const refreshAuth = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Send refresh_token cookie
      });

      if (response.ok) {
        const userData: User = await response.json();
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
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
        credentials: 'include', // Receive cookies
        body: JSON.stringify({ email, password })
      });
    } catch (error) {
      // Network error
      throw new Error('Impossible de contacter le serveur. Vérifiez que le backend est lancé sur http://localhost:8000');
    }

    if (!response.ok) {
      let errorMessage = 'Une erreur est survenue';
      try {
        const errorData = await response.json();
        if (errorData.detail && Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((err: { msg: string }) => err.msg).join('. ');
        } else if (errorData.detail && typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        }
      } catch {
        errorMessage = `Erreur serveur (${response.status})`;
      }
      throw new Error(errorMessage);
    }

    const userData: User = await response.json();
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    let response: Response;
    
    try {
      response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Receive cookies
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
          last_name: lastName
        })
      });
    } catch (error) {
      throw new Error('Impossible de contacter le serveur.');
    }

    if (!response.ok) {
      let errorMessage = 'Une erreur est survenue';
      try {
        const errorData = await response.json();
        if (errorData.detail) errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
      } catch {
        errorMessage = `Erreur serveur (${response.status})`;
      }
      throw new Error(errorMessage);
    }

    const userData: User = await response.json();
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout failed:', error);
    }
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
  // We don't send Authorization header anymore, we rely on cookies
  
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    credentials: 'include', // Send cookies
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  // If unauthorized, try to refresh token
  if (response.status === 401) {
    // Try refresh
    try {
      const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (refreshResponse.ok) {
        // Retry original request
        return fetch(`${API_URL}${url}`, {
          ...options,
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          }
        });
      }
    } catch (e) {
      console.error("Auto-refresh failed", e);
    }
  }

  return response;
}
