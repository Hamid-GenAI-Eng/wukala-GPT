import React, { useState, useEffect } from 'react';
import { X, ArrowRight, ArrowLeft, MessageSquare, Users, FileText, Scale, Brain, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}

interface OnboardingTourProps {
  onComplete: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: "AI Legal Assistant",
      description: "Get instant legal advice powered by advanced AI. Ask questions, analyze documents, and receive professional guidance 24/7.",
      icon: <Brain className="w-8 h-8" />,
      gradient: "from-blue-500 to-purple-600"
    },
    {
      id: 2,
      title: "Expert Lawyers Network",
      description: "Connect with verified legal professionals. Browse profiles, read reviews, and find the perfect lawyer for your case.",
      icon: <Users className="w-8 h-8" />,
      gradient: "from-green-500 to-teal-600"
    },
    {
      id: 3,
      title: "Legal Documents Library",
      description: "Access comprehensive legal documents, templates, and case studies. Download, customize, and use professional legal forms.",
      icon: <FileText className="w-8 h-8" />,
      gradient: "from-orange-500 to-red-600"
    },
    {
      id: 4,
      title: "Legal Dictionary",
      description: "Understand complex legal terms with our comprehensive dictionary. Clear explanations in simple language for everyone.",
      icon: <Scale className="w-8 h-8" />,
      gradient: "from-purple-500 to-pink-600"
    },
    {
      id: 5,
      title: "Secure & Confidential",
      description: "Your privacy is our priority. All conversations and documents are encrypted and protected with enterprise-grade security.",
      icon: <Shield className="w-8 h-8" />,
      gradient: "from-cyan-500 to-blue-600"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`transform transition-all duration-300 ${isVisible ? 'animate-scale-in' : 'animate-scale-out'}`}>
        <Card className="relative max-w-lg w-full bg-card border border-border shadow-2xl">
          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/50"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Progress indicator */}
          <div className="p-6 pb-2">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
              </span>
              <button
                onClick={handleSkip}
                className="text-sm text-primary hover:underline"
              >
                Skip Tour
              </button>
            </div>
            <div className="flex space-x-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full flex-1 transition-all duration-300 ${
                    index <= currentStep 
                      ? 'bg-gradient-to-r from-primary to-primary/80' 
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 pt-2">
            <div className="text-center mb-6">
              <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${currentStepData.gradient} flex items-center justify-center text-white shadow-lg`}>
                {currentStepData.icon}
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">
                {currentStepData.title}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {currentStepData.description}
              </p>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="flex gap-2">
                {steps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentStep 
                        ? 'bg-primary scale-125' 
                        : 'bg-muted hover:bg-muted-foreground/50'
                    }`}
                  />
                ))}
              </div>

              <Button
                onClick={handleNext}
                className="flex items-center gap-2"
              >
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingTour;