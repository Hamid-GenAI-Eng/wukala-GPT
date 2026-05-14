import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, BookOpen, Scale, Gavel } from 'lucide-react';

const guides = [
  {
    title: 'Starting Safely',
    description: 'Simple steps for signing agreements, protecting personal data, and knowing your rights before you commit.',
    icon: ShieldCheck,
  },
  {
    title: 'Everyday Matters',
    description: 'Understand rentals, employment terms, consumer issues, and basic dispute options in plain language.',
    icon: BookOpen,
  },
  {
    title: 'Family & Personal',
    description: 'Overview of marriage, guardianship, and inheritance basics with clear next-step guidance.',
    icon: Scale,
  },
  {
    title: 'When Issues Escalate',
    description: 'Know what to expect if a matter becomes civil or criminal, and when to consult a licensed lawyer.',
    icon: Gavel,
  },
];

const LegalGuidesPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container px-4 py-12 lg:py-16 space-y-8">
        <div className="space-y-3 max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600">
            <ShieldCheck className="h-4 w-4" /> Plain-language legal learning
          </p>
          <h1 className="text-3xl lg:text-4xl font-semibold text-foreground">Legal Guides for Pakistan</h1>
          <p className="text-muted-foreground text-base lg:text-lg">
            These guides explain common legal topics in simple terms. They are educational only and do not replace advice from a qualified lawyer.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {guides.map((guide) => (
            <Card key={guide.title} className="border-border/70 bg-background/80 shadow-[0_14px_60px_rgba(0,0,0,0.18)]">
              <CardHeader className="flex flex-row items-start gap-3">
                <div className="rounded-full bg-primary/10 text-primary p-2">
                  <guide.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg text-foreground">{guide.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{guide.description}</p>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>What you will find:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Short explanations with next steps.</li>
                  <li>Definitions written without legal jargon.</li>
                  <li>When to pause and speak to a licensed lawyer.</li>
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/70 bg-background/80">
          <CardContent className="py-6 space-y-2 text-sm text-muted-foreground">
            <p className="text-foreground font-medium">Important</p>
            <p>Content here is informational, not legal advice. Laws can change and individual situations differ. For legal decisions, consult a qualified lawyer in Pakistan.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LegalGuidesPage;
