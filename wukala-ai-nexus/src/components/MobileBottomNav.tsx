import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  FileText,
  Users,
  BookOpen,
  Gavel,
  User,
  Newspaper,
} from 'lucide-react';

const publicNav = [
  { name: 'About', href: '/about', icon: BookOpen },
  { name: 'Leadership', href: '/leadership', icon: Users },
  { name: 'Get Started', href: '/auth/role', icon: User },
];

const clientNav = [
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Docs', href: '/documents', icon: FileText },
  { name: 'Lawyers', href: '/lawyers', icon: Users },
  { name: 'Case Law', href: '/case-law', icon: Gavel },
  { name: 'News', href: '/news', icon: Newspaper },
];

const lawyerNav = [
  { name: 'Dashboard', href: '/lawyer-dashboard', icon: BookOpen },
  { name: 'Chat', href: '/chat', icon: MessageSquare },
  { name: 'Case Law', href: '/case-law', icon: Gavel },
  { name: 'News', href: '/news', icon: Newspaper },
  { name: 'Profile', href: '/lawyer-profile', icon: User },
];

const adminNav = [
  { name: 'Admin', href: '/admin', icon: User },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  const getNavigation = () => {
    if (!isAuthenticated) return publicNav;
    if (user?.role === 'lawyer') return lawyerNav;
    if (user?.role === 'admin') return adminNav;
    return clientNav;
  };

  const navigation = getNavigation();

  // Hide on auth pages
  const hideOnRoutes = ['/login', '/signup/client', '/signup/lawyer', '/auth/role', '/verify-otp', '/lawyer-dashboard'];
  if (hideOnRoutes.includes(location.pathname)) return null;

  return (
    <motion.nav 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border safe-area-bottom"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-lg transition-all duration-200',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="relative"
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -inset-2 bg-primary/10 rounded-full"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon className={cn(
                  'h-5 w-5 relative z-10 transition-transform duration-200',
                  isActive && 'scale-110'
                )} />
              </motion.div>
              <span className={cn(
                'text-[10px] mt-1 font-medium transition-all duration-200',
                isActive && 'text-primary font-semibold'
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
