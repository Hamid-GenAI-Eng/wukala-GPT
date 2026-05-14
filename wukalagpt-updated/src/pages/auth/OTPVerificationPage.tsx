import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { api, ApiError } from '@/services/api';
import { ArrowLeft, Mail, RefreshCw } from 'lucide-react';

export default function OTPVerificationPage() {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login, setToken } = useAuth();

  // Get email and user data from navigation state
  const email = location.state?.email;
  const userType = location.state?.userType || 'user';
  const userData = location.state?.userData;

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Start countdown when component mounts
  useEffect(() => {
    setCountdown(60); // 60 seconds countdown
  }, []);

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter a 6-digit OTP code',
        variant: 'destructive',
      });
      return;
    }

    if (!email) {
      toast({
        title: 'Error',
        description: 'Email not found. Please go back and try again.',
        variant: 'destructive',
      });
      navigate('/auth/role');
      return;
    }

    setIsVerifying(true);

    try {
      // Call backend API for OTP verification
      const response = await api.verifyOtp(email, otp);

      // If token is returned, store it
      if (response.token) {
        setToken(response.token);
      }

      // Log in the user if user data is returned
      if (response.user) {
        login(response.user);
      } else if (userData) {
        login(userData);
      }

      toast({
        title: 'Verification Successful',
        description: 'Your account has been verified successfully',
      });

      // Reset onboarding for normal users (show tour on login)
      localStorage.removeItem('wukala_onboarding_completed');

      // Navigate based on user type
      if (userType === 'lawyer') {
        navigate('/lawyer-profile');
      } else {
        navigate('/chat');
      }
    } catch (error) {
      console.error('OTP verification error:', error);

      if (error instanceof ApiError) {
        toast({
          title: 'Verification Failed',
          description: error.message || 'The OTP code you entered is incorrect. Please try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Verification Failed',
          description: 'Unable to connect to server. Please try again later.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0 || !email) return;

    setIsResending(true);

    try {
      // Call backend API to resend OTP
      await api.resendOtp(email);

      toast({
        title: 'OTP Resent',
        description: 'A new verification code has been sent to your email',
      });

      // Reset countdown
      setCountdown(60);
    } catch (error) {
      console.error('Resend OTP error:', error);

      if (error instanceof ApiError) {
        toast({
          title: 'Failed to Resend',
          description: error.message || 'Unable to resend OTP. Please try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Failed to Resend',
          description: 'Unable to connect to server. Please try again later.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card className="border-border/60 shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                We've sent a 6-digit verification code to
                <br />
                <span className="font-medium text-foreground">{email || 'your email'}</span>
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* OTP Input */}
            <div className="space-y-4">
              <div className="text-center">
                <label className="text-sm font-medium text-foreground">
                  Enter verification code
                </label>
              </div>

              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(value) => setOtp(value)}
                  disabled={isVerifying}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>

            {/* Verify Button */}
            <Button
              onClick={handleVerifyOTP}
              disabled={otp.length !== 6 || isVerifying}
              className="w-full h-11"
              size="lg"
            >
              {isVerifying ? 'Verifying...' : 'Verify Email'}
            </Button>

            {/* Resend OTP */}
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Didn't receive the code?
              </p>
              <Button
                variant="outline"
                onClick={handleResendOTP}
                disabled={countdown > 0 || isResending}
                className="w-full"
              >
                {isResending ? (
                  'Sending...'
                ) : countdown > 0 ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Resend in {countdown}s
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend Code
                  </>
                )}
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                The verification code will expire in 10 minutes
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
