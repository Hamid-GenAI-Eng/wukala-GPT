import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin, ShieldCheck, Clock, Building2 } from 'lucide-react';
import logo from '@/assets/Wukala-GPT-Logo-Green.jpg';

const contactMethods = [
  {
    title: 'Talk to our team',
    description: 'Reach a specialist who understands legal workflows and AI governance.',
    icon: Phone,
    detail: '+92 (0) 300 000 0000',
    hint: 'Mon–Fri, 9:00–18:00 PKT',
  },
  {
    title: 'Email enterprise',
    description: 'Proposals, partnerships, compliance, and enterprise onboarding.',
    icon: Mail,
    detail: 'enterprise@wukala.ai',
    hint: 'Same-day response for priority matters',
  },
  {
    title: 'Meet in Pakistan',
    description: 'Karachi & Islamabad with remote coverage across provinces.',
    icon: MapPin,
    detail: 'By appointment only',
    hint: 'Private, secure consultations',
  },
];

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(251,191,36,0.08),transparent_32%),radial-gradient(circle_at_85%_10%,rgba(16,185,129,0.08),transparent_30%)]" aria-hidden />
      <div className="container px-4 py-12 lg:py-16 space-y-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] items-stretch">
          <Card className="relative overflow-hidden border-border/70 bg-background/85 shadow-[0_18px_70px_rgba(0,0,0,0.28)]">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-transparent to-emerald-400/10 opacity-80" aria-hidden />
            <CardHeader className="relative space-y-3 pb-5 pt-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600">
                <ShieldCheck className="h-4 w-4" /> Secure, human support
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full ring-2 ring-amber-400/60 ring-offset-2 ring-offset-background shadow-[0_0_20px_rgba(251,191,36,0.35)] overflow-hidden">
                  <img src={logo} alt="Wukala-GPT" className="h-12 w-12 object-cover" />
                </span>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Premium AI legal platform</p>
                  <h1 className="text-3xl lg:text-4xl font-semibold text-foreground">Contact Wukala-GPT</h1>
                </div>
              </div>
              <p className="text-muted-foreground text-base lg:text-lg leading-relaxed">
                We respond quickly for onboarding, enterprise needs, and responsible AI inquiries. Tell us what you need and we will route you to the right expert.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-amber-300/50 bg-amber-500/8 p-3 shadow-inner">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Response</p>
                  <p className="text-sm font-semibold text-foreground">Within one business day</p>
                </div>
                <div className="rounded-xl border border-emerald-300/50 bg-emerald-500/8 p-3 shadow-inner">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Channels</p>
                  <p className="text-sm font-semibold text-foreground">Phone, email, secure chat</p>
                </div>
              </div>
              <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" aria-hidden />
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
                <span className="rounded-full border border-amber-300/50 bg-amber-500/10 px-3 py-1 text-amber-700">Secure data handling</span>
                <span className="rounded-full border border-emerald-300/50 bg-emerald-500/10 px-3 py-1 text-emerald-700">Verified lawyers</span>
                <span className="rounded-full border border-blue-300/50 bg-blue-500/10 px-3 py-1 text-blue-700">Enterprise support</span>
              </div>
            </CardHeader>
          </Card>

          <Card className="relative overflow-hidden border-border/70 bg-background/85 shadow-[0_18px_70px_rgba(0,0,0,0.28)]">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-transparent to-emerald-400/10 opacity-80" aria-hidden />
            <CardHeader className="relative space-y-2">
              <CardTitle className="text-xl text-foreground">Priority contact</CardTitle>
              <p className="text-sm text-muted-foreground">Choose how you want to reach us.</p>
            </CardHeader>
            <CardContent className="relative grid gap-4">
              {contactMethods.map((method) => (
                <div
                  key={method.title}
                  className="group relative overflow-hidden rounded-2xl border border-border/70 bg-background/80 px-4 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.18)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_18px_60px_rgba(0,0,0,0.24)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-400/8 via-transparent to-emerald-400/8 opacity-90" aria-hidden />
                  <div className="relative flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/80 to-amber-300/80 text-amber-950 shadow-[0_10px_30px_rgba(251,191,36,0.35)]">
                      <method.icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">{method.title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{method.description}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-foreground/90">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 border border-amber-300/50">{method.detail}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 border border-emerald-300/50">{method.hint}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="relative flex items-center gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.18)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/70 to-emerald-300/70 text-white shadow-[0_10px_30px_rgba(56,189,248,0.35)]">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">Need to visit?</p>
                  <p className="text-sm text-muted-foreground">Schedule a secure in-office session in Karachi or Islamabad.</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-1 border border-sky-300/50 text-xs">Appointment-based access</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="relative overflow-hidden border-border/70 bg-background/90 shadow-[0_18px_70px_rgba(0,0,0,0.28)]">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-transparent to-emerald-400/10 opacity-80" aria-hidden />
          <CardHeader className="relative space-y-2">
            <CardTitle className="text-xl text-foreground">Send us a message</CardTitle>
            <p className="text-sm text-muted-foreground">Share a few details. We will follow up with the right specialist and keep your information confidential.</p>
          </CardHeader>
          <CardContent className="relative">
            <form className="grid gap-4 lg:grid-cols-2">
              <div className="lg:col-span-1 space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="name">Full name</label>
                <Input id="name" placeholder="Ayesha Khan" required className="bg-background/70" />
              </div>
              <div className="lg:col-span-1 space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="email">Work email</label>
                <Input id="email" type="email" placeholder="you@company.com" required className="bg-background/70" />
              </div>
              <div className="lg:col-span-1 space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="phone">Phone</label>
                <Input id="phone" type="tel" placeholder="(+92) 300 000 0000" className="bg-background/70" />
              </div>
              <div className="lg:col-span-1 space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="topic">Topic</label>
                <Input id="topic" placeholder="Onboarding, partnership, security..." required className="bg-background/70" />
              </div>
              <div className="lg:col-span-2 space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="message">Message</label>
                <Textarea id="message" placeholder="Tell us how we can help" className="min-h-[160px] bg-background/70" required />
              </div>
              <div className="lg:col-span-2 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>We respond within one business day.</p>
                  <p>By submitting, you agree to be contacted about Wukala-GPT products and services.</p>
                </div>
                <Button className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 text-amber-950 shadow-[0_14px_40px_rgba(251,191,36,0.35)] hover:scale-[1.01] transition-transform">
                  Submit request
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.18)]">
            <div className="flex items-center gap-2 text-foreground">
              <ShieldCheck className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-semibold">Responsible AI</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">We handle data with confidentiality and align with local legal standards in Pakistan.</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.18)]">
            <div className="flex items-center gap-2 text-foreground">
              <Building2 className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-semibold">Enterprise ready</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Role-based access, secure messaging, and verifiable lawyer workflows.</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.18)]">
            <div className="flex items-center gap-2 text-foreground">
              <Clock className="h-4 w-4 text-amber-500" />
              <p className="text-sm font-semibold">Timely follow-up</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">Most inquiries receive a tailored response within one business day.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
