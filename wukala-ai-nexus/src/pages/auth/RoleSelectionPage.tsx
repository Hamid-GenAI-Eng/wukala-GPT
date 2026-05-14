import { useNavigate } from 'react-router-dom';
import { Users, Scale } from 'lucide-react';
import { useEffect } from 'react';

const RoleSelectionPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      const elements = document.querySelectorAll('.hero-title, .role-card');
      elements.forEach((el, index) => {
        setTimeout(() => {
          el.classList.remove('opacity-0');
          el.classList.add('animate-fade-in');
        }, index * 200);
      });
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const handleCardClick = (role: 'client' | 'lawyer') => {
    navigate(`/signup/${role}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 text-6xl">⚖️</div>
        <div className="absolute top-40 right-32 text-4xl">📚</div>
        <div className="absolute bottom-32 left-40 text-5xl">🏛️</div>
        <div className="absolute bottom-20 right-20 text-4xl">⚖️</div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-16">
          <h1 className="hero-title text-4xl md:text-5xl font-bold text-foreground mb-4 opacity-0">
            Choose Your Role
          </h1>
          <p className="hero-title text-lg text-muted-foreground max-w-2xl mx-auto opacity-0">
            Join Pakistan's premier legal platform. Whether you're seeking legal assistance or providing professional services.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Client Card */}
          <div
            className="role-card group cursor-pointer"
            onClick={() => handleCardClick('client')}
          >
            <div className="bg-card border border-border rounded-2xl p-8 h-full shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="w-10 h-10 text-primary-foreground" />
                </div>
                
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Sign up as Client
                </h3>
                
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Get access to qualified lawyers, legal consultations, and expert guidance for your legal matters across Pakistan.
                </p>
                
                <div className="inline-flex items-center text-primary font-medium group-hover:translate-x-2 transition-transform duration-300">
                  Get Started →
                </div>
              </div>
            </div>
          </div>

          {/* Lawyer Card */}
          <div
            className="role-card group cursor-pointer"
            onClick={() => handleCardClick('lawyer')}
          >
            <div className="bg-card border border-border rounded-2xl p-8 h-full shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10 text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gold to-gold/80 rounded-2xl flex items-center justify-center shadow-lg">
                  <Scale className="w-10 h-10 text-gold-foreground" />
                </div>
                
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Sign up as Lawyer
                </h3>
                
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Join our verified network of legal professionals. Connect with clients and grow your practice with our platform.
                </p>
                
                <div className="inline-flex items-center text-gold font-medium group-hover:translate-x-2 transition-transform duration-300">
                  Join as Professional →
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-primary hover:underline font-medium"
            >
              Sign in here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionPage;