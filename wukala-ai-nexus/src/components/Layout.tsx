
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import logo from '@/assets/Wukala-GPT-Logo-Green.jpg';
import PageTransition from './PageTransition';
import MobileBottomNav from './MobileBottomNav';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MessageSquare, 
  FileText, 
  Users, 
  Moon, 
  Sun, 
  Menu,
  X,
  Scale,
  Newspaper,
  BookOpen,
  Home,
  Info,
  Crown,
  User,
  LogOut,
  ChevronDown,
  Gavel
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const publicNavigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'About', href: '/about', icon: Info },
  { name: 'Leadership', href: '/leadership', icon: Crown },
];

const clientNavigation = [
  { name: 'AI Assistant', href: '/chat', icon: MessageSquare },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Find Lawyers', href: '/lawyers', icon: Users },
  { name: 'Case Law', href: '/case-law', icon: Gavel },
  { name: 'Legal News', href: '/news', icon: Newspaper },
  { name: 'Dictionary', href: '/dictionary', icon: BookOpen },
];

const lawyerNavigation = [
  { name: 'Dashboard', href: '/lawyer-dashboard', icon: Scale },
  { name: 'AI Assistant', href: '/chat', icon: MessageSquare },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Case Law', href: '/case-law', icon: Gavel },
  { name: 'Legal News', href: '/news', icon: Newspaper },
  { name: 'Dictionary', href: '/dictionary', icon: BookOpen },
];

const adminNavigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'About', href: '/about', icon: Info },
  { name: 'Leadership', href: '/leadership', icon: Crown },
  { name: 'Admin', href: '/admin', icon: User },
];
export default function Layout({ children }: LayoutProps) {
  const [isDark, setIsDark] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const getNavigation = () => {
    if (!isAuthenticated) return publicNavigation;
    if (user?.role === 'lawyer') return lawyerNavigation;
    if (user?.role === 'admin') return adminNavigation;
    return clientNavigation;
  };

  const navigation = getNavigation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 lg:h-16 items-center justify-between px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 lg:space-x-3">
            <img 
              src={logo} 
              alt="Wukala-GPT Logo" 
              className="h-10 w-auto lg:h-12"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-9 w-9 p-0"
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {!isAuthenticated ? (
              <div className="hidden lg:flex space-x-2">
                <Button 
                  asChild 
                  variant="outline"
                  size="sm"
                >
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button 
                  asChild 
                  className="bg-gradient-primary hover:shadow-lg transition-all duration-300"
                >
                  <Link to="/auth/role">Get Started</Link>
                </Button>
              </div>
            ) : (
              <div className="hidden lg:flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0"
                    >
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user?.role === 'lawyer' && (
                      <DropdownMenuItem asChild>
                        <Link to="/lawyer-profile" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          My Profile
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden h-9 w-9 p-0"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation - Only show when not authenticated (authenticated users use bottom nav) */}
        {isMobileMenuOpen && !isAuthenticated && (
          <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur">
            <nav className="container py-4 px-4">
              <div className="flex flex-col space-y-2">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
                <div className="mt-4 space-y-2">
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>Sign In</Link>
                  </Button>
                  <Button asChild className="w-full bg-gradient-primary">
                    <Link to="/auth/role" onClick={() => setIsMobileMenuOpen(false)}>Get Started</Link>
                  </Button>
                </div>
              </div>
            </nav>
          </div>
        )}
        
        {/* Mobile User Menu - Only for authenticated users */}
        {isMobileMenuOpen && isAuthenticated && (
          <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur">
            <nav className="container py-4 px-4">
              <div className="flex flex-col space-y-2">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                {user?.role === 'lawyer' && (
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Link to="/lawyer-profile">
                      <User className="h-4 w-4 mr-2" />
                      My Profile
                    </Link>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full justify-start text-destructive hover:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-16 lg:pb-0">
        <PageTransition>
          {children}
        </PageTransition>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Footer - Show on all pages except AI Assistant */}
      {location.pathname !== '/chat' && (
        <footer className="border-t border-border bg-muted/30">
          <div className="container py-6 lg:py-8 px-4">
            <div className="flex flex-col lg:flex-row justify-between items-center space-y-4 lg:space-y-0">
              <div className="flex items-center space-x-3">
                <img 
                  src={logo} 
                  alt="Wukala-GPT Logo" 
                  className="h-6 w-auto lg:h-8"
                />
                <span className="text-xs lg:text-sm text-muted-foreground text-center lg:text-left">
                  © 2024 Wukala-GPT. Transforming legal services in Pakistan.
                </span>
              </div>
              <div className="flex items-center space-x-4 text-xs lg:text-sm text-muted-foreground">
                <a href="#" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="hover:text-foreground transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="hover:text-foreground transition-colors">
                  Contact
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
