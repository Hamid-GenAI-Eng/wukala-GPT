import { motion, type Variants } from 'framer-motion';
import { HelpCircle, ShieldCheck, MessageSquare, FileText, Users, Lock, Languages } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const faqs = [
  {
    q: 'What is Wukala-GPT?',
    a: 'Wukala-GPT is an AI-powered legal support platform that helps you understand legal matters, analyze documents, discover verified lawyers, and communicate securely in Urdu and English.',
  },
  {
    q: 'Does Wukala-GPT replace a lawyer?',
    a: 'No. Wukala-GPT provides informational guidance. Final legal decisions and actions should always be taken with a qualified lawyer. We connect you with verified professionals for formal advice.',
  },
  {
    q: 'How is my data protected?',
    a: 'We use secure authentication, role-based access control, and encrypted communication to keep your documents and conversations confidential.',
  },
  {
    q: 'Can I share documents for review?',
    a: 'Yes. You can upload documents for AI summaries and share them with verified lawyers. Access is controlled and auditable for security.',
  },
  {
    q: 'Is voice supported?',
    a: 'Voice interaction is available on Standard and Professional plans alongside text chat for bilingual (Urdu + English) assistance.',
  },
];

const highlightItems = [
  {
    icon: ShieldCheck,
    title: 'Trusted & Secure',
    desc: 'Encrypted messaging, controlled sharing, and verified lawyers keep your matters protected.',
  },
  {
    icon: Languages,
    title: 'Urdu & English',
    desc: 'Bilingual guidance so you can ask questions and understand responses in the language you prefer.',
  },
  {
    icon: MessageSquare,
    title: 'Human + AI',
    desc: 'AI insights paired with real legal professionals for decisions that stay compliant.',
  },
  {
    icon: FileText,
    title: 'Document Smart',
    desc: 'Summaries, key section extraction, and organized sharing with counsel.',
  },
  {
    icon: Users,
    title: 'Built for Pakistan',
    desc: 'Aligned with local legal practices, roles, and professional standards.',
  },
  {
    icon: Lock,
    title: 'Role-Based Access',
    desc: 'Clients, lawyers, and team members see exactly what they should—nothing more.',
  },
];

