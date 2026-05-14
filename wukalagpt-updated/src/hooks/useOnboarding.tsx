import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useOnboarding = () => {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Don't show onboarding for admin users
    if (user?.role === 'admin') {
      setShowOnboarding(false);
      return;
    }

    // Check if user has seen onboarding before
    const hasSeenOnboarding = localStorage.getItem('wukala_onboarding_completed');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, [user]);

  const completeOnboarding = () => {
    localStorage.setItem('wukala_onboarding_completed', 'true');
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem('wukala_onboarding_completed');
    setShowOnboarding(true);
  };

  return {
    showOnboarding,
    completeOnboarding,
    resetOnboarding
  };
};