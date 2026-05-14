import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, ApiError } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (formData.newPassword === formData.currentPassword) {
      setError('New password cannot be the same as the current one.');
      return;
    }

    setIsLoading(true);

    try {
      await api.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      toast({
        title: 'Security Updated',
        description: 'Your password has been changed successfully.',
      });
      
      // Navigate back to profile or dashboard
      navigate('/profile');
    } catch (err) {
      console.error('Change password error:', err);
      if (err instanceof ApiError) {
        setError(err.message || 'Failed to change password. Please check your current password.');
      } else {
        setError('Network error. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Dynamic background patterns */}
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-primary rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-gold/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-emerald-500/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="container mx-auto relative z-10 max-w-lg">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-background/50 px-4 backdrop-blur-md transition-all hover:bg-muted"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </Button>

        <div className="bg-card/80 backdrop-blur-xl border border-border rounded-3xl p-8 shadow-2xl animate-slide-up">
          <div className="flex items-center gap-4 mb-8">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Security Settings</h1>
              <p className="text-muted-foreground">Update your account password</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm font-medium flex items-center gap-3 border border-destructive/20 transition-all animate-shake">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="currentPassword"
                    type={showPasswords ? 'text' : 'password'}
                    placeholder="Enter current password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="pl-10 h-12 rounded-xl focus-visible:ring-primary"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="newPassword">New Password</Label>
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    {showPasswords ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showPasswords ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showPasswords ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={formData.newPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="pl-10 h-12 rounded-xl focus-visible:ring-primary"
                    disabled={isLoading}
                    required
                  />
                </div>
                <p className="text-[10px] text-muted-foreground px-1">
                  Use at least 8 characters with a mix of letters, numbers & symbols.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPasswords ? 'text' : 'password'}
                    placeholder="Re-type new password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="pl-10 h-12 rounded-xl focus-visible:ring-primary"
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12 rounded-xl"
                onClick={() => navigate(-1)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-[2] h-12 btn-gold text-white font-bold rounded-xl shadow-lg transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  'Update Password'
                )}
              </Button>
            </div>
          </form>

          <div className="mt-10 p-4 rounded-2xl bg-muted/30 border border-border/50">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5" />
              Security Tips
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
              <li>Changing your password will NOT log you out from other devices.</li>
              <li>Avoid using the same password for multiple platforms.</li>
              <li>Passwords are encrypted before storage using enterprise algorithms.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
