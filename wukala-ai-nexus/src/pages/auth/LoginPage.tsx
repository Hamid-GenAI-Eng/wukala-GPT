import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
// Using CSS animations instead

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
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

  const handleSubmit = (e: React.FormEvent) => {
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
      // Admin login credentials
      if (formData.email === 'admin@wukala.com' && formData.password === 'admin123') {
        const userData = {
          id: 'admin',
          name: 'Admin User',
          email: formData.email,
          role: 'admin' as const
        };
        login(userData);
        setTimeout(() => navigate('/admin'), 600);
        return;
      }

      // Check if lawyer exists in applications
      let userRole: 'client' | 'lawyer' = 'client';
      let userName = 'User';
      let userStatus: 'pending' | 'approved' | 'rejected' | undefined = undefined;

      try {
        const stored = localStorage.getItem('lawyer_applications');
        if (stored) {
          const apps = JSON.parse(stored);
          const lawyerApp = apps.find((app: any) => app.email === formData.email);
          if (lawyerApp) {
            userRole = 'lawyer';
            userName = lawyerApp.name;
            userStatus = lawyerApp.status;
          }
        }
      } catch {}

      const userData = {
        id: Date.now().toString(),
        name: userName,
        email: formData.email,
        role: userRole,
        ...(userStatus && { status: userStatus })
      };
      
      login(userData);
      
      // Success animation
      const element = document.querySelector('.login-form');
      if (element) {
        element.classList.add('animate-scale-in');
        setTimeout(() => navigate('/chat'), 600);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background flex items-center justify-center px-4">
      <div className="container mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate('/auth/role')}
          className="absolute top-4 left-4 sm:top-8 sm:left-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="max-w-md mx-auto">
          <div className="login-form bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xl opacity-0 transition-all duration-700">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-primary rounded-2xl flex items-center justify-center">
                <Lock className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Sign in to your Wukala-GPT account</p>
              <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong>Admin Access:</strong> admin@wukala.com / admin123
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" className="rounded border-border" />
                  <span className="text-muted-foreground">Remember me</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>

            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <button
                  onClick={() => navigate('/auth/role')}
                  className="text-primary hover:underline font-medium"
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