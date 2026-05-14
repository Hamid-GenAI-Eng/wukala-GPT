import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Search,
  Plus,
  FileText,
  FileSignature,
  FilePlus2,
  Clock,
  Star,
  Copy,
  Download,
  MoreVertical,
  Sparkles,
  BookOpen,
  Eye,
  History,
  ChevronLeft,
  Scale,
  Briefcase,
  Home,
  Gavel,
  FileCheck,
  Layers,
  ArrowRight,
  Check,
  X,
  RotateCcw,
  Edit3,
  PlusCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// --- Types ---
interface Template {
  id: number;
  name: string;
  category: string;
  uses: number;
  starred: boolean;
  description: string;
  clauses: number;
  lastUpdated: string;
  aiPowered: boolean;
}

interface Clause {
  id: number;
  title: string;
  category: string;
  text: string;
  tags: string[];
  usageCount: number;
}

interface Draft {
  id: number;
  name: string;
  template: string;
  modified: string;
  status: 'Draft' | 'Review' | 'Final' | 'Sent';
  client: string;
  wordCount: number;
  versions: VersionEntry[];
}

interface VersionEntry {
  version: string;
  date: string;
  author: string;
  changes: string;
}

// --- Data ---
const templates: Template[] = [
  { id: 1, name: 'Power of Attorney (Wakalatnama)', category: 'Court Filing', uses: 156, starred: true, description: 'Standard Wakalatnama format for all courts in Pakistan with automatic party details filling.', clauses: 8, lastUpdated: '2 days ago', aiPowered: true },
  { id: 2, name: 'Civil Suit Plaint', category: 'Court Filing', uses: 89, starred: true, description: 'Complete plaint template with cause of action, relief sought, and jurisdiction paragraphs.', clauses: 14, lastUpdated: '1 week ago', aiPowered: true },
  { id: 3, name: 'Criminal Bail Application', category: 'Criminal', uses: 124, starred: false, description: 'Pre & post-arrest bail application with grounds, case law references, and prayer clause.', clauses: 11, lastUpdated: '3 days ago', aiPowered: true },
  { id: 4, name: 'Partnership Agreement', category: 'Corporate', uses: 67, starred: false, description: 'Comprehensive partnership deed with profit sharing, dissolution, and dispute resolution clauses.', clauses: 22, lastUpdated: '5 days ago', aiPowered: false },
  { id: 5, name: 'Rental Agreement', category: 'Property', uses: 203, starred: true, description: 'Residential & commercial rental agreement as per local tenancy laws with maintenance & eviction clauses.', clauses: 16, lastUpdated: '1 day ago', aiPowered: true },
  { id: 6, name: 'Notice of Demand', category: 'General', uses: 95, starred: false, description: 'Legal demand notice with timeline, consequences, and settlement terms.', clauses: 6, lastUpdated: '4 days ago', aiPowered: false },
  { id: 7, name: 'Written Arguments', category: 'Court Filing', uses: 78, starred: false, description: 'Structured written arguments with facts, legal provisions, and case law citations.', clauses: 9, lastUpdated: '6 days ago', aiPowered: true },
  { id: 8, name: 'Sale Agreement (Immovable Property)', category: 'Property', uses: 145, starred: true, description: 'Comprehensive sale deed with transfer conditions, encumbrance warranty, and stamp duty provisions.', clauses: 18, lastUpdated: '2 days ago', aiPowered: false },
];

