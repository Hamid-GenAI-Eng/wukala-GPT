import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'client' | 'lawyer' | 'admin';
  status?: 'pending' | 'approved' | 'rejected';
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(true);

  // Load persisted auth on mount
  useEffect(() => {
    console.log('AuthContext: Loading persisted auth...');
    try {
      const stored = localStorage.getItem('auth_user');
      console.log('AuthContext: Stored user data:', stored);
      if (stored) {
        const userData = JSON.parse(stored);
        console.log('AuthContext: Parsed user data:', userData);
        setUser(userData);
      }
    } catch (error) {
      console.error('AuthContext: Error loading persisted auth:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  // Persist auth changes
  useEffect(() => {
    try {
      if (user) localStorage.setItem('auth_user', JSON.stringify(user));
      else localStorage.removeItem('auth_user');
    } catch {}
  }, [user]);

  const isAuthenticated = !!user;

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};