import { motion, type Variants } from 'framer-motion';
import { Tag, ShieldCheck, Sparkles, Zap, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const stagger: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const plans = [
  {
    name: 'Basic Plan — Legal Starter',
    price: 'PKR 1,499',
    cadence: 'per month',
    description: 'For general users and students who need clear answers before talking to a lawyer.',
    features: [
      'Bilingual AI legal chat (Urdu + English)',
      'Text-based legal Q&A + limited voice',
      'Upload 5 documents / month',
      'Basic AI summaries and insights',
      'Lawyer search (view profiles)',
    ],
    cta: 'Start Basic',
    accent: 'from-amber-500/60 via-amber-400/40 to-amber-300/20',
  },
  {
    name: 'Standard Plan — Smart Legal Assist',
    badge: 'Most popular',
    price: 'PKR 3,499',
    cadence: 'per month',
    description: 'For individuals handling active matters who need guidance, document analysis, and lawyer communication.',
    features: [
      'Everything in Basic',
      'Full voice + text AI interaction',
      'Upload 20 documents / month',
      'Advanced AI summaries & key extraction',
      'Verified lawyer discovery with filters',
      'Secure encrypted messaging + attachments',
      'Case requests & appointment scheduling',
    ],
    cta: 'Choose Standard',
    accent: 'from-emerald-500/60 via-emerald-400/40 to-emerald-300/20',
    highlight: true,
  },
  {
    name: 'Professional Plan — Lawyer Pro Dashboard',
    price: 'PKR 6,999',
    cadence: 'per month',
    description: 'For lawyers and legal professionals who need client management, drafting, and operational control.',
    features: [
      'Everything in Standard',
      'Dedicated Lawyer Dashboard',
      'Case management system',
      'Client request acceptance / rejection',
      'Appointment & reminder management',
      'Secure client-lawyer encrypted messaging',
      'AI drafting, summaries, and multi-client support',
      'Verification badge (admin approved)',
    ],
    cta: 'Get Professional',
    accent: 'from-blue-500/60 via-indigo-400/40 to-sky-300/20',
  },
];

const PricingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-background via-muted/10 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,hsl(var(--primary)/0.12),transparent_45%),radial-gradient(circle_at_80%_20%,rgba(251,191,36,0.12),transparent_40%)]" aria-hidden />
        <div className="container mx-auto px-4 relative">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.p variants={fadeInUp} className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-2 text-xs font-semibold tracking-wide">
              <Tag className="h-4 w-4" /> Pricing
            </motion.p>
            <motion.h1 variants={fadeInUp} className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground font-serif">
              Clear, startup-friendly plans in PKR
            </motion.h1>
            <motion.p variants={fadeInUp} className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your legal workflow1AI guidance, secure collaboration, and verified lawyers when you need them.
            </motion.p>
            <motion.div variants={fadeInUp} className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-foreground" /> No hidden fees. Cancel anytime.
            </motion.div>
          </motion.div>

          <motion.div
            className="mt-12 grid gap-6 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
          >
            {plans.map((plan) => (
              <motion.div
                key={plan.name}
                variants={fadeInUp}
                className={`group relative overflow-hidden rounded-2xl border border-border/70 bg-card/85 p-6 shadow-[0_16px_55px_rgba(0,0,0,0.25)] transition-transform duration-500 hover:-translate-y-2 hover:shadow-[0_22px_80px_rgba(0,0,0,0.32)] ${plan.highlight ? 'ring-2 ring-amber-400/70 ring-offset-2 ring-offset-background' : ''}`}
              >
                <div className={`absolute inset-0 opacity-70 blur-3xl transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-br ${plan.accent}`} aria-hidden />
                <div className="relative space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{plan.name}</p>
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-semibold text-foreground">{plan.price}</span>
                        <span className="text-sm text-muted-foreground">{plan.cadence}</span>
                      </div>
                    </div>
                    {plan.badge && (
                      <span className="rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/30 px-3 py-1 text-xs font-medium">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
                  <div className="space-y-3">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2 text-sm">
                        <span className="mt-[2px] rounded-full bg-foreground/10 p-1 text-foreground">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    className={plan.highlight ? 'w-full bg-amber-500 hover:bg-amber-600 text-amber-950 shadow-[0_10px_40px_rgba(251,191,36,0.35)]' : 'w-full bg-secondary text-secondary-foreground hover:bg-secondary/80'}
                    variant={plan.highlight ? 'default' : 'secondary'}
                  >
                    {plan.cta}
                  </Button>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Zap className="h-4 w-4 text-foreground" />
                    <span>Onboarding in under 48 hours with guided rollout.</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
