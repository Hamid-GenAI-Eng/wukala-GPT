import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import logo from '@/assets/Wukala-GPT-Logo-Green.jpg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, ApiError } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !emailParam) {
      setError('Invalid or expired reset link. Please request a new one.');
    }
  }, [token, emailParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!token || !emailParam) {
      setError('Missing reset token or email. Link may be invalid.');
      return;
    }

    setIsLoading(true);

    try {
      await api.resetPassword({
        email: emailParam,
        token: token,
        newPassword: formData.password,
      });

      setIsSuccess(true);
      toast({
        title: 'Success!',
        description: 'Your password has been reset successfully.',
      });
      
      // Automatic redirect after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      console.error('Reset password error:', err);
      if (err instanceof ApiError) {
        setError(err.message || 'Failed to reset password. The link may have expired.');
      } else {
        setError('Network error. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/14 to-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(G,185,129,0.04),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(218,80,18,0.06),transparent_48%)]" aria-hidden />
      
      <div className="container mx-auto relative max-w-md animate-fade-in">
        <div className="glass relative overflow-hidden rounded-3xl p-8 shadow-2xl border border-glass-border">
          <div className="text-center mb-8">
            <div className="relative w-16 h-16 mx-auto mb-4 rounded-2xl overflow-hidden shadow-lg border-2 border-primary/20 bg-white">
              <img src={logo} alt="Wukala-GPT" className="relative h-full w-full object-cover" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Create New Password</h1>
            <p className="text-muted-foreground">
              Your new password must be different from previous used passwords.
            </p>
          </div>

          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium flex items-center gap-2 border border-destructive/20 animate-shake">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="pl-10 pr-10 h-12"
                    disabled={isLoading || !!error && !formData.password}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="pl-10 h-12"
                    disabled={isLoading || !!error && !formData.password}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 btn-gold text-white font-semibold rounded-xl text-lg flex items-center justify-center gap-2"
                disabled={isLoading || (!!error && !token)}
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  'Reset Password'
                )}
              </Button>
              
              {(!token || !emailParam) && (
                <Button 
                  variant="link" 
                  className="w-full text-primary" 
                  onClick={() => navigate('/forgot-password')}
                >
                  Request a new reset link
                </Button>
              )}
            </form>
          ) : (
            <div className="text-center py-6 space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 text-success mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Password Reset!</h3>
                <p className="text-muted-foreground">
                  Your password has been updated. You will be redirected to the login page in a few seconds.
                </p>
              </div>
              <Button
                className="w-full h-12 rounded-xl flex items-center justify-center gap-2"
                onClick={() => navigate('/login')}
              >
                Go to Login Now
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="text-center mt-8 text-xs text-muted-foreground">
            🔒 Wukala-GPT • Enterprise Identity Protection
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
