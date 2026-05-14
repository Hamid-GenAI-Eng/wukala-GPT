import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Mail } from 'lucide-react';

export default function OTPVerificationPage() {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();
  
  // Get email and user data from navigation state
  const email = location.state?.email || 'your email';
  const userType = location.state?.userType || 'user';
  const userData = location.state?.userData;

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a 6-digit OTP code",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);
    
    // Simulate OTP verification (replace with actual API call)
    setTimeout(() => {
      if (otp === '123456') { // Mock successful OTP
        toast({
          title: "Verification Successful",
          description: "Your account has been verified successfully",
        });
        
        // Log in the user with stored userData
        if (userData) {
          login(userData);
        }
        
        // Navigate based on user type
        if (userType === 'lawyer') {
          navigate('/lawyer-profile');
        } else {
          navigate('/');
        }
      } else {
        toast({
          title: "Invalid OTP",
          description: "The OTP code you entered is incorrect. Please try again.",
          variant: "destructive"
        });
      }
      setIsVerifying(false);
    }, 1500);
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
                <span className="font-medium text-foreground">{email}</span>
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

            {/* Help Text */}
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                The verification code will expire in 10 minutes
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Demo Notice */}
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardContent className="pt-4">
            <p className="text-xs text-amber-700 dark:text-amber-400 text-center">
              <strong>Demo Mode:</strong> Use OTP code "123456" to verify successfully
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}