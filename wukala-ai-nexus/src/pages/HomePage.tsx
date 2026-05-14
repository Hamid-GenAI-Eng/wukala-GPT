
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Shield, Users, Clock, Sparkles, Scale, ArrowRight, Award, Globe, Zap, ChevronRight, ChevronLeft, Quote, Star } from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const testimonials = [
  {
    id: 1,
    name: "Ahmed Raza Malik",
    role: "Corporate Client",
    company: "Tech Innovations Pvt Ltd",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    quote: "Wukala-GPT transformed how we handle legal matters. Finding the right corporate lawyer took minutes instead of weeks. The AI assistant helped us understand complex contracts before our consultation.",
    rating: 5
  },
  {
    id: 2,
    name: "Advocate Fatima Hassan",
    role: "Senior Lawyer",
    company: "Hassan & Associates",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    quote: "As a lawyer, this platform has revolutionized my practice. Client management is seamless, and the verification process gives clients confidence. My caseload has increased by 40% since joining.",
    rating: 5
  },
  {
    id: 3,
    name: "Imran Qureshi",
    role: "Business Owner",
    company: "Qureshi Exports",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    quote: "The 24/7 AI support is incredible. I got preliminary legal guidance at midnight before an important deal. The platform connected me with an international trade expert within hours.",
    rating: 5
  },
  {
    id: 4,
    name: "Advocate Sana Mirza",
    role: "Family Law Specialist",
    company: "Mirza Legal Consultants",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    quote: "Wukala-GPT understands the sensitivity of family law cases. The platform's secure messaging and document handling give my clients the privacy they deserve. Truly a game-changer.",
    rating: 5
  }
];