const clauseBank: Clause[] = [
  { id: 1, title: 'Force Majeure', category: 'General', text: 'Neither party shall be liable for failure to perform obligations due to circumstances beyond reasonable control, including but not limited to natural disasters, war, government action, epidemic...', tags: ['contract', 'liability', 'defence'], usageCount: 89 },
  { id: 2, title: 'Arbitration (Pakistan)', category: 'Dispute Resolution', text: 'Any dispute arising out of or in connection with this agreement shall be referred to and finally resolved by arbitration under the Arbitration Act, 1940 as amended...', tags: ['arbitration', 'dispute', 'ADR'], usageCount: 124 },
  { id: 3, title: 'Confidentiality & Non-Disclosure', category: 'Corporate', text: 'The Receiving Party agrees to hold in strict confidence all Confidential Information disclosed by the Disclosing Party and shall not disclose...', tags: ['NDA', 'confidential', 'corporate'], usageCount: 156 },
  { id: 4, title: 'Indemnification', category: 'General', text: 'The indemnifying party shall defend, indemnify, and hold harmless the indemnified party from and against any and all claims, damages, losses...', tags: ['indemnity', 'liability', 'protection'], usageCount: 78 },
  { id: 5, title: 'Jurisdiction (High Court)', category: 'Court Filing', text: 'This Honourable Court has territorial and pecuniary jurisdiction to entertain the present suit as the cause of action arose within the territorial limits...', tags: ['jurisdiction', 'court', 'filing'], usageCount: 201 },
  { id: 6, title: 'Termination for Convenience', category: 'Corporate', text: 'Either party may terminate this Agreement at any time by providing thirty (30) days prior written notice to the other party...', tags: ['termination', 'contract', 'exit'], usageCount: 67 },
  { id: 7, title: 'Non-Compete Restriction', category: 'Employment', text: 'The Employee agrees that during the term of employment and for a period of twelve (12) months following termination, they shall not directly or indirectly engage...', tags: ['non-compete', 'employment', 'restriction'], usageCount: 45 },
  { id: 8, title: 'Limitation of Liability', category: 'General', text: 'In no event shall either party be liable for any indirect, incidental, special, consequential, or punitive damages, regardless of the cause of action...', tags: ['liability', 'limitation', 'damages'], usageCount: 92 },
];

const recentDrafts: Draft[] = [
  { id: 1, name: 'Reply to Show Cause Notice - Khan Industries', template: 'Show Cause Reply', modified: '2 hours ago', status: 'Draft', client: 'Khan Industries', wordCount: 2340, versions: [
    { version: 'v3', date: '2 hours ago', author: 'Adv. Hassan', changes: 'Added additional grounds of defence' },
    { version: 'v2', date: 'Yesterday', author: 'Adv. Hassan', changes: 'Incorporated client feedback on timeline' },
    { version: 'v1', date: '3 days ago', author: 'Adv. Ahmed', changes: 'Initial draft created from template' },
  ]},
  { id: 2, name: 'Written Arguments - State v. Ali Raza', template: 'Written Arguments', modified: '5 hours ago', status: 'Review', client: 'Ali Raza', wordCount: 4120, versions: [
    { version: 'v2', date: '5 hours ago', author: 'Adv. Fatima', changes: 'Added case law references (PLD 2023 SC 445)' },
    { version: 'v1', date: '2 days ago', author: 'Adv. Fatima', changes: 'Initial written arguments drafted' },
  ]},
  { id: 3, name: 'Sale Agreement - Islamabad Realty', template: 'Sale Agreement', modified: 'Yesterday', status: 'Final', client: 'Islamabad Realty Corp', wordCount: 5600, versions: [
    { version: 'v4', date: 'Yesterday', author: 'Adv. Hassan', changes: 'Final review - approved for execution' },
    { version: 'v3', date: '3 days ago', author: 'Adv. Ahmed', changes: 'Updated payment schedule per client request' },
    { version: 'v2', date: '5 days ago', author: 'Adv. Hassan', changes: 'Added encumbrance warranty clause' },
    { version: 'v1', date: '1 week ago', author: 'Adv. Ahmed', changes: 'Initial draft from template' },
  ]},
  { id: 4, name: 'Bail Application - Criminal Case #447', template: 'Bail Application', modified: 'Yesterday', status: 'Draft', client: 'Confidential', wordCount: 1890, versions: [
    { version: 'v1', date: 'Yesterday', author: 'Adv. Fatima', changes: 'Initial bail application drafted' },
  ]},
  { id: 5, name: 'Demand Notice - Fatima Enterprises', template: 'Notice of Demand', modified: '3 days ago', status: 'Sent', client: 'Fatima Enterprises', wordCount: 980, versions: [
    { version: 'v2', date: '3 days ago', author: 'Adv. Hassan', changes: 'Sent to opposing party via registered post' },
    { version: 'v1', date: '5 days ago', author: 'Adv. Hassan', changes: 'Initial demand notice created' },
  ]},
];

