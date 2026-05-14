
import { useEffect, useRef, useState } from 'react';
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
  Gavel,
  LayoutDashboard,
  MapPin,
  Phone,
  Mail,
  Linkedin,
  Twitter,
  Instagram,
  Check,
  Sparkles,
  ShieldCheck,
  Zap,
  HelpCircle,
  Workflow,
  Tag,
  ArrowUp,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

const helpMenuItems = [
  { name: 'FAQ', href: '/faq', icon: HelpCircle },
  { name: 'How It Works', href: '/how-it-works', icon: Workflow },
  { name: 'Pricing', href: '/pricing', icon: Tag },
  { name: 'Contact', href: '/contact', icon: Phone },
];

const HELP_MENU_LABELS = new Set(helpMenuItems.map((item) => item.name));

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
  { name: 'Dashboard', href: '/lawyer-dashboard', icon: LayoutDashboard },
  { name: 'AI Assistant', href: '/chat', icon: MessageSquare },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Find Lawyers', href: '/lawyers', icon: Users },
  { name: 'Case Law', href: '/case-law', icon: Gavel },
  { name: 'Legal News', href: '/news', icon: Newspaper },
  { name: 'Dictionary', href: '/dictionary', icon: BookOpen },
];

const adminNavigation = [
  { name: 'Console', href: '/admin', icon: LayoutDashboard },
  { name: 'System Overview', href: '/admin', icon: BarChart3 },
  { name: 'Lawyer Review', href: '/admin', icon: ShieldCheck },
];

const INTRO_SESSION_KEY = 'wukala:introSessionShown';

