import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Lock, KeyRound, FileLock, EyeOff } from 'lucide-react';

const controls = [
  {
    title: 'Encryption first',
    detail: 'Data in transit and at rest is encrypted to protect documents, chat, and account data.',
    icon: Lock,
  },
  {
    title: 'Role-based access',
    detail: 'Permissions align with user roles so only the right people can view, share, or manage items.',
    icon: KeyRound,
  },
  {
    title: 'Secure authentication',
    detail: 'Modern authentication, session protections, and monitoring reduce account takeover risk.',
    icon: ShieldCheck,
  },
  {
    title: 'Document handling',
    detail: 'Uploads are stored securely with controlled access and defensible retention practices.',
    icon: FileLock,
  },
  {
    title: 'Privacy by design',
    detail: 'We collect the minimum data needed, respect confidentiality, and separate training data from private workspaces.',
    icon: EyeOff,
  },
];

const SecurityPrivacyPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container px-4 py-12 lg:py-16 space-y-8">
        <div className="space-y-3 max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600">
            <ShieldCheck className="h-4 w-4" /> Built for confidentiality
          </p>
          <h1 className="text-3xl lg:text-4xl font-semibold text-foreground">Security & Privacy</h1>
          <p className="text-muted-foreground text-base lg:text-lg">
            Wukala-GPT protects user data, documents, and communications with layered controls. This summary explains the safeguards without heavy technical detail.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {controls.map((item) => (
            <Card key={item.title} className="border-border/70 bg-background/80 shadow-[0_14px_60px_rgba(0,0,0,0.18)]">
              <CardHeader className="flex flex-row items-start gap-3">
                <div className="rounded-full bg-primary/10 text-primary p-2">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg text-foreground">{item.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{item.detail}</p>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card className="border-border/70 bg-background/80">
          <CardContent className="py-6 space-y-2 text-sm text-muted-foreground">
            <p className="text-foreground font-medium">Our commitment</p>
            <p>We operate with ethical responsibility, confidentiality, and compliance in mind. For sensitive matters, we encourage users to involve licensed lawyers and follow organizational security policies.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SecurityPrivacyPage;
