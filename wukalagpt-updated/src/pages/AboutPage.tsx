import { Scale, Target, Heart, Globe, Award, Users, ShieldCheck } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-background via-muted/20 to-background relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.08),transparent_50%)]" />
        <div className="pointer-events-none absolute -inset-16 opacity-70 blur-3xl" aria-hidden>
          <div className="absolute left-1/3 top-6 h-40 w-40 rounded-full bg-amber-400/20" />
          <div className="absolute right-10 top-10 h-44 w-44 rounded-full bg-emerald-400/20" />
          <div className="absolute left-12 bottom-6 h-36 w-36 rounded-full bg-primary/15" />
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" aria-hidden />
        <div className="container mx-auto px-4 relative">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h1 
              variants={fadeInUp}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6 font-serif leading-tight"
            >
              About Wukala-GPT
            </motion.h1>
            <motion.p 
              variants={fadeInUp}
              className="text-base sm:text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto"
            >
              Revolutionizing Pakistan's legal landscape through artificial intelligence 
              and human expertise
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Intro blurb */}
      <section className="py-10 sm:py-12 lg:py-14 relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(251,191,36,0.08),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(59,130,246,0.07),transparent_42%)]" aria-hidden />
        <div className="container mx-auto px-4 relative">
          <motion.div
            className="max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mb-3 font-serif"
            >
              What We Do
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed"
            >
              Wukala-GPT is an AI-powered legal support platform that helps users understand legal matters, analyze documents, discover verified lawyers, and communicate securely—all in one place. Through bilingual (Urdu & English) AI assistance and human legal expertise, we simplify complex legal processes for everyday users and professionals alike.
            </motion.p>
            <motion.p
              variants={fadeInUp}
              className="mt-4 text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed"
            >
              Wukala-GPT is an AI-powered legal support platform designed to simplify legal assistance for users across Pakistan. The platform enables individuals to understand legal matters through bilingual (Urdu & English) AI guidance, analyze legal documents, discover verified lawyers, and communicate securely—all within a single, structured ecosystem.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Who We Serve */}
      <section className="py-10 sm:py-12 lg:py-16 bg-muted/20 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(251,191,36,0.07),transparent_45%),radial-gradient(circle_at_90%_10%,rgba(52,211,153,0.08),transparent_42%)]" aria-hidden />
        <div className="container mx-auto px-4 relative">
          <motion.div
            className="max-w-6xl mx-auto grid lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-12 items-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg">
                Who We Serve
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground font-serif">Built for people and professionals</h3>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
                Wukala-GPT is built to support a wide range of users, including individuals seeking basic legal guidance, citizens unfamiliar with legal procedures, and legal professionals looking for structured digital tools. The platform serves both everyday users and practicing lawyers through clearly defined roles and secure workflows.
              </p>
            </motion.div>
              <motion.div
                variants={scaleIn}
                className="relative overflow-hidden rounded-2xl border border-amber-200/60 ring-1 ring-amber-300/40 bg-card shadow-[0_16px_50px_rgba(0,0,0,0.22),0_0_32px_rgba(251,191,36,0.22)] p-6 sm:p-8"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.08),transparent_45%),radial-gradient(circle_at_80%_0%,hsl(var(--primary)/0.08),transparent_35%)]" aria-hidden />
              <div className="relative grid gap-4 text-sm text-foreground">
                {[{
                  title: 'Individuals & Citizens',
                  desc: 'Get plain-language answers, bilingual guidance, and simple document insights before engaging a lawyer.'
                }, {
                  title: 'Active Matter Seekers',
                  desc: 'Coordinate with verified lawyers, share documents securely, and schedule appointments with confidence.'
                }, {
                  title: 'Lawyers & Legal Teams',
                  desc: 'Use structured dashboards, case management, and AI drafting to serve clients faster and more securely.'
                }].map((item, idx) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.08 + 0.1, duration: 0.5 }}
                    className="rounded-xl border border-border/60 bg-background/60 p-4 backdrop-blur"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{item.title}</span>
                      <span className="text-xs text-primary">0{idx + 1}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-12 sm:py-16 lg:py-24 relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_30%,rgba(251,191,36,0.07),transparent_46%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.06),transparent_42%)]" aria-hidden />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 items-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp}>
                <div className="flex items-center mb-4 sm:mb-6">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-primary mr-3 sm:mr-4 shadow-lg">
                    <Target className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                  </div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground font-serif">Our Mission</h2>
                </div>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed mb-4 sm:mb-6">
                  At Wukala-GPT, we believe that access to quality legal services should not be 
                  a privilege, but a fundamental right. Our mission is to democratize legal 
                  assistance in Pakistan by leveraging cutting-edge artificial intelligence 
                  to bridge the gap between clients and qualified legal professionals.
                </p>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
                  We are committed to creating a transparent, efficient, and trustworthy 
                  platform where every Pakistani can find the legal help they need, 
                  when they need it.
                </p>
                <motion.p
                  variants={fadeInUp}
                  className="mt-3 text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed"
                >
                  We are committed to creating a transparent, efficient, and trustworthy platform where every Pakistani can find the legal help they need, when they need it.
                </motion.p>
              </motion.div>
              
              <motion.div 
                variants={scaleIn}
                className="bg-card p-4 sm:p-6 lg:p-8 rounded-2xl shadow-[0_18px_60px_rgba(0,0,0,0.22),0_0_32px_rgba(251,191,36,0.18)] border border-amber-200/50 ring-1 ring-amber-300/40"
              >
                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  {[
                    { value: '10,000+', label: 'Clients Served' },
                    { value: '500+', label: 'Verified Lawyers' },
                    { value: '50+', label: 'Cities Covered' },
                    { value: '99.9%', label: 'Uptime' },
                  ].map((stat, index) => (
                    <motion.div 
                      key={stat.label}
                      className="text-center p-2 sm:p-4"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                    >
                      <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-1 sm:mb-2">{stat.value}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-12 sm:py-16 lg:py-24 bg-muted/30 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_25%,rgba(251,191,36,0.07),transparent_46%),radial-gradient(circle_at_90%_20%,rgba(59,130,246,0.06),transparent_44%)]" aria-hidden />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              className="grid lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 items-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.div 
                variants={scaleIn}
                className="bg-card p-5 sm:p-6 lg:p-8 rounded-2xl shadow-[0_18px_60px_rgba(0,0,0,0.2),0_0_30px_rgba(251,191,36,0.16)] border border-amber-200/50 ring-1 ring-amber-300/35 order-2 lg:order-1"
              >
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6 font-serif">
                  What Sets Us Apart
                </h3>
                <div className="space-y-4 sm:space-y-5">
                  {[
                    { icon: Award, title: 'Rigorous Verification', desc: 'All lawyers undergo comprehensive Bar Council verification' },
                    { icon: Globe, title: 'Nationwide Coverage', desc: 'Serving clients across all provinces and territories' },
                    { icon: Users, title: 'Community Driven', desc: 'Built by Pakistanis, for Pakistanis' },
                  ].map((item, index) => (
                    <motion.div 
                      key={item.title}
                      className="flex items-start"
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.15 + 0.2 }}
                    >
                      <item.icon className="w-5 h-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-foreground text-sm sm:text-base">{item.title}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                          {item.desc}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              
              <motion.div variants={fadeInUp} className="order-1 lg:order-2">
                <div className="flex items-center mb-4 sm:mb-6">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-primary mr-3 sm:mr-4 shadow-lg">
                    <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                  </div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground font-serif">Our Vision</h2>
                </div>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed mb-4 sm:mb-6">
                  We envision a Pakistan where legal justice is accessible to all, regardless 
                  of economic status, geographic location, or social background. Through 
                  technology and human compassion, we're building a future where legal 
                  guidance is just a click away.
                </p>
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
                  Our platform represents more than just a service—it's a movement towards 
                  a more just and equitable society where everyone has the tools they need 
                  to protect their rights and pursue justice.
                </p>
                <motion.p
                  variants={fadeInUp}
                  className="mt-3 text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed"
                >
                  Our platform represents more than just a service—it's a movement towards a more just and equitable society where everyone has the tools they need to protect their rights and pursue justice.
                </motion.p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Responsible AI Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-5xl mx-auto bg-card border border-amber-300/40 ring-1 ring-amber-200/60 rounded-2xl p-6 sm:p-8 lg:p-10 shadow-[0_20px_70px_rgba(0,0,0,0.25),0_0_32px_rgba(251,191,36,0.22)]"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div
              variants={scaleIn}
              className="inline-flex items-center gap-3 rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg"
            >
              <ShieldCheck className="h-5 w-5" />
              Responsible Use of AI
            </motion.div>
            <motion.p
              variants={fadeInUp}
              className="mt-5 text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed"
            >
              Wukala-GPT provides legal guidance and informational assistance, not legal judgments or verdicts. Our AI system helps users understand legal concepts and documents, while all final legal decisions and actions are carried out by verified legal professionals. This ensures ethical, transparent, and responsible use of artificial intelligence.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Privacy & Trust */}
      <section className="py-12 sm:py-16 lg:py-20 bg-muted/20">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-5xl mx-auto grid lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-12 items-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg">
                <ShieldCheck className="h-5 w-5" /> Privacy & Trust First
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground font-serif">Security you can rely on</h3>
              <p className="text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed">
                We prioritize user privacy and data protection through secure authentication, role-based access control, and encrypted communication. All legal documents and conversations are handled with strict confidentiality to ensure trust, safety, and reliability for both clients and legal professionals.
              </p>
            </motion.div>
            <motion.div
              variants={scaleIn}
              className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-xl p-6 sm:p-8"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,hsl(var(--primary)/0.08),transparent_45%),radial-gradient(circle_at_80%_10%,hsl(var(--primary)/0.08),transparent_35%)]" aria-hidden />
              <div className="relative grid gap-4 text-sm text-foreground">
                {[{
                  title: 'Secure authentication',
                  desc: 'Protected sessions with strict access control tailored to user roles.'
                }, {
                  title: 'Encrypted communication',
                  desc: 'Conversations and documents safeguarded end-to-end for confidentiality.'
                }, {
                  title: 'Trusted handling',
                  desc: 'Workflows designed to keep client-lawyer data safe, auditable, and private.'
                }].map((item, idx) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.08 + 0.1, duration: 0.5 }}
                    className="rounded-xl border border-border/60 bg-background/60 p-4 backdrop-blur"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{item.title}</span>
                      <span className="text-xs text-primary">0{idx + 1}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-12 sm:py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <motion.div 
              className="text-center mb-10 sm:mb-12 lg:mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.h2 
                variants={fadeInUp}
                className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3 sm:mb-4 font-serif"
              >
                Our Core Values
              </motion.h2>
              <motion.p 
                variants={fadeInUp}
                className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto"
              >
                The principles that guide everything we do
              </motion.p>
            </motion.div>

            <motion.div 
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              {[
                { icon: Scale, title: 'Justice', desc: 'Ensuring fair and equal access to legal services for all Pakistanis' },
                { icon: Heart, title: 'Compassion', desc: 'Understanding that legal matters often involve life-changing situations' },
                { icon: Award, title: 'Excellence', desc: 'Maintaining the highest standards in technology and service quality' },
                { icon: Globe, title: 'Innovation', desc: 'Continuously evolving to serve our community better through technology' },
              ].map((value, index) => (
                <motion.div 
                  key={value.title}
                  variants={fadeInUp}
                  className="text-center p-3 sm:p-4 lg:p-6"
                >
                  <motion.div 
                    className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-primary rounded-xl sm:rounded-2xl mx-auto mb-3 sm:mb-4 shadow-lg"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <value.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary-foreground" />
                  </motion.div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-foreground mb-2 sm:mb-3">{value.title}</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {value.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