const HomePage = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Stop video when component unmounts (navigating away)
  useEffect(() => {
    const video = videoRef.current;
    
    return () => {
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    };
  }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section with Video Background */}
      <section className="relative min-h-screen flex items-center justify-center">
        {/* Video Background */}
        <div className="absolute inset-0">
          <video
            ref={videoRef}
            autoPlay
            loop
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/videos/hero-video.mp4" type="video/mp4" />
          </video>
          {/* Gradient Overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <motion.div 
              className="text-left"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              {/* Badge */}
              <motion.div 
                variants={fadeIn}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
              >
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span className="text-sm font-medium text-primary">Pakistan's #1 Legal AI Platform</span>
              </motion.div>

              {/* Main Heading */}
              <motion.h1 
                variants={fadeInUp}
                className="text-4xl sm:text-5xl lg:text-7xl font-bold text-foreground mb-6 leading-[1.1] font-serif"
              >
                Redefining
                <span className="block text-gradient-gold mt-2">Legal Excellence</span>
                <span className="block text-2xl sm:text-3xl lg:text-4xl font-sans font-light text-muted-foreground mt-4">
                  with Artificial Intelligence
                </span>
              </motion.h1>

              {/* Description */}
              <motion.p 
                variants={fadeInUp}
                className="text-lg lg:text-xl text-foreground/80 mb-10 leading-relaxed max-w-xl"
              >
                Experience the future of law. Connect with verified attorneys, access intelligent legal guidance, 
                and transform how Pakistan does justice.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div 
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Button 
                  asChild 
                  size="lg" 
                  className="btn-gold text-lg px-8 py-7 font-semibold group"
                >
                  <Link to="/auth/role">
                    Get Started Free
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  size="lg"
                  className="text-lg px-8 py-7 border-2 border-foreground/20 bg-background/50 backdrop-blur-sm hover:bg-foreground/5 font-semibold"
                >
                  <Link to="/login">
                    Sign In
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </Link>
                </Button>
              </motion.div>

              {/* Stats Row */}
              <motion.div 
                variants={fadeInUp}
                className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-border/50"
              >
                <div>
                  <div className="text-3xl lg:text-4xl font-bold text-foreground">5000+</div>
                  <div className="text-sm text-muted-foreground">Verified Lawyers</div>
                </div>
                <div>
                  <div className="text-3xl lg:text-4xl font-bold text-foreground">50K+</div>
                  <div className="text-sm text-muted-foreground">Cases Resolved</div>
                </div>
                <div>
                  <div className="text-3xl lg:text-4xl font-bold text-foreground">98%</div>
                  <div className="text-sm text-muted-foreground">Client Satisfaction</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce"
        >
          <div className="w-6 h-10 rounded-full border-2 border-foreground/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-foreground/50 rounded-full animate-pulse" />
          </div>
        </motion.div>
      </section>

      {/* Trust Badges Section */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeIn}
        className="py-8 bg-muted/30 border-y border-border/50"
      >
        <div className="container mx-auto px-4">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-wrap items-center justify-center gap-8 lg:gap-16 text-muted-foreground"
          >
            <motion.div variants={fadeInUp} className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Bar Council Verified</span>
            </motion.div>
            <motion.div variants={fadeInUp} className="flex items-center gap-2">
              <Award className="w-5 h-5 text-gold" />
              <span className="text-sm font-medium">Award Winning Platform</span>
            </motion.div>
            <motion.div variants={fadeInUp} className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">Nationwide Coverage</span>
            </motion.div>
            <motion.div variants={fadeInUp} className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-gold" />
              <span className="text-sm font-medium">AI-Powered</span>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="text-center mb-16 lg:mb-20"
            >
              <motion.div 
                variants={fadeInUp}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-6"
              >
                <Sparkles className="w-4 h-4 text-gold" />
                <span className="text-sm font-medium text-gold">Premium Features</span>
              </motion.div>
              <motion.h2 
                variants={fadeInUp}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 font-serif"
              >
                Why Industry Leaders
                <span className="block text-gradient-primary mt-2">Choose Wukala-GPT</span>
              </motion.h2>
              <motion.p 
                variants={fadeInUp}
                className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto"
              >
                Built for the future of Pakistani legal practice, combining cutting-edge AI 
                with the highest standards of professional excellence.
              </motion.p>
            </motion.div>

            {/* Feature Cards */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <motion.div 
                variants={fadeInUp}
                className="group relative bg-card p-8 lg:p-10 rounded-3xl border border-border hover:border-primary/50 transition-all duration-500 hover:shadow-premium"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-8 group-hover:scale-110 transition-transform duration-500">
                    <Shield className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-semibold text-foreground mb-4 font-serif">Bank-Grade Security</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Every lawyer undergoes rigorous Bar Council verification. Your confidential 
                    information is protected with enterprise-level encryption.
                  </p>
                </div>
              </motion.div>

              <motion.div 
                variants={fadeInUp}
                className="group relative bg-card p-8 lg:p-10 rounded-3xl border border-border hover:border-gold/50 transition-all duration-500 hover:shadow-gold"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-gold rounded-2xl mb-8 group-hover:scale-110 transition-transform duration-500">
                    <Users className="w-8 h-8 text-gold-foreground" />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-semibold text-foreground mb-4 font-serif">Elite Legal Network</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Access Pakistan's most prestigious network of attorneys spanning 
                    every specialization, from corporate law to human rights.
                  </p>
                </div>
              </motion.div>

              <motion.div 
                variants={fadeInUp}
                className="group relative bg-card p-8 lg:p-10 rounded-3xl border border-border hover:border-primary/50 transition-all duration-500 hover:shadow-premium"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-8 group-hover:scale-110 transition-transform duration-500">
                    <Clock className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl lg:text-2xl font-semibold text-foreground mb-4 font-serif">Instant AI Counsel</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Get immediate legal insights powered by advanced AI, available 24/7 
                    for preliminary guidance and document analysis.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="text-center mb-16"
            >
              <motion.div 
                variants={fadeInUp}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
              >
                <Quote className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Client Testimonials</span>
              </motion.div>
              <motion.h2 
                variants={fadeInUp}
                className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 font-serif"
              >
                Trusted by Thousands
                <span className="block text-gradient-gold mt-2">Across Pakistan</span>
              </motion.h2>
            </motion.div>

            {/* Testimonial Carousel */}
            <div className="relative">
              <div className="overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentTestimonial}
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="bg-card rounded-3xl p-8 lg:p-12 border border-border shadow-premium"
                  >
                    <div className="flex flex-col lg:flex-row gap-8 items-center">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <div className="relative">
                          <div className="absolute -inset-2 bg-gradient-to-r from-primary via-gold to-primary rounded-full blur-lg opacity-30" />
                          <img 
                            src={testimonials[currentTestimonial].image} 
                            alt={testimonials[currentTestimonial].name}
                            className="relative w-24 h-24 lg:w-32 lg:h-32 rounded-full object-cover border-4 border-background shadow-lg"
                          />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 text-center lg:text-left">
                        {/* Stars */}
                        <div className="flex justify-center lg:justify-start gap-1 mb-4">
                          {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                            <Star key={i} className="w-5 h-5 fill-gold text-gold" />
                          ))}
                        </div>

                        {/* Quote */}
                        <blockquote className="text-lg lg:text-xl text-foreground/90 mb-6 leading-relaxed italic">
                          "{testimonials[currentTestimonial].quote}"
                        </blockquote>

                        {/* Author */}
                        <div>
                          <div className="text-xl font-semibold text-foreground font-serif">
                            {testimonials[currentTestimonial].name}
                          </div>
                          <div className="text-muted-foreground">
                            {testimonials[currentTestimonial].role} • {testimonials[currentTestimonial].company}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  onClick={prevTestimonial}
                  className="p-3 rounded-full bg-card border border-border hover:bg-muted transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-foreground" />
                </button>

                {/* Dots */}
                <div className="flex gap-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentTestimonial(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentTestimonial 
                          ? 'w-8 bg-primary' 
                          : 'bg-border hover:bg-muted-foreground'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={nextTestimonial}
                  className="p-3 rounded-full bg-card border border-border hover:bg-muted transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-foreground" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium CTA Section */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={fadeIn}
        className="relative py-24 lg:py-32 overflow-hidden"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary-muted" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, hsl(var(--gold)) 0%, transparent 50%), radial-gradient(circle at 80% 50%, hsl(var(--gold)) 0%, transparent 50%)'
          }} />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div 
              variants={fadeInUp}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 mb-8"
            >
              <Scale className="w-4 h-4 text-primary-foreground" />
              <span className="text-sm font-medium text-primary-foreground">Join the Revolution</span>
            </motion.div>
            
            <motion.h2 
              variants={fadeInUp}
              className="text-3xl sm:text-4xl lg:text-6xl font-bold text-primary-foreground mb-8 font-serif leading-tight"
            >
              Ready to Experience
              <span className="block text-gradient-gold mt-2">The Future of Law?</span>
            </motion.h2>
            
            <motion.p 
              variants={fadeInUp}
              className="text-lg lg:text-xl text-primary-foreground/80 mb-12 max-w-2xl mx-auto"
            >
              Join thousands of forward-thinking legal professionals and clients 
              who are already transforming their practice with Wukala-GPT.
            </motion.p>
            
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button 
                asChild 
                size="lg" 
                className="btn-gold text-lg px-10 py-7 font-semibold group"
              >
                <Link to="/auth/role">
                  Start Your Journey
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                size="lg"
                className="text-lg px-10 py-7 border-2 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 font-semibold"
              >
                <Link to="/about">Learn More</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer Stats */}
      <motion.section 
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        variants={staggerContainer}
        className="py-16 bg-muted/30 border-t border-border/50"
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <motion.div variants={fadeInUp}>
              <div className="text-4xl lg:text-5xl font-bold text-gradient-primary mb-2">5000+</div>
              <div className="text-muted-foreground">Verified Attorneys</div>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <div className="text-4xl lg:text-5xl font-bold text-gradient-gold mb-2">50K+</div>
              <div className="text-muted-foreground">Cases Handled</div>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <div className="text-4xl lg:text-5xl font-bold text-gradient-primary mb-2">100+</div>
              <div className="text-muted-foreground">Cities Covered</div>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <div className="text-4xl lg:text-5xl font-bold text-gradient-gold mb-2">24/7</div>
              <div className="text-muted-foreground">AI Support</div>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default HomePage;
