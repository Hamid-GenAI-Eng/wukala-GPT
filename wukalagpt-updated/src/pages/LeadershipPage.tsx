import { Linkedin, Mail, Award, Users, Lightbulb, Target, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import hamidImage from '@/assets/hamid-saifullah.jpg';
import ahmedImage from '@/assets/hammad.jpg';
import maheenImage from '@/assets/maheen-hamid.jpg';
const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.15
    }
  }
};

const LeadershipPage = () => {
  const leaders = [
    {
      name: "Maheen Hamid",
      position: "Project Lead, Frontend & System Designer",
      badge: "System Designer",
      image: maheenImage,
      bio: "Led the overall planning, system design, and frontend development of Wukala-GPT. Played a central role in defining system flow, user experience, and feature integration. Also contributed to data extraction and ensured alignment between AI outputs and user requirements.",
      contributions: [
        "Project Leadership & System Planning",
        "Frontend Development (React)",
        "UI/UX & Complete System Flow Design",
        "Feature Integration & Coordination",
        "Data Extraction & Output Structuring"
      ]
    },
    {
      name: "Hamid Saifullah",
      position: "Backend & AI Engineer",
      badge: "AI Engineer",
      image: hamidImage,
      bio: "Handled backend development and complex AI-related tasks. Responsible for implementing APIs, database management, and solving technical challenges related to AI chatbot, document processing, and system performance.",
      contributions: [
        "Backend Development (ASP.NET Core)",
        "AI Chatbot & RAG Implementation",
        "Database Design (PostgreSQL)",
        "Handling Technical & AI Logic"
      ]
    },
    {
      name: "Ameer Hammad",
      position: "Data Extraction & Support",
      badge: "Data Specialist",
      image: ahmedImage,
      bio: "Contributed to data extraction, requirement understanding, and documentation support. Assisted in organizing extracted information and supporting system testing and coordination tasks.",
      contributions: [
        "Data Extraction Support",
        "Requirement Understanding",
        "Documentation Assistance",
        "Testing & Coordination"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden relative">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.06),transparent_45%),radial-gradient(circle_at_80%_15%,rgba(59,130,246,0.06),transparent_46%),radial-gradient(circle_at_50%_80%,rgba(16,185,129,0.06),transparent_52%)]" aria-hidden />
      {/* Hero Section */}
      <section className="relative py-16 sm:py-20 md:py-24 lg:py-32 bg-gradient-to-br from-primary/6 via-background to-gold/6 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-gold/8 rounded-full blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />
          <div className="absolute -left-24 top-16 h-56 w-56 rounded-full bg-amber-300/12 blur-3xl" />
          <div className="absolute -right-28 bottom-10 h-64 w-64 rounded-full bg-primary/12 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm font-medium mb-6 sm:mb-8">
              <Users className="w-4 h-4" />
              Meet Our Visionaries
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground mb-4 sm:mb-6 font-serif leading-tight">
              The Minds Behind
              <span className="block text-gradient-primary mt-2">Pakistan's Legal Revolution</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto px-4">
              Pioneering the future of legal technology with innovation, integrity, and an unwavering commitment to justice
            </p>
          </motion.div>
        </div>
      </section>

      {/* Leadership Team */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-28">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              className="space-y-16 sm:space-y-20 md:space-y-24 lg:space-y-32"
              variants={staggerContainer}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: "-100px" }}
            >
              {leaders.map((leader, index) => (
                <motion.div 
                  key={leader.name} 
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 lg:gap-16 items-center ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''}`}
                  variants={fadeInUp}
                >
                  {/* Image */}
                  <div className={`${index % 2 === 1 ? 'lg:col-start-2' : ''}`}>
                      <div className="relative group">
                      {/* Decorative background */}
                      <div className="absolute -inset-4 sm:-inset-6 bg-gradient-to-br from-primary/22 to-gold/18 rounded-3xl blur-2xl opacity-60 group-hover:opacity-85 transition-opacity duration-500" />
                      
                      <div className="relative aspect-[4/5] sm:aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-muted shadow-2xl ring-1 ring-amber-300/35">
                        <img 
                          src={leader.image} 
                          alt={leader.name}
                          className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                        />
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </div>
                      
                      {/* Floating badge */}
                      <div className="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 md:-bottom-6 md:-right-6 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-primary to-primary/80 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-[0_16px_50px_rgba(0,0,0,0.25),0_0_28px_rgba(251,191,36,0.22)] transform rotate-3 group-hover:rotate-6 transition-transform duration-300">
                        <Award className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-primary-foreground" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`${index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''} space-y-4 sm:space-y-6`}>
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs font-medium mb-3 sm:mb-4">
                        <Target className="w-3 h-3" />
                        {leader.badge ?? leader.position.split(' ').pop()}
                      </div>
                      <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-2 sm:mb-3 font-serif">
                        {leader.name}
                      </h2>
                      <p className="text-lg sm:text-xl md:text-2xl text-primary font-semibold">
                        {leader.position}
                      </p>
                    </div>

                    <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed">
                      {leader.bio}
                    </p>

                    {/* Achievements */}
                    <div className="bg-muted/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-amber-200/50 ring-1 ring-amber-300/35 shadow-[0_12px_40px_rgba(0,0,0,0.16)]">
                      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-lg flex items-center justify-center mr-3">
                          <Award className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        </div>
                        Key Expertise
                      </h3>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        {leader.contributions.map((achievement, achievementIndex) => (
                          <li key={achievementIndex} className="flex items-center text-sm sm:text-base">
                            <div className="w-2 h-2 bg-gradient-to-r from-primary to-gold rounded-full mr-3 flex-shrink-0" />
                            <span className="text-muted-foreground">{achievement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Contact */}
                    <div className="flex flex-wrap gap-3 sm:gap-4 pt-2">
                      <Button 
                        variant="outline" 
                        className="flex items-center gap-2 rounded-full border-amber-200/70 bg-background/80 backdrop-blur px-4 sm:px-6 shadow-[0_10px_30px_rgba(0,0,0,0.14)] hover:-translate-y-0.5 hover:shadow-[0_16px_42px_rgba(251,191,36,0.2)] transition-all duration-300 text-sm sm:text-base"
                      >
                        <Linkedin className="w-4 h-4" />
                        LinkedIn
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex items-center gap-2 rounded-full border-amber-200/70 bg-background/80 backdrop-blur px-4 sm:px-6 shadow-[0_10px_30px_rgba(0,0,0,0.14)] hover:-translate-y-0.5 hover:shadow-[0_16px_42px_rgba(251,191,36,0.2)] transition-all duration-300 text-sm sm:text-base"
                      >
                        <Mail className="w-4 h-4" />
                        Contact
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Leadership Philosophy */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-28 bg-gradient-to-b from-muted/30 via-muted/50 to-muted/30 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="max-w-5xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold text-xs sm:text-sm font-medium mb-6 sm:mb-8">
              <Heart className="w-4 h-4" />
              Our Philosophy
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 sm:mb-6 font-serif">
              Driven by Purpose,
              <span className="text-gradient-gold block mt-1 sm:mt-2">Guided by Values</span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 sm:mb-12 md:mb-16 max-w-3xl mx-auto px-4">
              We believe in leading by example, fostering innovation, and maintaining 
              the highest ethical standards in everything we do.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {[
                {
                  icon: Users,
                  title: "People First",
                  description: "Our team and clients are at the heart of every decision we make"
                },
                {
                  icon: Award,
                  title: "Excellence",
                  description: "We strive for excellence in technology, service, and legal accuracy"
                },
                {
                  icon: Lightbulb,
                  title: "Innovation",
                  description: "Continuously pushing boundaries to serve our community better"
                }
              ].map((item, index) => (
                <motion.div 
                  key={item.title}
                  className="group relative bg-card p-6 sm:p-8 rounded-xl sm:rounded-2xl shadow-lg border border-border/50 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-gold/5 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-primary to-primary/80 rounded-xl sm:rounded-2xl mx-auto mb-4 sm:mb-6 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <item.icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2 sm:mb-3">{item.title}</h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="max-w-4xl mx-auto text-center bg-gradient-to-br from-primary/10 via-background to-gold/10 rounded-2xl sm:rounded-3xl p-8 sm:p-10 md:p-12 lg:p-16 border border-border/50 shadow-xl"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4 font-serif">
              Ready to Transform Your Legal Journey?
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
              Join thousands of users who trust Wukala-GPT for intelligent legal assistance
            </p>
            <Button 
              size="lg" 
              className="btn-gold text-sm sm:text-base md:text-lg px-6 sm:px-8 md:px-10 py-4 sm:py-5 md:py-6"
            >
              Get Started Today
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LeadershipPage;