const pricingPlans = [
  {
    name: 'Basic Plan — Legal Starter',
    price: 'PKR 1,499',
    cadence: 'per month',
    description: 'For general users and students who need clear answers before talking to a lawyer.',
    features: [
      'Bilingual AI legal chat (Urdu + English)',
      'Text-based legal Q&A',
      'Limited voice interaction',
      'Upload up to 5 legal documents / month',
      'AI document summaries (basic)',
      'Access to legal knowledge base',
      'Lawyer search (view profiles only)',
      'Secure account with role-based access',
    ],
    accent: 'from-amber-500/60 via-amber-400/40 to-amber-300/20',
    cta: 'Start Basic',
  },
  {
    name: 'Standard Plan — Smart Legal Assist',
    badge: 'Most popular',
    price: 'PKR 3,499',
    cadence: 'per month',
    description: 'For individuals handling active matters who need guidance, document analysis, and lawyer communication.',
    features: [
      'Everything in Basic',
      'Full voice + text AI interaction',
      'Upload up to 20 documents / month',
      'Advanced AI summaries & key section extraction',
      'Verified lawyer discovery with filters',
      'Secure encrypted messaging with lawyers',
      'Case requests & appointment scheduling',
      'Document attachment sharing in chat',
    ],
    accent: 'from-emerald-500/60 via-emerald-400/40 to-emerald-300/20',
    cta: 'Choose Standard',
    highlight: true,
  },
  {
    name: 'Professional Plan — Lawyer Pro Dashboard',
    price: 'PKR 6,999',
    cadence: 'per month',
    description: 'For lawyers and legal professionals who need client management, drafting, and operational control.',
    features: [
      'Everything in Standard',
      'Dedicated Lawyer Dashboard',
      'Case management system',
      'Client request acceptance / rejection',
      'Appointment & reminder management',
      'Secure client-lawyer encrypted messaging',
      'AI-assisted document drafting & summaries',
      'Manage multiple clients & documents',
      'Lawyer verification badge (admin approved)',
    ],
    accent: 'from-blue-500/60 via-indigo-400/40 to-sky-300/20',
    cta: 'Get Professional',
  },
];
export default function Layout({ children }: LayoutProps) {
  const [isDark, setIsDark] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const hasNavigated = useRef(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showIntroLoader, setShowIntroLoader] = useState(true);
  const [renderIntroLoader, setRenderIntroLoader] = useState(true);
  const [allowMotion, setAllowMotion] = useState(true);
  const prefersReducedMotion = useRef(false);
  const loaderStartRef = useRef<number | null>(null);
  const loaderBlinkRef = useRef<number | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const progressFrame = useRef<number | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const getNavigation = () => {
    if (!isAuthenticated) return publicNavigation;
    const role = (user?.role || '').toLowerCase();
    
    // Admins should ONLY see management pages as requested
    if (role === 'admin') return adminNavigation;
    if (role === 'lawyer') return lawyerNavigation;
    return clientNavigation;
  };

  const navigation = getNavigation();
  const isHelpRoute = helpMenuItems.some((item) => item.href === location.pathname);

  const handleLogout = () => {
    logout();
    // Clear onboarding flag so it shows again on next login
    localStorage.removeItem('wukala_onboarding_completed');
    navigate('/');
  };

  useEffect(() => {
    if (!hasNavigated.current) {
      hasNavigated.current = true;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 240);
    };
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (event: MediaQueryListEvent | MediaQueryList) => {
      prefersReducedMotion.current = event.matches;
      setAllowMotion(!event.matches);
      if (event.matches) {
        setShowIntroLoader(false);
      }
    };
    handleMotionChange(mql);
    mql.addEventListener('change', handleMotionChange);
    return () => mql.removeEventListener('change', handleMotionChange);
  }, []);

  useEffect(() => {
    const seenIntro = typeof window !== 'undefined' && sessionStorage.getItem(INTRO_SESSION_KEY) === '1';

    if (seenIntro || prefersReducedMotion.current) {
      setShowIntroLoader(false);
      setRenderIntroLoader(true);
      if (loaderBlinkRef.current) {
        clearTimeout(loaderBlinkRef.current);
      }
      loaderBlinkRef.current = window.setTimeout(() => setRenderIntroLoader(false), 150);
      return () => {
        if (loaderBlinkRef.current) {
          clearTimeout(loaderBlinkRef.current);
          loaderBlinkRef.current = null;
        }
      };
    }

    loaderStartRef.current = performance.now();

    const onReady = () => {
      const started = loaderStartRef.current ?? performance.now();
      const elapsed = performance.now() - started;
      const remaining = Math.max(0, 3000 - elapsed);
      setTimeout(() => setShowIntroLoader(false), remaining);
    };

    if (document.readyState === 'complete') {
      onReady();
    } else {
      window.addEventListener('load', onReady);
    }

    return () => {
      window.removeEventListener('load', onReady);
    };
  }, []);

  useEffect(() => {
    if (!showIntroLoader) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(INTRO_SESSION_KEY, '1');
      }
      const timer = setTimeout(() => setRenderIntroLoader(false), 500);
      return () => clearTimeout(timer);
    }
    setRenderIntroLoader(true);
  }, [showIntroLoader]);

  useEffect(() => {
    const progressEl = progressRef.current;
    if (!progressEl) return;

    if (renderIntroLoader) {
      progressEl.style.transform = 'scaleX(0)';
      if (progressFrame.current) {
        cancelAnimationFrame(progressFrame.current);
        progressFrame.current = null;
      }
      return;
    }

    const update = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      progressEl.style.transform = `scaleX(${progress})`;
      progressFrame.current = null;
    };

    const onScroll = () => {
      if (progressFrame.current !== null) return;
      progressFrame.current = requestAnimationFrame(update);
    };

    const onResize = () => {
      update();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    update();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (progressFrame.current) cancelAnimationFrame(progressFrame.current);
    };
  }, [location.pathname, renderIntroLoader]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    if (prefersReducedMotion.current) return;

    const styleId = 'wukala-reveal-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .reveal-base { opacity: 0; transform: translateY(18px); transition: opacity 0.7s ease, transform 0.7s ease; will-change: transform, opacity; }
        .reveal-visible { opacity: 1; transform: translateY(0); }
        @media (prefers-reduced-motion: reduce) { .reveal-base { opacity: 1; transform: none; transition: none; } }
      `;
      document.head.appendChild(style);
    }

    const sections = Array.from(document.querySelectorAll('main section')) as HTMLElement[];
    const revealTargets = sections.filter((section) => !section.dataset.revealReady);

    revealTargets.forEach((section) => {
      section.dataset.revealReady = 'true';
      section.classList.add('reveal-base');
    });

    if (!revealTargets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    revealTargets.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [location.pathname]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-background">
      <div
        ref={progressRef}
        className={cn(
          'fixed left-0 top-0 z-[90] h-[3px] w-full origin-left bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300',
          'after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent after:opacity-40',
          allowMotion ? 'transition-transform duration-75 ease-out' : ''
        )}
        style={{ transform: 'scaleX(0)' }}
        aria-hidden
      />

      {/* Header */}
      {renderIntroLoader && (
        <div
          className={cn(
            'fixed inset-0 z-[70] flex items-center justify-center bg-gradient-to-br from-background via-background to-background/90 backdrop-blur',
            'transition-all duration-500',
            showIntroLoader ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
          )}
          aria-label="Loading Wukala-GPT"
        >
          <div className="relative flex items-center gap-5">
            <div className="relative h-14 w-14 rounded-full bg-gradient-to-br from-amber-400/70 via-amber-500/60 to-amber-300/60 shadow-[0_20px_60px_rgba(251,191,36,0.32)] flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 rounded-full border-[3px] border-amber-200/40 border-t-amber-500/90 animate-spin" aria-hidden />
              <div className="absolute inset-[3px] rounded-full bg-background/80 backdrop-blur" />
              <img
                src={logo}
                alt="Wukala-GPT"
                className="relative h-8 w-8 rounded-full object-cover shadow-sm animate-[pulse_2s_ease-in-out_infinite]"
              />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Wukala-GPT</p>
              <p className="text-xs text-muted-foreground">Loading…</p>
              <div className="h-1.5 w-32 rounded-full bg-muted overflow-hidden">
                <div className="h-full w-1/2 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-300 animate-[shimmer_1.6s_ease_infinite]" />
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65 shadow-[0_10px_40px_rgba(0,0,0,0.15)]">
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" aria-hidden />
        <div className="container flex h-14 lg:h-16 items-center justify-between px-4">
          <div className="absolute inset-0 -z-10 opacity-70 bg-[radial-gradient(circle_at_10%_20%,rgba(251,191,36,0.08),transparent_35%),radial-gradient(circle_at_90%_10%,rgba(59,130,246,0.09),transparent_32%)]" aria-hidden />
          {/* Logo */}
          <Link to={(user?.role || '').toLowerCase() === 'admin' ? '/admin' : '/'} className="group flex items-center space-x-2 lg:space-x-3 [perspective:1200px]">
            <span className="relative inline-flex items-center justify-center rounded-full p-[2px] ring-2 ring-amber-400 ring-offset-2 ring-offset-background shadow-[0_0_12px_rgba(251,191,36,0.25)] transition-all duration-500 group-hover:ring-amber-300 group-hover:shadow-[0_0_18px_rgba(251,191,36,0.4)]">
              <img 
                src={logo} 
                alt="Wukala-GPT Logo" 
                className="h-10 w-10 lg:h-12 lg:w-12 rounded-full object-cover shadow-sm transition-transform duration-500 [transform:translateZ(0)] group-hover:[transform:rotateY(12deg)_translateZ(8px)_scale(1.08)] group-hover:shadow-xl"
              />
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex flex-1 items-center justify-center gap-0.5 px-2">
            {navigation.filter((item) => !HELP_MENU_LABELS.has(item.name)).map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'group relative flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 border border-transparent whitespace-nowrap',
                    isActive
                      ? 'bg-gradient-to-r from-amber-500/85 via-amber-400/80 to-amber-300/80 text-amber-950 shadow-[0_8px_24px_rgba(251,191,36,0.25)] ring-1 ring-amber-300/70'
                      : 'text-muted-foreground hover:text-foreground hover:shadow-[0_8px_24px_rgba(251,191,36,0.15)] hover:border-amber-300/40 hover:bg-gradient-to-r hover:from-amber-500/8 hover:to-amber-400/4'
                  )}
                >
                  <span className={cn('absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 blur-sm', isActive ? 'bg-amber-400/30 opacity-100' : 'group-hover:opacity-100 bg-amber-400/15')} aria-hidden />
                  <item.icon className="h-3.5 w-3.5" />
                  <span className="relative">{item.name}</span>
                </Link>
              );
            })}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    'group relative flex items-center space-x-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-300 border border-transparent',
                    isHelpRoute
                      ? 'bg-gradient-to-r from-amber-500/85 via-amber-400/80 to-amber-300/80 text-amber-950 shadow-[0_8px_24px_rgba(251,191,36,0.25)] ring-1 ring-amber-300/70'
                      : 'text-muted-foreground hover:text-foreground hover:shadow-[0_8px_24px_rgba(251,191,36,0.15)] hover:border-amber-300/40 hover:bg-gradient-to-r hover:from-amber-500/8 hover:to-amber-400/4'
                  )}
                >
                  <span className="relative flex items-center gap-1">
                    <HelpCircle className="h-3.5 w-3.5" />
                    <span>Help</span>
                    <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 rounded-2xl border border-border/70 bg-background/95 backdrop-blur p-2 shadow-[0_20px_70px_rgba(0,0,0,0.25)]">
                {helpMenuItems.map((item) => (
                  <DropdownMenuItem asChild key={item.name} className="rounded-lg">
                    <Link
                      to={item.href}
                      className="flex items-center gap-2 text-xs"
                    >
                      <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{item.name}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="group relative h-10 w-10 p-0 rounded-full border border-amber-200/60 bg-background/70 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(251,191,36,0.22)] overflow-hidden"
            >
              <span className="absolute inset-0 bg-gradient-to-br from-amber-400/40 via-primary/35 to-emerald-400/35 opacity-80" aria-hidden />
              <span className="absolute inset-0 blur-lg bg-amber-300/45 opacity-60 group-hover:opacity-90 transition-opacity" aria-hidden />
              <span className="relative flex h-full w-full items-center justify-center text-foreground drop-shadow-sm">
                {isDark ? (
                  <Sun className="h-5 w-5 transition-all duration-300 group-hover:rotate-6 group-active:scale-95" />
                ) : (
                  <Moon className="h-5 w-5 transition-all duration-300 group-hover:-rotate-6 group-active:scale-95" />
                )}
              </span>
              <span className="sr-only">Toggle theme</span>
            </Button>

            {!isAuthenticated ? (
              <div className="hidden lg:flex space-x-2">
                <Button 
                  asChild 
                  variant="outline"
                  size="sm"
                  className="rounded-full border-amber-200/70 bg-background/80 backdrop-blur px-4 shadow-[0_10px_30px_rgba(0,0,0,0.14)] hover:-translate-y-0.5 hover:shadow-[0_16px_44px_rgba(251,191,36,0.22)] transition-all duration-300"
                >
                  <Link to="/login">Sign In</Link>
                </Button>
                <Button 
                  asChild 
                  className="rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 text-amber-950 shadow-[0_12px_40px_rgba(251,191,36,0.32)] hover:shadow-[0_16px_50px_rgba(251,191,36,0.4)] transition-all duration-300 px-4"
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
                    {(user?.role || '').toLowerCase() === 'lawyer' && (
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
                <div className="pt-4 mt-2 border-t border-border/60">
                  <p className="px-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-2">Help</p>
                  <div className="flex flex-col space-y-2">
                    {helpMenuItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                          location.pathname === item.href
                            ? 'bg-primary/90 text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>
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
          <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur max-h-[60vh] overflow-y-auto">
            <nav className="container py-3 px-3">
              <div className="flex flex-col space-y-1">
                {/* User Info Header */}
                <div className="px-2 py-2 border-b border-border mb-1">
                  <p className="text-xs font-medium">{user?.name}</p>
                  <p className="text-[10px] text-muted-foreground">{user?.email}</p>
                </div>

                {/* Navigation Items */}
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center space-x-2 px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      )}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}

                {/* Profile Button - Separate section */}
                <div className="pt-2 mt-1 border-t border-border/60">
                  {user?.role === 'lawyer' && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full justify-start mb-1 h-8 text-xs px-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link to="/lawyer-profile">
                        <User className="h-3.5 w-3.5 mr-1.5" />
                        My Profile
                      </Link>
                    </Button>
                  )}
                  {user?.role === 'client' && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="w-full justify-start mb-1 h-8 text-xs px-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Link to="/profile">
                        <User className="h-3.5 w-3.5 mr-1.5" />
                        My Profile
                      </Link>
                    </Button>
                  )}
                  
                  {/* Logout Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 h-8 text-xs px-2"
                  >
                    <LogOut className="h-3.5 w-3.5 mr-1.5" />
                    Logout
                  </Button>
                </div>
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

      {showScrollTop && (
        <Button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-4 lg:bottom-8 lg:right-8 h-12 w-12 p-0 rounded-full border border-amber-400/50 bg-gradient-to-br from-amber-500/90 via-amber-400/80 to-amber-300/80 text-amber-950 shadow-[0_20px_60px_rgba(251,191,36,0.35)] backdrop-blur transition-all duration-300 hover:shadow-[0_26px_80px_rgba(251,191,36,0.45)] hover:scale-105 active:scale-100"
          variant="secondary"
          aria-label="Back to top"
        >
          <span className="relative inline-flex items-center justify-center h-full w-full">
            <span className="absolute inset-0 rounded-full blur-2xl bg-amber-400/60 animate-pulse" aria-hidden />
            <ArrowUp className="relative h-5 w-5 drop-shadow-sm" />
          </span>
        </Button>
      )}

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Who We Serve strip (all pages except chat) */}
      {location.pathname !== '/chat' && (
        <section className="border-t border-border/60 bg-gradient-to-r from-background via-muted/20 to-background">
          <div className="container px-4 py-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Who We Serve</p>
                <p className="text-lg lg:text-xl font-semibold text-foreground">Guiding people and professionals across the legal journey</p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-foreground">
                <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2 shadow-sm">
                  <User className="h-4 w-4" /> Individuals
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2 shadow-sm">
                  <Scale className="h-4 w-4" /> Legal Professionals
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2 shadow-sm">
                  <Users className="h-4 w-4" /> Law Firms
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Built for Pakistan’s legal system, aligned with local laws and professional standards.</p>
              <p className="text-xs text-muted-foreground">Languages Supported: Urdu & English</p>
            </div>
          </div>
        </section>
      )}

      {/* Footer - Show on all pages except AI Assistant */}
      {location.pathname !== '/chat' && (
        <footer className="border-t border-border/60 bg-muted/40 text-muted-foreground">
          <div className="container py-10 lg:py-14 px-4">
            <div className="grid gap-10 lg:gap-12 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr] items-start">
              <div className="space-y-4">
                <div className="group inline-flex items-center space-x-3 [perspective:1200px]">
                  <span className="relative inline-flex items-center justify-center rounded-full p-[3px] ring-2 ring-amber-400 ring-offset-2 ring-offset-muted/40 shadow-[0_0_10px_rgba(251,191,36,0.22)] transition-all duration-500 group-hover:ring-amber-300 group-hover:shadow-[0_0_14px_rgba(251,191,36,0.36)]">
                    <img 
                      src={logo} 
                      alt="Wukala-GPT Logo" 
                      className="h-10 w-10 lg:h-12 lg:w-12 rounded-full object-cover shadow-sm transition-transform duration-500 [transform:translateZ(0)] group-hover:[transform:rotateY(10deg)_translateZ(6px)_scale(1.06)] group-hover:shadow-lg"
                    />
                  </span>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Wukala-GPT</p>
                    <p className="text-xs leading-relaxed max-w-xs">AI-first legal intelligence for teams who need accuracy, speed, and compliance.</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-foreground mt-[2px]" />
                    <span>Karachi & Islamabad, Pakistan</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Phone className="h-4 w-4 text-foreground mt-[2px]" />
                    <span>+92 (0) 300 000 0000</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Mail className="h-4 w-4 text-foreground mt-[2px]" />
                    <span>enterprise@wukala.ai</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Disclaimer:</strong> Wukala-GPT provides AI-powered legal guidance for informational purposes only and does not replace professional legal advice. Final legal decisions and actions should always be taken in consultation with a qualified lawyer.
                </p>
                <div className="flex items-center space-x-3 text-foreground">
                  <a aria-label="LinkedIn" href="#" className="rounded-full border border-border/70 bg-background/70 p-2 hover:border-amber-400 hover:text-amber-500 transition-colors">
                    <Linkedin className="h-4 w-4" />
                  </a>
                  <a aria-label="Twitter" href="#" className="rounded-full border border-border/70 bg-background/70 p-2 hover:border-amber-400 hover:text-amber-500 transition-colors">
                    <Twitter className="h-4 w-4" />
                  </a>
                  <a aria-label="Instagram" href="#" className="rounded-full border border-border/70 bg-background/70 p-2 hover:border-amber-400 hover:text-amber-500 transition-colors">
                    <Instagram className="h-4 w-4" />
                  </a>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Platform</p>
                <div className="grid gap-2 text-sm">
                  <a href="#" className="hover:text-foreground transition-colors">AI Assistant</a>
                  <a href="#" className="hover:text-foreground transition-colors">Case Law Explorer</a>
                  <a href="#" className="hover:text-foreground transition-colors">Document Workspace</a>
                  <a href="#" className="hover:text-foreground transition-colors">Secure Messaging</a>
                  <a href="#" className="hover:text-foreground transition-colors">Compliance Controls</a>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Resources</p>
                <div className="grid gap-2 text-sm">
                  <Link to="/legal-guides" className="hover:text-foreground transition-colors">Legal Guides</Link>
                  <Link to="/security-privacy" className="hover:text-foreground transition-colors">Security & Privacy</Link>
                  <Link to="/pakistan-laws" className="hover:text-foreground transition-colors">Pakistan Laws Overview</Link>
                  <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
                  <Link to="/help" className="hover:text-foreground transition-colors">Help & Support</Link>
                  <Link to="/contact" className="hover:text-foreground transition-colors">Contact Us</Link>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Quick Links</p>
                <div className="grid gap-2 text-sm">
                  <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
                  <Link to="/about" className="hover:text-foreground transition-colors">About</Link>
                  <Link to="/faq" className="hover:text-foreground transition-colors">FAQ</Link>
                  <Link to="/how-it-works" className="hover:text-foreground transition-colors">How It Works</Link>
                  <Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
                  <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
                  <Link to="/leadership" className="hover:text-foreground transition-colors">Leadership</Link>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Stay Updated</p>
                <p className="text-sm">Monthly product updates, legal AI best practices, and release notes.</p>
                <div className="flex items-center space-x-2">
                  <input
                    type="email"
                    placeholder="Work email"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200/50"
                  />
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-amber-950">Subscribe</Button>
                </div>
                <p className="text-xs text-muted-foreground">We respect your inbox. Unsubscribe anytime.</p>
              </div>
            </div>

            <div className="mt-10 border-t border-border/50 pt-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 text-xs lg:text-sm">
              <span>© 2024 Wukala-GPT. Transforming legal services in Pakistan.</span>
              <div className="flex items-center gap-4">
                <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-foreground transition-colors">Responsible AI</a>
                <a href="#" className="hover:text-foreground transition-colors">Status</a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
