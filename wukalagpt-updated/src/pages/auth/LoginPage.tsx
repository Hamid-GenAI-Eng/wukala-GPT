import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import logo from '@/assets/Wukala-GPT-Logo-Green.jpg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { api, ApiError } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, setToken } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const element = document.querySelector('.login-form');
    if (element) {
      element.classList.remove('opacity-0');
      element.classList.add('animate-fade-in');
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);

      try {
        // Call backend API for login
        const response = await api.login(formData.email, formData.password);

        if (!response.token) {
           throw new ApiError('No token received from login server', 500);
        }

        // 1. Store the auth token (mandatory before calling getProfile)
        setToken(response.token, rememberMe);

        // 2. Fetch the full user profile (since login only returns the token)
        const userData = await api.getProfile();

        // 3. Complete the login context with user data
        login(userData);

        toast({
          title: 'Welcome Back!',
          description: `Signed in as ${userData.name}`,
        });

        // Reset onboarding for normal users (show tour on login)
        localStorage.removeItem('wukala_onboarding_completed');

        // Navigate based on user role
        if (userData.role === 'admin') {
          navigate('/admin');
        } else if (userData.role === 'lawyer') {
          navigate('/lawyer-dashboard');
        } else {
          navigate('/chat');
        }
      } catch (error) {
        console.error('Login error:', error);

        if (error instanceof ApiError) {
          toast({
            title: 'Login Failed',
            description: error.message || 'Invalid email or password',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Login Failed',
            description: 'Unable to connect to server. Please try again later.',
            variant: 'destructive',
          });
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/14 to-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.06),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.08),transparent_48%),radial-gradient(circle_at_50%_80%,rgba(59,130,246,0.06),transparent_52%)]" aria-hidden />
      <div className="container mx-auto relative">
        <Button
          variant="ghost"
          onClick={() => navigate('/auth/role')}
          className="absolute top-4 left-4 sm:top-8 sm:left-8 inline-flex items-center gap-2 rounded-full border border-amber-200/60 bg-background/70 px-4 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(251,191,36,0.22)]"
        >
          <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/80 via-primary/80 to-emerald-400/70 shadow-[0_0_0_4px_rgba(251,191,36,0.18)]">
            <span className="absolute inset-0 rounded-full blur-md bg-amber-300/60 opacity-70" aria-hidden />
            <ArrowLeft className="relative w-4 h-4 text-primary-foreground" />
          </span>
          <span className="text-sm font-semibold text-foreground">Back</span>
        </Button>

        <div className="max-w-md mx-auto">
          <div className="login-form relative overflow-hidden bg-card/95 backdrop-blur-xl border border-amber-200/60 rounded-2xl p-6 sm:p-8 shadow-[0_18px_60px_rgba(0,0,0,0.22)] ring-1 ring-amber-300/35 opacity-0 transition-all duration-700">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/6 via-transparent to-amber-200/10" aria-hidden />
            <div className="pointer-events-none absolute -top-10 -right-12 h-32 w-32 rounded-full bg-primary/12 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-amber-300/16 blur-3xl" aria-hidden />
            <div className="text-center mb-8 relative z-10">
              <div className="relative w-16 h-16 mx-auto mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-400/70 via-primary/70 to-emerald-400/70 shadow-[0_0_0_6px_rgba(251,191,36,0.18),0_18px_50px_rgba(0,0,0,0.18)]">
                <div className="absolute inset-0 blur-lg bg-amber-300/55 opacity-75" aria-hidden />
                <img src={logo} alt="Wukala-GPT" className="relative h-full w-full object-cover" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Sign in to your Wukala-GPT account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                    placeholder="Enter your email"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`pl-10 pr-10 ${errors.password ? 'border-destructive' : ''}`}
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 text-sm cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="rounded border-amber-300 accent-primary text-primary focus:ring-primary h-4 w-4" 
                    disabled={isLoading} 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors select-none">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full shadow-[0_12px_36px_rgba(251,191,36,0.22)] hover:shadow-[0_16px_46px_rgba(251,191,36,0.26)] transition-shadow"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <button
                  onClick={() => navigate('/auth/role')}
                  className="text-primary hover:underline font-medium"
                  disabled={isLoading}
                >
                  Sign up here
                </button>
              </p>
            </div>

            <div className="text-center mt-6 text-xs text-muted-foreground">
              🔒 Secured & Verified by Wukala-GPT
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
