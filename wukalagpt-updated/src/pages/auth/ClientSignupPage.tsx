import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, MapPin, Lock, Eye, EyeOff } from 'lucide-react';
import logo from '@/assets/Wukala-GPT-Logo-Green.jpg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { api, ApiError } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const ClientSignupPage = () => {
  const navigate = useNavigate();
  const { login, setToken } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const element = document.querySelector('.signup-form');
    if (element) {
      element.classList.remove('opacity-0');
      element.classList.add('animate-fade-in');
    }
  }, []);

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'name':
        return value.length < 2 ? 'Name must be at least 2 characters' : '';
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? 'Please enter a valid email' : '';
      case 'phone':
        const phoneRegex = /^(\+92|0)?[0-9]{10,11}$/;
        return !phoneRegex.test(value.replace(/[\s-]/g, '')) ? 'Please enter a valid phone number' : '';
      case 'city':
        return value.length < 2 ? 'Please enter your city' : '';
      case 'password':
        return value.length < 8 ? 'Password must be at least 8 characters' : '';
      case 'confirmPassword':
        return value !== formData.password ? 'Passwords do not match' : '';
      default:
        return '';
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error and validate
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: Record<string, string> = {};
    Object.entries(formData).forEach(([key, value]) => {
      const error = validateField(key, value);
      if (error) newErrors[key] = error;
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);

      try {
        // Call backend API for client registration
        const response = await api.registerClient({
          fullName: formData.name,
          email: formData.email,
          phoneNo: formData.phone,
          city: formData.city,
          password: formData.password,
        });

        toast({
          title: 'Account Created!',
          description: 'Please verify your email to continue.',
        });

        // Navigate to OTP verification
        navigate('/verify-otp', {
          state: {
            email: formData.email,
            userType: 'client',
            userData: response.user
          }
        });
      } catch (error) {
        console.error('Signup error:', error);

        if (error instanceof ApiError) {
          if (error.status === 409) {
            toast({
              title: 'Account Exists',
              description: 'An account with this email already exists. Please login instead.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Signup Failed',
              description: error.message || 'Unable to create account. Please try again.',
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Signup Failed',
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/14 to-background px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.06),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.08),transparent_48%),radial-gradient(circle_at_50%_80%,rgba(59,130,246,0.06),transparent_52%)]" aria-hidden />
      <div className="container mx-auto py-6 sm:py-8 relative">
        <Button
          variant="ghost"
          onClick={() => navigate('/auth/role')}
          className="mb-6 sm:mb-8 inline-flex items-center gap-2 rounded-full border border-amber-200/60 bg-background/70 px-4 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(251,191,36,0.22)]"
          size="sm"
        >
          <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400/80 via-primary/80 to-emerald-400/70 shadow-[0_0_0_4px_rgba(251,191,36,0.18)]">
            <span className="absolute inset-0 rounded-full blur-md bg-amber-300/60 opacity-70" aria-hidden />
            <ArrowLeft className="relative w-4 h-4 text-primary-foreground" />
          </span>
          <span className="text-sm font-semibold text-foreground">Back to Role Selection</span>
        </Button>

        <div className="max-w-md mx-auto">
          <div className="signup-form relative overflow-hidden bg-card/95 backdrop-blur-xl border border-amber-200/60 rounded-2xl p-6 sm:p-8 shadow-[0_18px_60px_rgba(0,0,0,0.22)] ring-1 ring-amber-300/35 opacity-0 transition-all duration-700">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/6 via-transparent to-amber-200/10" aria-hidden />
            <div className="pointer-events-none absolute -top-10 -right-12 h-32 w-32 rounded-full bg-primary/12 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-12 -left-10 h-32 w-32 rounded-full bg-amber-300/16 blur-3xl" aria-hidden />
            <div className="text-center mb-6 sm:mb-8">
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl overflow-hidden bg-gradient-to-br from-amber-400/70 via-primary/70 to-emerald-400/70 shadow-[0_0_0_6px_rgba(251,191,36,0.18),0_18px_50px_rgba(0,0,0,0.18)]">
                <div className="absolute inset-0 blur-lg bg-amber-300/50 opacity-70" aria-hidden />
                <img src={logo} alt="Wukala-GPT" className="relative h-full w-full object-cover" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Create Account</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Join as a client and get legal assistance</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 relative z-10">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`pl-10 ${errors.name ? 'border-destructive' : ''}`}
                    placeholder="Enter your full name"
                    disabled={isLoading}
                  />
                </div>
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

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
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`pl-10 ${errors.phone ? 'border-destructive' : ''}`}
                    placeholder="03XX-XXXXXXX"
                    disabled={isLoading}
                  />
                </div>
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`pl-10 ${errors.city ? 'border-destructive' : ''}`}
                    placeholder="Enter your city"
                    disabled={isLoading}
                  />
                </div>
                {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
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
                    placeholder="Create a password"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`pl-10 pr-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                    placeholder="Confirm your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>

              <Button
                type="submit"
                className="w-full shadow-[0_12px_36px_rgba(251,191,36,0.22)] hover:shadow-[0_16px_46px_rgba(251,191,36,0.26)] transition-shadow"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-primary hover:underline font-medium"
                  disabled={isLoading}
                >
                  Sign in here
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

export default ClientSignupPage;
