import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Scale, Gavel, Users, FileText } from 'lucide-react';

const areas = [
  {
    title: 'Civil matters',
    summary: 'Contracts, property, and disputes between individuals or organizations.',
    icon: FileText,
  },
  {
    title: 'Criminal law',
    summary: 'Offenses defined by statute with state-led prosecution and procedural safeguards.',
    icon: Gavel,
  },
  {
    title: 'Family law',
    summary: 'Marriage, divorce, custody, maintenance, and guardianship considerations.',
    icon: Users,
  },
  {
    title: 'Constitutional rights',
    summary: 'Fundamental rights, judicial review, and how laws align with the Constitution.',
    icon: Scale,
  },
  {
    title: 'Labour & employment',
    summary: 'Workplace rights, contracts, safety, and dispute resolution mechanisms.',
    icon: Scale,
  },
  {
    title: 'Tax & compliance',
    summary: 'High-level view of tax obligations, filings, and interactions with authorities.',
    icon: Globe,
  },
];

const PakistanLawsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container px-4 py-12 lg:py-16 space-y-8">
        <div className="space-y-3 max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600">
            <Globe className="h-4 w-4" /> High-level legal overview
          </p>
          <h1 className="text-3xl lg:text-4xl font-semibold text-foreground">Pakistan Laws Overview</h1>
          <p className="text-muted-foreground text-base lg:text-lg">
            Summaries of key legal areas in Pakistan. This page is for awareness only and does not offer legal advice. Laws change, and individual cases vary.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {areas.map((area) => (
            <Card key={area.title} className="border-border/70 bg-background/80 shadow-[0_14px_60px_rgba(0,0,0,0.18)]">
              <CardHeader className="flex flex-row items-start gap-3">
                <div className="rounded-full bg-primary/10 text-primary p-2">
                  <area.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg text-foreground">{area.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{area.summary}</p>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="border-border/70 bg-background/80">
          <CardContent className="py-6 space-y-2 text-sm text-muted-foreground">
            <p className="text-foreground font-medium">Important</p>
            <p>This overview is educational. It is not legal advice or a substitute for consultation with licensed counsel. For current statutes or case-specific guidance, speak with a qualified lawyer.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PakistanLawsPage;
