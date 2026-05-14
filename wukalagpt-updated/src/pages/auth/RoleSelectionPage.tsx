import { useNavigate } from 'react-router-dom';
import { Users, Scale } from 'lucide-react';
import logo from '@/assets/Wukala-GPT-Logo-Green.jpg';
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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/25 to-background relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.06),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(16,185,129,0.08),transparent_48%),radial-gradient(circle_at_50%_80%,rgba(59,130,246,0.06),transparent_52%)]" aria-hidden />
      <div className="absolute top-6 left-4 sm:left-6 z-20">
        <button
          onClick={() => navigate('/')}
          className="group inline-flex items-center gap-3 rounded-full border border-amber-200/60 bg-background/70 px-3.5 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.18)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(251,191,36,0.25)]"
          aria-label="Back to home"
        >
          <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-amber-400/80 via-primary/80 to-emerald-400/70 flex items-center justify-center shadow-[0_0_0_6px_rgba(251,191,36,0.2)] overflow-hidden">
            <div className="absolute inset-0 rounded-full blur-md bg-amber-300/50 opacity-60 group-hover:opacity-100 transition-opacity" aria-hidden />
            <img src={logo} alt="Wukala-GPT logo" className="relative h-9 w-9 object-cover rounded-full" />
          </div>
          <div className="text-left">
            <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Return</p>
            <p className="text-sm font-semibold text-foreground">Home</p>
          </div>
        </button>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-24 left-16 text-5xl">⚖️</div>
        <div className="absolute top-36 right-24 text-4xl">📚</div>
        <div className="absolute bottom-28 left-32 text-5xl">🏛️</div>
        <div className="absolute bottom-16 right-16 text-4xl">⚖️</div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="text-center mb-16 space-y-4">
          <h1 className="hero-title text-4xl md:text-5xl font-bold text-foreground mb-2 opacity-0">
            Choose Your Role
          </h1>
          <p className="hero-title text-lg text-muted-foreground max-w-2xl mx-auto opacity-0">
            Join Pakistan's premier legal platform—tailored journeys whether you need trusted counsel or you provide it.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {/* Client Card */}
          <div
            className="role-card group cursor-pointer"
            onClick={() => handleCardClick('client')}
          >
            <div className="bg-card border border-amber-200/60 rounded-2xl p-8 h-full shadow-[0_18px_60px_rgba(0,0,0,0.18)] hover:shadow-[0_22px_70px_rgba(0,0,0,0.22),0_0_32px_rgba(251,191,36,0.18)] transition-all duration-400 relative overflow-hidden ring-1 ring-amber-300/35">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-amber-300/10 opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-3xl" aria-hidden />
              <div className="absolute -left-12 -bottom-12 h-28 w-28 rounded-full bg-amber-300/20 blur-3xl" aria-hidden />
              
              <div className="relative z-10 text-center">
                <div className="relative w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-400/80 via-primary/80 to-emerald-400/70 flex items-center justify-center shadow-[0_0_0_6px_rgba(251,191,36,0.22)]">
                  <div className="absolute inset-0 blur-xl bg-amber-300/50 opacity-70" aria-hidden />
                  <Users className="relative w-10 h-10 text-primary-foreground drop-shadow" />
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
            <div className="bg-card border border-amber-200/60 rounded-2xl p-8 h-full shadow-[0_18px_60px_rgba(0,0,0,0.18)] hover:shadow-[0_22px_70px_rgba(0,0,0,0.22),0_0_32px_rgba(251,191,36,0.18)] transition-all duration-400 relative overflow-hidden ring-1 ring-amber-300/35">
              <div className="absolute inset-0 bg-gradient-to-br from-gold/8 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber-300/18 blur-3xl" aria-hidden />
              <div className="absolute -left-12 -bottom-12 h-28 w-28 rounded-full bg-primary/12 blur-3xl" aria-hidden />
              
              <div className="relative z-10 text-center">
                <div className="relative w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-400/80 via-primary/80 to-emerald-400/70 flex items-center justify-center shadow-[0_0_0_6px_rgba(251,191,36,0.22)]">
                  <div className="absolute inset-0 blur-xl bg-amber-300/50 opacity-70" aria-hidden />
                  <Scale className="relative w-10 h-10 text-primary-foreground drop-shadow" />
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

        <div className="text-center mt-12 space-y-3">
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