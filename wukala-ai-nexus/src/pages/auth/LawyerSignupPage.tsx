import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
// Using CSS animations instead

const LawyerSignupPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1
    fullName: '',
    email: '',
    phone: '',
    cnic: '',
    city: '',
    password: '',
    // Step 2
    barCouncilNumber: '',
    degreeTitle: '',
    university: '',
    yearOfCompletion: '',
    chamberAddress: '',
    // Step 3
    degreeDocument: null as File | null,
    introVideo: null as File | null
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState({ degree: 0, video: 0 });

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
    const element = document.querySelector('.step-content');
    if (element) {
      element.classList.remove('opacity-0');
      element.classList.add('animate-fade-in');
    }
  }, [currentStep]);

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1) {
      if (!formData.fullName) newErrors.fullName = 'Full name is required';
      if (!formData.email) newErrors.email = 'Email is required';
      if (!formData.phone) newErrors.phone = 'Phone is required';
      if (!formData.cnic) newErrors.cnic = 'CNIC is required';
      if (!formData.city) newErrors.city = 'City is required';
      if (!formData.password || formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (step === 2) {
      if (!formData.barCouncilNumber) newErrors.barCouncilNumber = 'Bar Council Number is required';
      if (!formData.degreeTitle) newErrors.degreeTitle = 'Degree title is required';
      if (!formData.university) newErrors.university = 'University is required';
      if (!formData.yearOfCompletion) newErrors.yearOfCompletion = 'Year of completion is required';
      if (!formData.chamberAddress) newErrors.chamberAddress = 'Chamber address is required';
    }
    
    if (step === 3) {
      if (!formData.degreeDocument) newErrors.degreeDocument = 'Degree document is required';
      if (!formData.introVideo) newErrors.introVideo = 'Intro video is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'degree' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ 
        ...prev, 
        [type === 'degree' ? 'degreeDocument' : 'introVideo']: file 
      }));
      
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(prev => ({ ...prev, [type]: progress }));
        if (progress >= 100) {
          clearInterval(interval);
        }
      }, 100);
    }
  };

  const handleSubmit = () => {
    // Create application entry for admin review
    const application = {
      id: Date.now().toString(),
      name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      city: formData.city,
      barCouncilNumber: formData.barCouncilNumber,
      degreeTitle: formData.degreeTitle,
      university: formData.university,
      yearOfCompletion: formData.yearOfCompletion,
      chamberAddress: formData.chamberAddress,
      degreeDocument: formData.degreeDocument?.name || 'degree_document.pdf',
      introVideo: formData.introVideo?.name || 'intro_video.mp4',
      submittedAt: new Date().toISOString(),
      status: 'pending' as const,
    };
    try {
      const existing = localStorage.getItem('lawyer_applications');
      const apps = existing ? JSON.parse(existing) : [];
      apps.unshift(application);
      localStorage.setItem('lawyer_applications', JSON.stringify(apps));
    } catch {}

    const userData = {
      id: application.id,
      name: formData.fullName,
      email: formData.email,
      role: 'lawyer' as const,
      status: 'pending' as const,
    };
    
    const element = document.querySelector('.step-content');
    if (element) {
      element.classList.add('animate-scale-in');
      setTimeout(() => {
        navigate('/verify-otp', { 
          state: { 
            email: formData.email, 
            userType: 'lawyer',
            userData: userData
          } 
        });
      }, 600);
    }
  };

  const renderStep1 = () => (
    <div className="step-content space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Personal Information</h2>
        <p className="text-muted-foreground">Let's start with your basic details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleInputChange}
            className={errors.fullName ? 'border-destructive' : ''}
            placeholder="Enter your full name"
          />
          {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            className={errors.email ? 'border-destructive' : ''}
            placeholder="Enter your email"
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className={errors.phone ? 'border-destructive' : ''}
            placeholder="03XX-XXXXXXX"
          />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cnic">CNIC</Label>
          <Input
            id="cnic"
            name="cnic"
            value={formData.cnic}
            onChange={handleInputChange}
            className={errors.cnic ? 'border-destructive' : ''}
            placeholder="XXXXX-XXXXXXX-X"
          />
          {errors.cnic && <p className="text-sm text-destructive">{errors.cnic}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            className={errors.city ? 'border-destructive' : ''}
            placeholder="Enter your city"
          />
          {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            className={errors.password ? 'border-destructive' : ''}
            placeholder="Create a password"
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Verification Information</h2>
        <p className="text-muted-foreground">Professional credentials and qualifications</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="barCouncilNumber">Bar Council Number</Label>
          <Input
            id="barCouncilNumber"
            name="barCouncilNumber"
            value={formData.barCouncilNumber}
            onChange={handleInputChange}
            className={errors.barCouncilNumber ? 'border-destructive' : ''}
            placeholder="Enter your Bar Council registration number"
          />
          {errors.barCouncilNumber && <p className="text-sm text-destructive">{errors.barCouncilNumber}</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <div className="space-y-2">
            <Label htmlFor="degreeTitle">Degree Title</Label>
            <Input
              id="degreeTitle"
              name="degreeTitle"
              value={formData.degreeTitle}
              onChange={handleInputChange}
              className={errors.degreeTitle ? 'border-destructive' : ''}
              placeholder="e.g., LLB, LLM"
            />
            {errors.degreeTitle && <p className="text-sm text-destructive">{errors.degreeTitle}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="yearOfCompletion">Year of Completion</Label>
            <Input
              id="yearOfCompletion"
              name="yearOfCompletion"
              type="number"
              value={formData.yearOfCompletion}
              onChange={handleInputChange}
              className={errors.yearOfCompletion ? 'border-destructive' : ''}
              placeholder="2020"
              min="1990"
              max="2024"
            />
            {errors.yearOfCompletion && <p className="text-sm text-destructive">{errors.yearOfCompletion}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="university">University</Label>
          <Input
            id="university"
            name="university"
            value={formData.university}
            onChange={handleInputChange}
            className={errors.university ? 'border-destructive' : ''}
            placeholder="Enter your university name"
          />
          {errors.university && <p className="text-sm text-destructive">{errors.university}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="chamberAddress">Chamber/Office Address</Label>
          <Textarea
            id="chamberAddress"
            name="chamberAddress"
            value={formData.chamberAddress}
            onChange={handleInputChange}
            className={errors.chamberAddress ? 'border-destructive' : ''}
            placeholder="Enter your complete chamber or office address"
            rows={3}
          />
          {errors.chamberAddress && <p className="text-sm text-destructive">{errors.chamberAddress}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">Document Upload</h2>
        <p className="text-muted-foreground">Upload your degree document and introduction video</p>
      </div>

      <div className="space-y-8">
        {/* Degree Document Upload */}
        <div className="space-y-4">
          <Label>Degree Document (PDF/JPEG)</Label>
          <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            formData.degreeDocument ? 'border-green-500 bg-green-50' : 'border-muted-foreground hover:border-primary'
          }`}>
            {formData.degreeDocument ? (
              <div className="space-y-4">
                <Check className="w-12 h-12 text-green-500 mx-auto" />
                <p className="text-green-700 font-medium">{formData.degreeDocument.name}</p>
                <Progress value={uploadProgress.degree} className="w-full" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, degreeDocument: null }))}
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="text-foreground font-medium">Click to upload or drag and drop</p>
                  <p className="text-sm text-muted-foreground">PDF or JPEG (Max 10MB)</p>
                </div>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg"
                  onChange={(e) => handleFileUpload(e, 'degree')}
                  className="hidden"
                  id="degree-upload"
                />
                <label htmlFor="degree-upload">
                  <Button variant="outline" asChild>
                    <span>Choose File</span>
                  </Button>
                </label>
              </div>
            )}
          </div>
          {errors.degreeDocument && <p className="text-sm text-destructive">{errors.degreeDocument}</p>}
        </div>

        {/* Video Upload */}
        <div className="space-y-4">
          <Label>Introduction Video (MP4, ≤2 minutes)</Label>
          <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            formData.introVideo ? 'border-green-500 bg-green-50' : 'border-muted-foreground hover:border-primary'
          }`}>
            {formData.introVideo ? (
              <div className="space-y-4">
                <Check className="w-12 h-12 text-green-500 mx-auto" />
                <p className="text-green-700 font-medium">{formData.introVideo.name}</p>
                <Progress value={uploadProgress.video} className="w-full" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData(prev => ({ ...prev, introVideo: null }))}
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                <div>
                  <p className="text-foreground font-medium">Click to upload or drag and drop</p>
                  <p className="text-sm text-muted-foreground">MP4 video (Max 50MB, ≤2 minutes)</p>
                </div>
                <input
                  type="file"
                  accept=".mp4"
                  onChange={(e) => handleFileUpload(e, 'video')}
                  className="hidden"
                  id="video-upload"
                />
                <label htmlFor="video-upload">
                  <Button variant="outline" asChild>
                    <span>Choose File</span>
                  </Button>
                </label>
              </div>
            )}
          </div>
          {errors.introVideo && <p className="text-sm text-destructive">{errors.introVideo}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/auth/role')}
          className="mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Role Selection
        </Button>

        <div className="max-w-2xl mx-auto">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Step {currentStep} of {totalSteps}</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>

            {/* Step Content */}
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <Button onClick={handleNext}>
                {currentStep === totalSteps ? 'Complete Registration' : 'Next'}
                {currentStep < totalSteps && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </div>

          <div className="text-center mt-6 text-xs text-muted-foreground">
            🔒 Your profile will be reviewed and verified by our team
          </div>
        </div>
      </div>
    </div>
  );
};

export default LawyerSignupPage;
