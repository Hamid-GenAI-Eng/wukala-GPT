import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, User } from '@/services/api';

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  setToken: (token: string | null, persistent?: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Set token in appropriate storage and state
  const setToken = (newToken: string | null, persistent: boolean = false) => {
    setTokenState(newToken);
    
    // Clear ALL stored tokens first for clean swap
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    
    if (newToken) {
      if (persistent) {
        localStorage.setItem('auth_token', newToken);
      } else {
        sessionStorage.setItem('auth_token', newToken);
      }
    }
  };

  // Load persisted auth on mount
  useEffect(() => {
    console.log('AuthContext: Loading persisted auth...');
    
    // --- TEMPORARY MOCK AUTH FOR TESTING ---
    const MOCK_MODE = false; 
    const mockLawyer: User = {
      id: 'mock-lawyer-id',
      name: 'Ahmed Khan',
      email: 'ahmed.khan@lawyer.com',
      role: 'lawyer',
      city: 'Lahore',
      status: 'active'
    };
    // ----------------------------------------

    try {
      const storedToken = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
      
      if (storedToken) {
        setTokenState(storedToken);
        api.getProfile()
          .then(userData => {
            setUser(userData);
          })
          .catch(error => {
            console.log('AuthContext: Profile fetch failed, using mock user:', error);
            if (MOCK_MODE) setUser(mockLawyer);
            else {
              setToken(null);
              setUser(null);
            }
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        if (MOCK_MODE) {
          console.log('AuthContext: No token found, enabling mock developer mode');
          setUser(mockLawyer);
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error('AuthContext: Error loading persisted auth:', error);
      if (MOCK_MODE) setUser(mockLawyer);
      setIsLoading(false);
    }
  }, []);

  const refreshUser = async () => {
    try {
      const userData = await api.getProfile();
      setUser(userData);
    } catch (error) {
      console.error('AuthContext: Failed to refresh user profile:', error);
    }
  };

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    // Clear onboarding flag so it shows again on next login
    localStorage.removeItem('wukala_onboarding_completed');
  };

  const isAuthenticated = !!user;

  const value = {
    user,
    login,
    logout,
    refreshUser,
    isAuthenticated,
    isLoading,
    token,
    setToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