const FaqPage = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-background via-muted/15 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.09),transparent_45%),radial-gradient(circle_at_80%_0%,hsl(var(--primary)/0.08),transparent_40%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" aria-hidden />
        <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-amber-300/12 blur-3xl" aria-hidden />
        <div className="absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" aria-hidden />
        <div className="container mx-auto px-4 relative">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-120px' }}
            variants={staggerContainer}
          >
            <motion.p variants={fadeInUp} className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-2 text-xs font-semibold tracking-wide">
              <HelpCircle className="h-4 w-4" /> FAQs
            </motion.p>
            <motion.h1
              variants={fadeInUp}
              className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground font-serif"
            >
              Answers for people and professionals
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Quick, bilingual guidance on how Wukala-GPT supports you with AI-driven insights and verified legal expertise.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-10 sm:py-12 lg:py-16 relative">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(251,191,36,0.08),transparent_42%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.08),transparent_46%)]" aria-hidden />
        <div className="container mx-auto px-4 relative">
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
          >
            {highlightItems.map((item, idx) => (
              <motion.div
                key={item.title}
                variants={scaleIn}
                transition={{ delay: idx * 0.05 + 0.1 }}
                className={`relative overflow-hidden rounded-2xl border bg-card/85 backdrop-blur-xl p-5 sm:p-6 shadow-lg transition-all duration-400 hover:-translate-y-1 hover:shadow-[0_22px_70px_rgba(0,0,0,0.24)] ${
                  idx < 6
                    ? 'border-amber-300/60 ring-1 ring-amber-400/50 shadow-[0_18px_60px_rgba(251,191,36,0.28)]'
                    : 'border-border/70'
                }`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.08),transparent_45%)]" aria-hidden />
                {idx < 6 && (
                  <>
                    <div
                      className="pointer-events-none absolute -inset-10 bg-[conic-gradient(from_0deg,rgba(251,191,36,0.18),transparent_32%,rgba(251,191,36,0.25),transparent_72%)] blur-3xl opacity-70 animate-[spin_14s_linear_infinite]"
                      aria-hidden
                    />
                    <div
                      className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-400/16 via-transparent to-primary/10 opacity-80 animate-pulse"
                      aria-hidden
                    />
                  </>
                )}
                <div className="relative flex items-start gap-3">
                  <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/80 via-primary/80 to-emerald-400/70 text-primary-foreground shadow-[0_0_0_5px_rgba(251,191,36,0.2)]">
                    <div className="absolute inset-0 blur-lg bg-amber-300/55 opacity-70" aria-hidden />
                    <item.icon className="relative h-5 w-5 drop-shadow" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-foreground">{item.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Responsible & Ethical AI */}
      <section className="pb-10 sm:pb-12 lg:pb-14">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto rounded-2xl border border-amber-300/60 ring-1 ring-amber-400/50 bg-card/85 p-6 sm:p-8 shadow-[0_18px_60px_rgba(0,0,0,0.25),0_0_28px_rgba(251,191,36,0.28)] relative overflow-hidden"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-400/18 via-transparent to-primary/10 opacity-80 blur-3xl" aria-hidden />
            <motion.p
              variants={fadeInUp}
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold tracking-wide"
            >
              Responsible & Ethical AI
            </motion.p>
            <motion.p
              variants={fadeInUp}
              className="mt-3 text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed"
            >
              Wukala-GPT is designed to support understanding, not replace professional legal judgment. Our AI provides informational guidance, while all legal decisions are made by verified lawyers. We prioritize transparency, fairness, and ethical use of AI in every interaction.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* FAQ list */}
      <section className="pb-14 sm:pb-16 lg:pb-20">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="mb-6 text-center space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">FAQ</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground font-serif">Everything you need to know</h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                Practical answers about how Wukala-GPT works, how we protect your data, and how to engage with verified lawyers.
              </p>
            </motion.div>
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((item, idx) => (
                <motion.div
                  key={item.q}
                  variants={scaleIn}
                  transition={{ delay: idx * 0.05 + 0.05, duration: 0.45 }}
                  className="group relative [perspective:1400px]"
                >
                  <AccordionItem
                    value={`item-${idx}`}
                    className="relative overflow-hidden rounded-2xl border border-amber-400/40 ring-1 ring-amber-300/50 bg-card/85 px-4 shadow-[0_18px_50px_rgba(0,0,0,0.25),0_0_22px_rgba(251,191,36,0.18)] transition-transform duration-400 ease-out data-[state=open]:shadow-[0_22px_70px_rgba(0,0,0,0.35),0_0_28px_rgba(251,191,36,0.26)] group-hover:-translate-y-1 group-hover:rotate-[0.4deg] group-hover:shadow-[0_24px_90px_rgba(0,0,0,0.38),0_0_34px_rgba(251,191,36,0.32)]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 via-transparent to-primary/10 opacity-70 blur-3xl transition-opacity duration-500 group-hover:opacity-100" aria-hidden />
                    <AccordionTrigger className="relative z-10 text-left text-sm sm:text-base font-semibold text-foreground transition-all duration-300 group-hover:text-amber-500 data-[state=open]:text-amber-500">
                      <div className="flex items-center justify-between gap-3 w-full">
                        <span className="flex-1">{item.q}</span>
                        <span className="h-8 w-8 rounded-full border border-amber-300/70 bg-background/80 flex items-center justify-center text-xs font-semibold text-amber-600 shadow-[0_0_12px_rgba(251,191,36,0.32)] transition-transform duration-500 group-hover:rotate-6 group-hover:translate-z-[6px] group-hover:scale-105">
                          {`0${idx + 1}`}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="relative z-10 text-sm text-muted-foreground pb-4 leading-relaxed transition-all duration-300 data-[state=open]:pt-1">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default FaqPage;
