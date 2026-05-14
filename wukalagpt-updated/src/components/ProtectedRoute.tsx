import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('client' | 'lawyer' | 'admin')[];
}

/**
 * Enterprise-grade Protected Route component.
 * Handles authentication checks, role-based access, and redirection logic.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-[0_0_20px_rgba(var(--primary),0.3)]"></div>
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Securing your session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login but save the current location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const role = (user?.role || '').toLowerCase();

  if (allowedRoles && user && !allowedRoles.map(r => r.toLowerCase()).includes(role)) {
    // Role not authorized, redirect to their default home
    console.warn(`User role ${role} not authorized for path ${location.pathname}`);
    
    if (role === 'admin') return <Navigate to="/admin" replace />;
    if (role === 'lawyer') return <Navigate to="/lawyer-dashboard" replace />;
    return <Navigate to="/chat" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
