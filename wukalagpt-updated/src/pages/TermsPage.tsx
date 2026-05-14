import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Scale, FileText } from 'lucide-react';

const sections = [
  {
    title: 'Purpose of the service',
    detail: 'Wukala-GPT provides AI-powered legal guidance and education. It does not provide legal representation or create a lawyer-client relationship.',
  },
  {
    title: 'User responsibilities',
    detail: 'Use the platform lawfully, protect your account, and avoid misuse, scraping, or attempts to bypass security.',
  },
  {
    title: 'Content limitations',
    detail: 'AI-generated outputs may be incomplete or outdated. Always verify critical information with a qualified lawyer.',
  },
  {
    title: 'Data handling',
    detail: 'We protect data with security controls and privacy safeguards. Do not upload information you are not authorized to share.',
  },
  {
    title: 'Acceptable use',
    detail: 'No unlawful, harmful, or abusive activity. Respect intellectual property and confidentiality obligations.',
  },
  {
    title: 'Changes and termination',
    detail: 'We may update these terms or suspend access for policy breaches. Material changes will be communicated.',
  },
];

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container px-4 py-12 lg:py-16 space-y-8">
        <div className="space-y-3 max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600">
            <Shield className="h-4 w-4" /> Formal terms for usage
          </p>
          <h1 className="text-3xl lg:text-4xl font-semibold text-foreground">Terms of Service</h1>
          <p className="text-muted-foreground text-base lg:text-lg">
            Please review these terms before using Wukala-GPT. They set expectations for acceptable use, limitations of AI-generated content, and your responsibilities.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {sections.map((section) => (
            <Card key={section.title} className="border-border/70 bg-background/80 shadow-[0_14px_60px_rgba(0,0,0,0.18)]">
              <CardHeader className="flex flex-row items-start gap-3">
                <div className="rounded-full bg-primary/10 text-primary p-2">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg text-foreground">{section.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{section.detail}</p>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="border-border/70 bg-background/80">
          <CardContent className="py-6 space-y-2 text-sm text-muted-foreground">
            <p className="text-foreground font-medium">No legal advice</p>
            <p>Wukala-GPT outputs are informational and do not replace counsel from a licensed lawyer. For any legal decision or court matter, seek professional advice.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsPage;
