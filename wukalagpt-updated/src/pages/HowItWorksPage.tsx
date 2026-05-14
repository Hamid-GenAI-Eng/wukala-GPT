import { motion, type Variants } from 'framer-motion';
import { Workflow, ShieldCheck, FileText, MessageSquare, Users, Sparkles, CheckCircle2 } from 'lucide-react';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const steps = [
  {
    icon: MessageSquare,
    title: 'Ask your legal question (Urdu or English)',
    desc: 'Ask by text or voice. Multi-Agent RAG AI understands intent, uses Pakistan-specific legal knowledge, and replies with clear guidance so you grasp your situation fast.',
  },
  {
    icon: FileText,
    title: 'Upload legal documents for AI analysis',
    desc: 'Upload FIRs, agreements, notices, or PDFs. AI summarizes, extracts key sections, and highlights what matters to your issuesaving time on dense legal language.',
  },
  {
    icon: ShieldCheck,
    title: 'Find a verified lawyer',
    desc: 'Search verified lawyers with smart filters (specialization, experience, city, fee range, expertise). Every lawyer passes an admin-approved verification process.',
  },
  {
    icon: Users,
    title: 'Connect securely and manage your case',
    desc: 'Use encrypted messaging to share documents and messages. Lawyers manage cases, documents, and appointments; clients track everything with strong auth and role-based access.',
  },
];

const HowItWorksPage = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-background via-muted/15 to-background relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.08),transparent_45%),radial-gradient(circle_at_80%_0%,hsl(var(--primary)/0.08),transparent_40%)]" aria-hidden />
        <div className="container mx-auto px-4 relative">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.p variants={fadeInUp} className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-2 text-xs font-semibold tracking-wide">
              <Workflow className="h-4 w-4" /> How It Works
            </motion.p>
            <motion.h1 variants={fadeInUp} className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground font-serif">
              How Wukala-GPT Works
            </motion.h1>
            <motion.p variants={fadeInUp} className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              From asking in Urdu or English to secure collaboration with verified lawyers, heres the streamlined journey.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Steps grid */}
      <section className="pb-16 sm:pb-20 lg:pb-24">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/70 p-6 sm:p-8 shadow-[0_18px_60px_rgba(0,0,0,0.25)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_42%),radial-gradient(circle_at_80%_10%,rgba(251,191,36,0.15),transparent_45%)] opacity-90" aria-hidden />
            <motion.div
              className="relative grid gap-6 sm:grid-cols-2 xl:grid-cols-2"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-120px' }}
              variants={stagger}
            >
              {steps.map((step, idx) => (
                <motion.div
                  key={step.title}
                  variants={fadeInUp}
                  transition={{ delay: idx * 0.06 + 0.05 }}
                  className="group relative overflow-hidden rounded-2xl border border-border/80 bg-background/90 p-6 shadow-[0_16px_48px_rgba(0,0,0,0.22)] transition-transform duration-400 hover:-translate-y-2 hover:shadow-[0_20px_70px_rgba(0,0,0,0.3),0_0_28px_rgba(251,191,36,0.25)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400/18 via-transparent to-primary/12 opacity-70 blur-3xl transition-opacity duration-500 group-hover:opacity-100" aria-hidden />
                  <div className="relative flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-primary text-amber-950 shadow-[0_10px_30px_rgba(251,191,36,0.35)] group-hover:scale-105 group-hover:rotate-1 transition-transform duration-400">
                      <step.icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Step 0{idx + 1}</div>
                      <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Callout */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            className="relative overflow-hidden rounded-3xl border border-amber-300/60 ring-1 ring-amber-400/40 bg-gradient-to-br from-primary/12 via-background/60 to-amber-100/10 p-8 sm:p-10 text-center shadow-[0_22px_90px_rgba(0,0,0,0.28),0_0_32px_rgba(251,191,36,0.25)]"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-120px' }}
            variants={stagger}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_30%,rgba(251,191,36,0.16),transparent_55%),radial-gradient(circle_at_75%_20%,hsl(var(--primary)/0.12),transparent_50%)] blur-2xl opacity-80" aria-hidden />
            <motion.div
              variants={fadeInUp}
              className="relative inline-flex items-center gap-3 rounded-full bg-amber-500/10 border border-amber-400/40 px-4 py-2 text-xs sm:text-sm font-semibold text-amber-700 shadow-[0_10px_30px_rgba(251,191,36,0.28)]"
            >
              <Sparkles className="h-4 w-4" /> Trust, Security, Transparency
            </motion.div>
            <motion.h2 variants={fadeInUp} className="relative mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground font-serif">
              Every interaction stays transparent, secure, and auditable
            </motion.h2>
            <motion.p variants={fadeInUp} className="relative mt-3 text-sm sm:text-base lg:text-lg text-muted-foreground max-w-3xl mx-auto">
              From onboarding to final counsel, Wukala-GPT keeps clients and lawyers aligned with clear steps, verified identities, and protected data.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="relative mt-6 inline-flex items-center gap-2 rounded-full bg-primary/15 border border-primary/30 px-4 py-2 text-sm font-semibold text-primary shadow-[0_10px_30px_rgba(0,0,0,0.15)]"
            >
              <Sparkles className="h-4 w-4" /> Built for clarity and trust
            </motion.div>
            <motion.div
              variants={fadeInUp}
              className="relative mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left"
            >
              {["Verified identities", "Encrypted messaging & docs", "Auditable, role-based access"].map((item, idx) => (
                <div
                  key={item}
                  className="rounded-2xl border border-border/60 bg-background/70 px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_14px_40px_rgba(0,0,0,0.18)] transition-shadow duration-400"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" /> {item}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorksPage;
