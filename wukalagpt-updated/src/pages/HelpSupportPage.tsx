import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, MessageSquare, Upload, UserCircle, Search, FileText } from 'lucide-react';

const topics = [
  {
    title: 'Account & access',
    detail: 'Update profile details, manage passwords, and understand roles for clients and lawyers.',
    icon: UserCircle,
  },
  {
    title: 'Finding lawyers',
    detail: 'Use filters to discover verified lawyers and send structured requests for consultations.',
    icon: Search,
  },
  {
    title: 'Documents & uploads',
    detail: 'Supported formats, upload limits, and tips for clear document summaries.',
    icon: Upload,
  },
  {
    title: 'Messaging & follow-ups',
    detail: 'Secure chat, sharing files, and knowing when to move a conversation to a call or meeting.',
    icon: MessageSquare,
  },
  {
    title: 'Using AI responses',
    detail: 'How to prompt clearly, review outputs responsibly, and confirm critical points with a lawyer.',
    icon: FileText,
  },
];

const HelpSupportPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container px-4 py-12 lg:py-16 space-y-8">
        <div className="space-y-3 max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600">
            <HelpCircle className="h-4 w-4" /> Friendly, professional help
          </p>
          <h1 className="text-3xl lg:text-4xl font-semibold text-foreground">Help & Support</h1>
          <p className="text-muted-foreground text-base lg:text-lg">
            Get guidance on using Wukala-GPT. These notes are practical, concise, and meant to boost your confidence on the platform.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {topics.map((topic) => (
            <Card key={topic.title} className="border-border/70 bg-background/80 shadow-[0_14px_60px_rgba(0,0,0,0.18)]">
              <CardHeader className="flex flex-row items-start gap-3">
                <div className="rounded-full bg-primary/10 text-primary p-2">
                  <topic.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg text-foreground">{topic.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{topic.detail}</p>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="border-border/70 bg-background/80">
          <CardContent className="py-6 space-y-2 text-sm text-muted-foreground">
            <p className="text-foreground font-medium">Need more help?</p>
            <p>For urgent issues, reach out through Contact. For legal decisions, always confirm with a qualified lawyer. We aim to keep responses clear and prompt.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HelpSupportPage;
