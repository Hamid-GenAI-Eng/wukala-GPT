import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Send, CheckCircle2 } from 'lucide-react';
import logo from '@/assets/Wukala-GPT-Logo-Green.jpg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, ApiError } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.forgotPassword(email);
      setIsSent(true);
      toast({
        title: 'Email Sent',
        description: 'Check your inbox for a password reset link.',
      });
    } catch (err) {
      console.error('Forgot password error:', err);
      if (err instanceof ApiError) {
        setError(err.message || 'Unable to process request. Please try again.');
      } else {
        setError('Connection error. Please check your internet.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/14 to-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(218,80,18,0.04),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(45,100,50,0.06),transparent_48%)]" aria-hidden />
      
      <div className="container mx-auto relative max-w-md">
        <Button
          variant="ghost"
          onClick={() => navigate('/login')}
          className="absolute -top-16 left-0 inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-4 backdrop-blur-md transition-all hover:-translate-y-0.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Login</span>
        </Button>

        <div className="glass relative overflow-hidden rounded-3xl p-8 shadow-xl border border-glass-border animate-fade-in">
          <div className="pointer-events-none absolute -top-10 -right-12 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
          
          <div className="text-center mb-8">
            <div className="relative w-16 h-16 mx-auto mb-4 rounded-2xl overflow-hidden shadow-lg border-2 border-primary/20 bg-white">
              <img src={logo} alt="Wukala-GPT" className="relative h-full w-full object-cover" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Forgot Password?</h1>
            <p className="text-muted-foreground">
              Enter the email address associated with your account and we'll send you a link to reset your password.
            </p>
          </div>

          {!isSent ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`pl-10 h-12 ${error ? 'border-destructive' : ''}`}
                    disabled={isLoading}
                    required
                  />
                </div>
                {error && <p className="text-xs text-destructive mt-1 font-medium">{error}</p>}
              </div>

              <Button
                type="submit"
                className="w-full h-12 btn-gold text-white font-semibold rounded-xl text-lg flex items-center justify-center gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Reset Link
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center py-6 space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 text-success mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Check your email</h3>
                <p className="text-muted-foreground">
                  We've sent a password reset link to <span className="font-semibold text-foreground">{email}</span>. 
                  The link will expire in 1 hour.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl"
                onClick={() => setIsSent(false)}
              >
                Didn't receive it? Try again
              </Button>
            </div>
          )}

          <div className="text-center mt-8 text-xs text-muted-foreground">
            🔒 Wukala-GPT uses enterprise-grade security to protect your data.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