const statusStyle: Record<string, string> = {
  Draft: 'bg-gold/10 text-gold border-gold/20',
  Review: 'bg-primary/10 text-primary border-primary/20',
  Final: 'bg-success/10 text-success border-success/20',
  Sent: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
};

const categoryIcons: Record<string, React.ReactNode> = {
  'Court Filing': <Gavel className="h-4 w-4" />,
  Criminal: <Scale className="h-4 w-4" />,
  Corporate: <Briefcase className="h-4 w-4" />,
  Property: <Home className="h-4 w-4" />,
  General: <FileText className="h-4 w-4" />,
  Employment: <Briefcase className="h-4 w-4" />,
  'Dispute Resolution': <Scale className="h-4 w-4" />,
};

type View = 'list' | 'template-detail' | 'draft-detail';

export default function DocumentDrafting() {
  const [view, setView] = useState<View>('list');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [templateCategory, setTemplateCategory] = useState('all');
  const [clauseCategory, setClauseCategory] = useState('all');
  const [clauseSearch, setClauseSearch] = useState('');
  const [showNewDocDialog, setShowNewDocDialog] = useState(false);
  const [showClausePreview, setShowClausePreview] = useState<Clause | null>(null);
  const [copiedClauseId, setCopiedClauseId] = useState<number | null>(null);

  const templateCategories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];
  const clauseCategories = ['all', ...Array.from(new Set(clauseBank.map(c => c.category)))];

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = templateCategory === 'all' || t.category === templateCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredClauses = clauseBank.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(clauseSearch.toLowerCase()) ||
      c.tags.some(tag => tag.toLowerCase().includes(clauseSearch.toLowerCase()));
    const matchesCategory = clauseCategory === 'all' || c.category === clauseCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopyClause = (clause: Clause) => {
    navigator.clipboard.writeText(clause.text);
    setCopiedClauseId(clause.id);
    setTimeout(() => setCopiedClauseId(null), 2000);
  };

  // --- Template Detail View ---
  const renderTemplateDetail = () => {
    if (!selectedTemplate) return null;
    const t = selectedTemplate;
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
        <button onClick={() => { setView('list'); setSelectedTemplate(null); }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-sans">
          <ChevronLeft className="h-3.5 w-3.5" /> Back to Templates
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              {categoryIcons[t.category] || <FileText className="h-5 w-5 text-primary" />}
            </div>
            <div>
              <h2 className="text-base font-semibold font-sans text-foreground">{t.name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="secondary" className="text-[10px] font-sans">{t.category}</Badge>
                {t.aiPowered && <Badge className="text-[10px] font-sans bg-primary/10 text-primary border-primary/20 gap-1"><Sparkles className="h-2.5 w-2.5" />AI-Powered</Badge>}
                {t.starred && <Star className="h-3.5 w-3.5 text-gold fill-gold" />}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-xs font-sans gap-1.5 h-8 border-border/50"><Download className="h-3 w-3" /> Export</Button>
            <Button size="sm" className="bg-gradient-primary text-xs font-sans gap-1.5 h-8"><FilePlus2 className="h-3 w-3" /> Use Template</Button>
          </div>
        </div>

        <Card className="border-border/50">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs text-muted-foreground font-sans leading-relaxed">{t.description}</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className="text-lg font-bold font-sans text-foreground">{t.clauses}</p>
                <p className="text-[10px] text-muted-foreground font-sans">Clauses</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className="text-lg font-bold font-sans text-foreground">{t.uses}</p>
                <p className="text-[10px] text-muted-foreground font-sans">Uses</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className="text-lg font-bold font-sans text-foreground">{t.lastUpdated}</p>
                <p className="text-[10px] text-muted-foreground font-sans">Updated</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Preview */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold font-sans text-foreground">Document Preview</h3>
            </div>
            <div className="bg-secondary/30 rounded-lg p-4 border border-border/30 space-y-3 font-serif">
              <div className="text-center space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">In the Court of</p>
                <p className="text-xs font-semibold text-foreground">[COURT NAME]</p>
                <div className="h-px bg-border/50 w-1/3 mx-auto my-2" />
              </div>
              <div className="space-y-2 text-[11px] text-muted-foreground leading-relaxed">
                <p><span className="font-semibold text-foreground">{t.name}</span></p>
                <p className="italic">Case No: [_____________]</p>
                <p><span className="font-medium text-foreground">BETWEEN:</span></p>
                <p className="pl-4">[PARTY NAME] .......................... Plaintiff/Applicant</p>
                <p className="text-center font-medium text-foreground">VERSUS</p>
                <p className="pl-4">[PARTY NAME] .......................... Defendant/Respondent</p>
                <div className="h-px bg-border/30 my-2" />
                <p className="text-[10px] italic text-muted-foreground/70">— AI-generated preview. Actual document will contain {t.clauses} clauses with proper legal formatting —</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Suggestions */}
        {t.aiPowered && (
          <Card className="border-primary/20 bg-primary/[0.02]">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold font-sans text-foreground">AI Suggestions</h3>
              </div>
              <div className="space-y-2">
                {['Auto-fill party details from Client CRM', 'Suggest relevant case law citations', 'Generate prayer clause based on case facts'].map((suggestion, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-background border border-border/30 cursor-pointer hover:border-primary/30 transition-colors">
                    <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                    <span className="text-[11px] font-sans text-muted-foreground">{suggestion}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    );
  };

  // --- Draft Detail / Version History View ---
  const renderDraftDetail = () => {
    if (!selectedDraft) return null;
    const d = selectedDraft;
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
        <button onClick={() => { setView('list'); setSelectedDraft(null); }} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-sans">
          <ChevronLeft className="h-3.5 w-3.5" /> Back to Drafts
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold font-sans text-foreground">{d.name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="outline" className={`text-[10px] font-sans ${statusStyle[d.status]}`}>{d.status}</Badge>
              <span className="text-[10px] text-muted-foreground font-sans">{d.template}</span>
              <span className="text-[10px] text-muted-foreground font-sans">·</span>
              <span className="text-[10px] text-muted-foreground font-sans">{d.wordCount.toLocaleString()} words</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="text-xs font-sans gap-1.5 h-8 border-border/50"><Edit3 className="h-3 w-3" /> Edit</Button>
            <Button size="sm" variant="outline" className="text-xs font-sans gap-1.5 h-8 border-border/50"><Download className="h-3 w-3" /> Export</Button>
          </div>
        </div>

        {/* Document Info */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground font-sans">Client</p>
                <p className="text-xs font-medium font-sans text-foreground">{d.client}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-sans">Last Modified</p>
                <p className="text-xs font-medium font-sans text-foreground">{d.modified}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-sans">Template</p>
                <p className="text-xs font-medium font-sans text-foreground">{d.template}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-sans">Versions</p>
                <p className="text-xs font-medium font-sans text-foreground">{d.versions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Preview */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold font-sans text-foreground">Document Preview</h3>
            </div>
            <div className="bg-secondary/30 rounded-lg p-4 border border-border/30 space-y-2 text-[11px] text-muted-foreground font-serif leading-relaxed">
              <p className="font-semibold text-foreground text-xs text-center">{d.name}</p>
              <div className="h-px bg-border/40 my-2" />
              <p><span className="font-medium text-foreground">Client:</span> {d.client}</p>
              <p><span className="font-medium text-foreground">Document Type:</span> {d.template}</p>
              <p className="pt-2">RESPECTFULLY SHEWETH:</p>
              <p>1. That the applicant/plaintiff is a [party description] and is filing the instant [document type] before this Honourable Court...</p>
              <p>2. That the facts and circumstances of the present case are briefly stated herein below for the kind perusal of this Honourable Court...</p>
              <div className="h-px bg-border/30 my-2" />
              <p className="text-[10px] italic text-muted-foreground/70">— Preview showing first {d.wordCount.toLocaleString()} words of document content —</p>
            </div>
          </CardContent>
        </Card>

        {/* Version History */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <History className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold font-sans text-foreground">Version History</h3>
            </div>
            <div className="space-y-0">
              {d.versions.map((v, i) => (
                <div key={v.version} className="relative flex gap-3">
                  {/* Timeline line */}
                  <div className="flex flex-col items-center">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${i === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                      {i === 0 ? <Check className="h-3 w-3" /> : <RotateCcw className="h-3 w-3" />}
                    </div>
                    {i < d.versions.length - 1 && <div className="w-px h-full bg-border/50 min-h-[2rem]" />}
                  </div>
                  <div className="pb-4 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold font-sans text-foreground">{v.version}</span>
                      {i === 0 && <Badge className="text-[9px] font-sans bg-primary/10 text-primary border-primary/20">Current</Badge>}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-sans mt-0.5">{v.changes}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground/70 font-sans">
                      <span>{v.author}</span>
                      <span>·</span>
                      <span>{v.date}</span>
                    </div>
                    {i > 0 && (
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] font-sans text-primary p-0 mt-1 hover:bg-transparent hover:underline">
                        Restore this version
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // --- Main List View ---
  const renderListView = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold font-sans text-foreground">Document Drafting</h2>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">AI-powered templates, clause bank & version history</p>
        </div>
        <Button size="sm" className="bg-gradient-primary font-sans text-xs gap-1.5 h-9" onClick={() => setShowNewDocDialog(true)}>
          <FilePlus2 className="h-3.5 w-3.5" /> New Document
        </Button>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-9">
          <TabsTrigger value="templates" className="text-xs font-sans gap-1.5"><Layers className="h-3 w-3" /> Templates</TabsTrigger>
          <TabsTrigger value="clauses" className="text-xs font-sans gap-1.5"><BookOpen className="h-3 w-3" /> Clause Bank</TabsTrigger>
          <TabsTrigger value="drafts" className="text-xs font-sans gap-1.5"><FileText className="h-3 w-3" /> Drafts</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-3 mt-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search templates..." className="pl-8 h-8 text-xs font-sans" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {templateCategories.map(cat => (
              <Button key={cat} variant={templateCategory === cat ? 'default' : 'outline'} size="sm" className="h-7 text-[10px] font-sans capitalize" onClick={() => setTemplateCategory(cat)}>
                {cat}
              </Button>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {filteredTemplates.map(t => (
              <Card key={t.id} className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group" onClick={() => { setSelectedTemplate(t); setView('template-detail'); }}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      {categoryIcons[t.category] || <FileSignature className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />}
                    </div>
                    <div className="flex items-center gap-1">
                      {t.aiPowered && <Sparkles className="h-3.5 w-3.5 text-primary" />}
                      {t.starred && <Star className="h-3.5 w-3.5 text-gold fill-gold" />}
                    </div>
                  </div>
                  <p className="text-sm font-semibold font-sans text-foreground leading-tight">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground font-sans mt-1 line-clamp-2">{t.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="secondary" className="text-[10px] font-sans">{t.category}</Badge>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-sans">
                      <span>{t.clauses} clauses</span>
                      <span>·</span>
                      <span>{t.uses} uses</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Clause Bank Tab */}
        <TabsContent value="clauses" className="space-y-3 mt-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search clauses by name or tag..." className="pl-8 h-8 text-xs font-sans" value={clauseSearch} onChange={e => setClauseSearch(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {clauseCategories.map(cat => (
              <Button key={cat} variant={clauseCategory === cat ? 'default' : 'outline'} size="sm" className="h-7 text-[10px] font-sans capitalize" onClick={() => setClauseCategory(cat)}>
                {cat}
              </Button>
            ))}
          </div>
          <div className="space-y-2">
            {filteredClauses.map(clause => (
              <Card key={clause.id} className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold font-sans text-foreground">{clause.title}</p>
                        <Badge variant="secondary" className="text-[10px] font-sans shrink-0">{clause.category}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-sans line-clamp-2 leading-relaxed">{clause.text}</p>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {clause.tags.map(tag => (
                          <span key={tag} className="text-[9px] font-sans px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">#{tag}</span>
                        ))}
                        <span className="text-[10px] text-muted-foreground/60 font-sans ml-auto">{clause.usageCount} uses</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button variant="outline" size="icon" className="h-7 w-7 border-border/50" onClick={() => handleCopyClause(clause)}>
                        {copiedClauseId === clause.id ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowClausePreview(clause)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Drafts Tab */}
        <TabsContent value="drafts" className="space-y-3 mt-3">
          <div className="space-y-2">
            {recentDrafts.map(d => (
              <Card key={d.id} className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer" onClick={() => { setSelectedDraft(d); setView('draft-detail'); }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium font-sans text-foreground truncate">{d.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground font-sans flex-wrap">
                          <span>{d.client}</span>
                          <span>·</span>
                          <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{d.modified}</span>
                          <span>·</span>
                          <span className="flex items-center gap-0.5"><History className="h-3 w-3" />{d.versions.length} versions</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] font-sans shrink-0 ${statusStyle[d.status]}`}>{d.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {view === 'list' && <motion.div key="list">{renderListView()}</motion.div>}
        {view === 'template-detail' && <motion.div key="template">{renderTemplateDetail()}</motion.div>}
        {view === 'draft-detail' && <motion.div key="draft">{renderDraftDetail()}</motion.div>}
      </AnimatePresence>

      {/* New Document Dialog */}
      <Dialog open={showNewDocDialog} onOpenChange={setShowNewDocDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-sans">Create New Document</DialogTitle>
            <DialogDescription className="text-xs font-sans">Choose a template or start from scratch</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium font-sans text-foreground">Document Title</label>
              <Input className="h-9 text-xs font-sans mt-1" placeholder="e.g., Bail Application - Case #512" />
            </div>
            <div>
              <label className="text-xs font-medium font-sans text-foreground">Client</label>
              <Input className="h-9 text-xs font-sans mt-1" placeholder="Select or type client name" />
            </div>
            <div>
              <label className="text-xs font-medium font-sans text-foreground">Template</label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {templates.slice(0, 4).map(t => (
                  <div key={t.id} className="p-2.5 rounded-lg border border-border/50 cursor-pointer hover:border-primary/40 hover:bg-primary/[0.02] transition-all text-center">
                    <div className="h-7 w-7 rounded-md bg-secondary flex items-center justify-center mx-auto mb-1.5">
                      {categoryIcons[t.category] || <FileText className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                    <p className="text-[10px] font-medium font-sans text-foreground leading-tight">{t.name}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg border border-dashed border-primary/30 bg-primary/[0.02] cursor-pointer hover:bg-primary/[0.04] transition-colors">
              <Sparkles className="h-4 w-4 text-primary" />
              <div>
                <p className="text-xs font-medium font-sans text-foreground">AI-Assisted Drafting</p>
                <p className="text-[10px] text-muted-foreground font-sans">Describe your document and let AI generate the first draft</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs font-sans" onClick={() => setShowNewDocDialog(false)}>Cancel</Button>
            <Button size="sm" className="bg-gradient-primary text-xs font-sans gap-1.5"><PlusCircle className="h-3 w-3" /> Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clause Preview Dialog */}
      <Dialog open={!!showClausePreview} onOpenChange={() => setShowClausePreview(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-sans">{showClausePreview?.title}</DialogTitle>
            <DialogDescription className="text-xs font-sans">
              {showClausePreview?.category} · {showClausePreview?.usageCount} uses
            </DialogDescription>
          </DialogHeader>
          <div className="bg-secondary/30 rounded-lg p-4 border border-border/30">
            <p className="text-xs text-foreground font-sans leading-relaxed whitespace-pre-wrap">{showClausePreview?.text}</p>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {showClausePreview?.tags.map(tag => (
              <span key={tag} className="text-[10px] font-sans px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">#{tag}</span>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs font-sans gap-1.5" onClick={() => showClausePreview && handleCopyClause(showClausePreview)}>
              <Copy className="h-3 w-3" /> Copy to Clipboard
            </Button>
            <Button size="sm" className="bg-gradient-primary text-xs font-sans gap-1.5">
              <PlusCircle className="h-3 w-3" /> Insert into Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
