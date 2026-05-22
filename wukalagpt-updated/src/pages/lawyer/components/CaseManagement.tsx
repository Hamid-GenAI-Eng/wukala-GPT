import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Briefcase,
  Calendar,
  User,
  MapPin,
  Clock,
  ArrowUpDown,
  ArrowLeft,
  FileText,
  MessageSquare,
  Link2,
  ChevronRight,
  Gavel,
  Scale,
  Upload,
  Download,
  Eye,
  Trash2,
  Edit,
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Circle,
  Timer,
  Hash,
  X,
  StickyNote,
  Paperclip,
  GitBranch,
  Loader2,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

// ─── Data Types ─────────────────────────────────────────────────────
interface CaseFile {
  id: string;
  title: string;
  caseNumber: string;
  firNumber?: string;
  client: string;
  court: string;
  judge: string;
  opposingCounsel: string;
  type: string;
  status: CaseStatus;
  priority: string;
  nextHearing: string;
  stage: string;
  filedDate: string;
  description: string;
  linkedCases: string[];
  timeline: TimelineEvent[];
  notes: CaseNote[];
  documents: CaseDocument[];
}

interface TimelineEvent {
  id: number;
  date: string;
  title: string;
  description: string;
  type: 'hearing' | 'order' | 'filing' | 'adjournment' | 'document' | 'note';
}

interface CaseNote {
  id: number;
  author: string;
  date: string;
  content: string;
}

interface CaseDocument {
  id: number;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  confidential: boolean;
}

type CaseStatus = 'Filed' | 'Active' | 'Heard' | 'Reserved' | 'Decided' | 'Appeal' | 'Discovery' | 'Negotiation';

// ─── Pipeline Stages ────────────────────────────────────────────────
const pipelineStages: { label: string; status: CaseStatus }[] = [
  { label: 'Filed', status: 'Filed' },
  { label: 'Active', status: 'Active' },
  { label: 'Heard', status: 'Heard' },
  { label: 'Reserved', status: 'Reserved' },
  { label: 'Decided', status: 'Decided' },
  { label: 'Appeal', status: 'Appeal' },
];

// ─── Mock Data ──────────────────────────────────────────────────────
const cases: CaseFile[] = [
  {
    id: 'CS-2024-001',
    title: 'Khan Industries v. Federal Board of Revenue',
    caseNumber: 'WP No. 12847/2024',
    client: 'Khan Industries Ltd.',
    court: 'Lahore High Court',
    judge: 'Justice Malik Shahzad Ahmad',
    opposingCounsel: 'Adv. Tariq Hussain (FBR Panel)',
    type: 'Tax',
    status: 'Active',
    priority: 'High',
    nextHearing: '2024-03-15',
    stage: 'Arguments',
    filedDate: '2024-01-10',
    description: 'Constitutional petition challenging FBR tax assessment order for fiscal year 2022-23. Client contends that the assessment was made without proper notice under Section 122 of the Income Tax Ordinance 2001.',
    linkedCases: ['CS-2024-005'],
    timeline: [
      { id: 1, date: '2024-03-10', title: 'Written arguments submitted', description: 'Filed written arguments on constitutional grounds per court direction', type: 'filing' },
      { id: 2, date: '2024-03-01', title: 'Hearing — Arguments commenced', description: 'Court heard preliminary arguments. FBR counsel requested adjournment for counter-affidavit.', type: 'hearing' },
      { id: 3, date: '2024-02-15', title: 'Counter-affidavit received', description: 'FBR filed para-wise reply denying all allegations', type: 'document' },
      { id: 4, date: '2024-02-01', title: 'Stay order granted', description: 'Hon\'ble court stayed recovery proceedings till next date of hearing', type: 'order' },
      { id: 5, date: '2024-01-20', title: 'Notice issued to respondents', description: 'Court issued notice returnable in 2 weeks', type: 'order' },
      { id: 6, date: '2024-01-10', title: 'Petition filed', description: 'Constitutional petition filed under Article 199 of the Constitution', type: 'filing' },
    ],
    notes: [
      { id: 1, author: 'Adv. Ahmed', date: '2024-03-10', content: 'Strong precedent found — 2022 SCMR 1547 supports our position on Section 122 notice requirements. Use in next arguments.' },
      { id: 2, author: 'Adv. Sara Malik', date: '2024-02-20', content: 'Client provided additional bank statements for FY 2022-23. Stored in Document Vault under evidence folder.' },
      { id: 3, author: 'Adv. Ahmed', date: '2024-01-15', content: 'Initial case strategy: Challenge on procedural grounds first, then substantive tax computation errors.' },
    ],
    documents: [
      { id: 1, name: 'Constitutional Petition - WP 12847.pdf', type: 'PDF', size: '2.4 MB', uploadedBy: 'Adv. Ahmed', uploadedAt: '2024-01-10', confidential: false },
      { id: 2, name: 'FBR Assessment Order.pdf', type: 'PDF', size: '890 KB', uploadedBy: 'Adv. Sara', uploadedAt: '2024-01-08', confidential: true },
      { id: 3, name: 'Stay Order - 01 Feb 2024.pdf', type: 'PDF', size: '156 KB', uploadedBy: 'Adv. Ahmed', uploadedAt: '2024-02-01', confidential: false },
      { id: 4, name: 'Written Arguments Draft.docx', type: 'DOCX', size: '340 KB', uploadedBy: 'Adv. Ahmed', uploadedAt: '2024-03-09', confidential: false },
      { id: 5, name: 'Bank Statements FY22-23.xlsx', type: 'XLSX', size: '1.2 MB', uploadedBy: 'Client', uploadedAt: '2024-02-18', confidential: true },
    ],
  },
  {
    id: 'CS-2024-002',
    title: 'State v. Ali Raza',
    caseNumber: 'FIR No. 447/2023 — Sessions Trial No. 89/2024',
    firNumber: '447/2023',
    client: 'Ali Raza (Defendant)',
    court: 'Sessions Court, Islamabad',
    judge: 'Judge Farooq Ahmed Bhatti',
    opposingCounsel: 'Deputy Prosecutor General',
    type: 'Criminal',
    status: 'Active',
    priority: 'Critical',
    nextHearing: '2024-03-12',
    stage: 'Evidence',
    filedDate: '2024-01-05',
    description: 'Criminal trial under Sections 302/34 PPC. Client is accused of murder. Defense strategy focuses on alibi evidence and challenging forensic report credibility.',
    linkedCases: [],
    timeline: [
      { id: 1, date: '2024-03-05', title: 'Prosecution witness #4 examined', description: 'Cross-examination of eye-witness completed. Several contradictions highlighted.', type: 'hearing' },
      { id: 2, date: '2024-02-20', title: 'Prosecution witness #3 examined', description: 'Forensic expert examined. Defense challenged chain of custody of evidence.', type: 'hearing' },
      { id: 3, date: '2024-02-05', title: 'Charge framed', description: 'Charge framed under Section 302/34 PPC. Accused pleaded not guilty.', type: 'order' },
      { id: 4, date: '2024-01-15', title: 'Bail denied', description: 'Post-arrest bail application dismissed. Will approach High Court.', type: 'order' },
      { id: 5, date: '2024-01-05', title: 'Case registered', description: 'FIR No. 447/2023 registered at PS Margalla, Islamabad', type: 'filing' },
    ],
    notes: [
      { id: 1, author: 'Adv. Ahmed', date: '2024-03-06', content: 'Key contradictions in PW-4 testimony: Witness said he was at the scene at 9 PM but mobile data shows him 15 km away. Strong defense point.' },
      { id: 2, author: 'Adv. Hassan Raza', date: '2024-02-21', content: 'Forensic report chain of custody is weak. 36-hour gap between evidence collection and lab submission. Will argue contamination.' },
    ],
    documents: [
      { id: 1, name: 'FIR No. 447-2023.pdf', type: 'PDF', size: '320 KB', uploadedBy: 'Adv. Ahmed', uploadedAt: '2024-01-06', confidential: true },
      { id: 2, name: 'Bail Application.pdf', type: 'PDF', size: '450 KB', uploadedBy: 'Adv. Ahmed', uploadedAt: '2024-01-12', confidential: false },
      { id: 3, name: 'Forensic Report - Exhibit A.pdf', type: 'PDF', size: '1.8 MB', uploadedBy: 'Court', uploadedAt: '2024-02-18', confidential: true },
    ],
  },
  {
    id: 'CS-2024-003',
    title: 'Noor Enterprises Partnership Dispute',
    caseNumber: 'Civil Suit No. 234/2024',
    client: 'Noor Enterprises',
    court: 'Civil Court, Karachi',
    judge: 'Justice Aisha Siddiqui',
    opposingCounsel: 'Adv. Kamran Sheikh',
    type: 'Civil',
    status: 'Discovery',
    priority: 'Medium',
    nextHearing: '2024-03-20',
    stage: 'Discovery',
    filedDate: '2024-01-18',
    description: 'Partnership dissolution suit. Client seeks accounting of partnership assets and profits for the last 5 years. Opposing party refusing to share financial records.',
    linkedCases: [],
    timeline: [
      { id: 1, date: '2024-03-05', title: 'Discovery order issued', description: 'Court directed defendant to produce partnership financial records within 14 days', type: 'order' },
      { id: 2, date: '2024-02-15', title: 'Written statement filed by defendant', description: 'Defendant denied allegations of misappropriation', type: 'filing' },
      { id: 3, date: '2024-01-25', title: 'Summons served', description: 'Defendant served through court process server', type: 'order' },
      { id: 4, date: '2024-01-18', title: 'Suit filed', description: 'Civil suit for dissolution and accounting filed', type: 'filing' },
    ],
    notes: [
      { id: 1, author: 'Adv. Ahmed', date: '2024-03-06', content: 'If defendant fails to produce records by March 19, will file contempt application. Also preparing alternate evidence from client\'s own records.' },
    ],
    documents: [
      { id: 1, name: 'Plaint - Civil Suit 234.pdf', type: 'PDF', size: '1.1 MB', uploadedBy: 'Adv. Ahmed', uploadedAt: '2024-01-18', confidential: false },
      { id: 2, name: 'Partnership Deed (Original).pdf', type: 'PDF', size: '680 KB', uploadedBy: 'Client', uploadedAt: '2024-01-16', confidential: true },
    ],
  },
  {
    id: 'CS-2024-004',
    title: 'Islamabad Realty Property Dispute',
    caseNumber: 'CPLA No. 567/2024',
    client: 'Islamabad Realty Corp.',
    court: 'Supreme Court of Pakistan',
    judge: 'CJ Qazi Faez Isa',
    opposingCounsel: 'Adv. Barrister Salman Akram Raja',
    type: 'Property',
    status: 'Appeal',
    priority: 'High',
    nextHearing: '2024-04-01',
    stage: 'Appeal',
    filedDate: '2024-02-01',
    description: 'Civil Petition for Leave to Appeal against Islamabad High Court judgment in a property dispute involving 500 kanal land in Zone-IV, Islamabad.',
    linkedCases: [],
    timeline: [
      { id: 1, date: '2024-02-20', title: 'CPLA admitted for regular hearing', description: 'Supreme Court admitted the petition and issued notice to respondents', type: 'order' },
      { id: 2, date: '2024-02-01', title: 'CPLA filed', description: 'Petition filed against IHC judgment dated 15-01-2024', type: 'filing' },
    ],
    notes: [],
    documents: [
      { id: 1, name: 'CPLA Petition.pdf', type: 'PDF', size: '3.5 MB', uploadedBy: 'Adv. Ahmed', uploadedAt: '2024-02-01', confidential: false },
      { id: 2, name: 'IHC Impugned Judgment.pdf', type: 'PDF', size: '2.1 MB', uploadedBy: 'Adv. Ahmed', uploadedAt: '2024-01-30', confidential: false },
    ],
  },
  {
    id: 'CS-2024-005',
    title: 'Fatima Enterprises v. National Bank of Pakistan',
    caseNumber: 'Banking Suit No. 78/2024',
    client: 'Fatima Enterprises',
    court: 'Banking Court, Lahore',
    judge: 'Judge Rizwan Ul Haq',
    opposingCounsel: 'Adv. NBP Legal Division',
    type: 'Banking',
    status: 'Active',
    priority: 'Medium',
    nextHearing: '2024-03-18',
    stage: 'Hearing',
    filedDate: '2024-01-22',
    description: 'Recovery suit filed by NBP for outstanding loan facility of PKR 25 Million. Client disputes the calculation of mark-up and claims overpayment.',
    linkedCases: ['CS-2024-001'],
    timeline: [
      { id: 1, date: '2024-03-08', title: 'Counter-claim filed', description: 'Filed counter-claim for overpayment of PKR 3.2 Million', type: 'filing' },
      { id: 2, date: '2024-02-20', title: 'Written statement filed', description: 'Denied bank\'s claim of outstanding amount. Produced payment receipts.', type: 'filing' },
      { id: 3, date: '2024-01-22', title: 'Suit filed by NBP', description: 'NBP filed recovery suit under Financial Institutions Ordinance 2001', type: 'filing' },
    ],
    notes: [
      { id: 1, author: 'Adv. Ahmed', date: '2024-03-09', content: 'Hired forensic accountant to audit the mark-up calculation. Report expected in 10 days.' },
    ],
    documents: [
      { id: 1, name: 'NBP Plaint.pdf', type: 'PDF', size: '1.4 MB', uploadedBy: 'Court', uploadedAt: '2024-01-22', confidential: false },
      { id: 2, name: 'Payment Receipts Bundle.pdf', type: 'PDF', size: '4.8 MB', uploadedBy: 'Client', uploadedAt: '2024-02-15', confidential: true },
    ],
  },
  {
    id: 'CS-2024-006',
    title: 'Workers Union Collective Bargaining',
    caseNumber: 'Labour Case No. 12/2024',
    client: 'Pakistan Workers Union',
    court: 'Labour Court, Faisalabad',
    judge: 'Judge Tariq Mehmood',
    opposingCounsel: 'Adv. Zulfiqar Ali (Management Counsel)',
    type: 'Labour',
    status: 'Negotiation',
    priority: 'Low',
    nextHearing: '2024-03-25',
    stage: 'Mediation',
    filedDate: '2024-02-10',
    description: 'Collective bargaining dispute regarding minimum wage increase and workplace safety standards for textile factory workers in Faisalabad.',
    linkedCases: [],
    timeline: [
      { id: 1, date: '2024-03-01', title: 'Mediation session — partial agreement', description: 'Management agreed on safety standards. Wage negotiation continues.', type: 'hearing' },
      { id: 2, date: '2024-02-15', title: 'First mediation session', description: 'Both parties presented initial positions', type: 'hearing' },
      { id: 3, date: '2024-02-10', title: 'Reference filed', description: 'Labour dispute reference filed before the Labour Court', type: 'filing' },
    ],
    notes: [],
    documents: [
      { id: 1, name: 'Charter of Demands.pdf', type: 'PDF', size: '420 KB', uploadedBy: 'Client', uploadedAt: '2024-02-09', confidential: false },
    ],
  },
];

// ─── Style Maps ─────────────────────────────────────────────────────
const statusColor: Record<string, string> = {
  Filed: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
  Active: 'bg-success/10 text-success border-success/20',
  Heard: 'bg-primary/10 text-primary border-primary/20',
  Reserved: 'bg-gold/10 text-gold border-gold/20',
  Decided: 'bg-success/10 text-success border-success/20',
  Appeal: 'bg-destructive/10 text-destructive border-destructive/20',
  Discovery: 'bg-primary/10 text-primary border-primary/20',
  Negotiation: 'bg-gold/10 text-gold border-gold/20',
};

const priorityColor: Record<string, string> = {
  Critical: 'bg-destructive/10 text-destructive border-destructive/20',
  High: 'bg-gold/10 text-gold border-gold/20',
  Medium: 'bg-primary/10 text-primary border-primary/20',
  Low: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
};

const timelineIcon: Record<string, typeof Gavel> = {
  hearing: Gavel,
  order: Scale,
  filing: FileText,
  adjournment: Timer,
  document: Paperclip,
  note: StickyNote,
};

const timelineColor: Record<string, string> = {
  hearing: 'bg-gold/10 text-gold',
  order: 'bg-primary/10 text-primary',
  filing: 'bg-success/10 text-success',
  adjournment: 'bg-destructive/10 text-destructive',
  document: 'bg-muted-foreground/10 text-muted-foreground',
  note: 'bg-primary/10 text-primary',
};

const courtTypes = ['All Courts', 'Lahore High Court', 'Sessions Court', 'Civil Court', 'Supreme Court', 'Banking Court', 'Labour Court'];
const caseTypes = ['All Types', 'Tax', 'Criminal', 'Civil', 'Property', 'Banking', 'Labour', 'Corporate'];

// ─── Component ──────────────────────────────────────────────────────
const allowedTransitions: Record<CaseStatus, CaseStatus[]> = {
  Filed: ['Active', 'Decided'],
  Active: ['Heard', 'Reserved', 'Decided', 'Negotiation', 'Discovery'],
  Discovery: ['Active', 'Negotiation', 'Decided'],
  Negotiation: ['Active', 'Decided'],
  Heard: ['Reserved', 'Decided', 'Active'],
  Reserved: ['Decided'],
  Decided: ['Appeal'],
  Appeal: ['Decided']
};

const isTransitionAllowed = (from: CaseStatus, to: CaseStatus): boolean => {
  if (from === to) return true;
  const allowed = allowedTransitions[from];
  return allowed ? allowed.includes(to) : true;
};

export default function CaseManagement() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [resilientDetails, setResilientDetails] = useState<Record<string, {
    notes?: any[];
    documents?: any[];
    timeline?: any[];
    linkedCases?: string[];
  }>>({});
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCase, setSelectedCase] = useState<CaseFile | null>(null);
  const [detailTab, setDetailTab] = useState('timeline');
  const [showNewCase, setShowNewCase] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterCourt, setFilterCourt] = useState('All Courts');
  const [filterType, setFilterType] = useState('All Types');
  const [newNote, setNewNote] = useState('');

  // Dynamic States
  const [loading, setLoading] = useState(true);
  const [caseList, setCaseList] = useState<CaseFile[]>([]);
  const [addingCase, setAddingCase] = useState(false);
  
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [archivingCase, setArchivingCase] = useState(false);
  
  // Edit case states
  const [showEditCase, setShowEditCase] = useState(false);
  const [updatingCase, setUpdatingCase] = useState(false);
  const [editCaseData, setEditCaseData] = useState<any>(null);
  const [cameFromEdit, setCameFromEdit] = useState(false);

  // Add event states
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [addingEvent, setAddingEvent] = useState(false);
  const [newEventData, setNewEventData] = useState({
    eventType: 'Hearing',
    title: '',
    description: '',
    eventDate: new Date().toISOString().split('T')[0],
    attachmentId: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Link case states
  const [showLinkCase, setShowLinkCase] = useState(false);
  const [linkingCase, setLinkingCase] = useState(false);
  const [linkSearch, setLinkSearch] = useState('');
  const [linkTargetId, setLinkTargetId] = useState('');
  const [linkRelationship, setLinkRelationship] = useState('related');
  const [linkNote, setLinkNote] = useState('');

  // Resilient helper to parse and format dates safely, avoiding RangeError
  function safeDateString(val: any): string {
    if (!val) return '';
    const d = new Date(val);
    if (isNaN(d.getTime())) return '';
    try {
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  }

  // Mapper function to normalize case properties securely, resilient to 500 details fetch errors
  function normalizeCase(c: any): CaseFile {
    const cached = resilientDetails[c.id] || {};
    
    // Notes merging
    let rawNotes = c.notes;
    if (!Array.isArray(rawNotes) || rawNotes.length === 0) {
      rawNotes = cached.notes || [];
    } else if (cached.notes) {
      const serverIds = new Set(rawNotes.map((n: any) => n.id));
      const localUnique = cached.notes.filter(n => !serverIds.has(n.id));
      rawNotes = [...rawNotes, ...localUnique];
    }
    
    // Documents merging
    let rawDocs = c.documents;
    if (!Array.isArray(rawDocs) || rawDocs.length === 0) {
      rawDocs = cached.documents || [];
    } else if (cached.documents) {
      const serverIds = new Set(rawDocs.map((d: any) => d.id));
      const localUnique = cached.documents.filter(d => !serverIds.has(d.id));
      rawDocs = [...rawDocs, ...localUnique];
    }
    
    // Timeline merging
    let rawTimeline = c.timeline;
    if (!Array.isArray(rawTimeline) || rawTimeline.length === 0) {
      rawTimeline = cached.timeline || [];
    } else if (cached.timeline) {
      const serverIds = new Set(rawTimeline.map((t: any) => t.id));
      const localUnique = cached.timeline.filter(t => !serverIds.has(t.id));
      rawTimeline = [...rawTimeline, ...localUnique];
    }

    // Map status if number
    let statusStr = c.status;
    if (typeof statusStr === 'number') {
      const statusMap: Record<number, string> = {
        0: 'Filed',
        1: 'NoticeIssued',
        2: 'Pleaded',
        3: 'Evidence',
        4: 'Arguments',
        5: 'Decided',
        6: 'Closed'
      };
      statusStr = statusMap[statusStr] || 'Filed';
    } else if (typeof statusStr !== 'string') {
      statusStr = 'Filed';
    }

    // Map caseType if number
    let typeStr = c.caseType || c.type;
    if (typeof typeStr === 'number') {
      const typeMap: Record<number, string> = {
        0: 'Civil',
        1: 'Criminal',
        2: 'Corporate',
        3: 'Family',
        4: 'Tax',
        5: 'Labor',
        6: 'IntellectualProperty',
        7: 'Constitutional',
        8: 'Other'
      };
      typeStr = typeMap[typeStr] || 'Civil';
    } else if (typeof typeStr !== 'string') {
      typeStr = 'Civil';
    }

    // Map priority if number
    let priorityStr = c.priority;
    if (typeof priorityStr === 'number') {
      const priorityMap: Record<number, string> = {
        0: 'Low',
        1: 'Medium',
        2: 'High',
        3: 'Urgent'
      };
      priorityStr = priorityMap[priorityStr] || 'Medium';
    } else if (typeof priorityStr !== 'string') {
      priorityStr = 'Medium';
    }

    return {
      id: c.id,
      title: c.title || '',
      caseNumber: c.caseNumber || '',
      firNumber: c.firNumber || '',
      client: c.clientNameRaw || c.client || '',
      clientId: c.clientId || null,
      court: c.courtName || c.court || '',
      judge: c.judgeName || c.judge || '',
      opposingCounsel: c.opposingCounsel || '',
      type: typeStr,
      priority: priorityStr,
      status: statusStr as CaseStatus,
      stage: c.stage || 'Initial filing',
      nextHearing: safeDateString(c.nextHearing || c.nextDate),
      filedDate: safeDateString(c.filedDate || c.filingDate),
      description: c.description || '',
      linkedCases: Array.isArray(c.linkedCases) ? c.linkedCases.map((l: any) => l.linkedCaseId || l) : (cached.linkedCases || []),
      timeline: Array.isArray(rawTimeline) ? rawTimeline.map((t: any) => {
        let rawType = t.eventType !== undefined && t.eventType !== null ? t.eventType : t.type;
        if (typeof rawType === 'number') {
          const eventTypeMap: Record<number, string> = {
            0: 'Filed',
            1: 'Hearing',
            2: 'Adjournment',
            3: 'Order',
            4: 'Submission',
            5: 'Document',
            6: 'Note',
            7: 'StatusChange',
            8: 'Appeal'
          };
          rawType = eventTypeMap[rawType] || 'Hearing';
        }
        const finalType = typeof rawType === 'string' ? rawType : 'Hearing';
        return {
          id: t.id,
          date: safeDateString(t.eventDate || t.createdAt || t.date || new Date()),
          title: t.title || '',
          description: t.description || '',
          type: finalType.toLowerCase()
        };
      }) : [],
      notes: Array.isArray(rawNotes) ? rawNotes.map((n: any) => ({
        id: n.id,
        author: n.authorId === c.leadLawyerId || !n.authorId ? 'Lead Counsel' : 'Internal User',
        date: n.createdAt ? new Date(n.createdAt).toLocaleDateString() : (n.date || 'Just now'),
        content: n.content || ''
      })) : [],
      documents: Array.isArray(rawDocs) ? rawDocs.map((d: any) => ({
        id: d.id,
        name: d.name || d.fileName || 'Untitled Document',
        type: d.classification || d.mimeType || 'PDF',
        size: d.sizeFormatted || d.size || 'Unknown size',
        uploadedBy: 'Lawyer',
        uploadedAt: d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString() : (d.date || 'Just now'),
        confidential: false
      })) : []
    };
  }

  const [newCaseData, setNewCaseData] = useState({
    title: '',
    caseNumber: '',
    firNumber: '',
    client: '',
    clientId: '',
    court: '',
    judge: '',
    opposingCounsel: '',
    type: '',
    priority: 'Medium',
    status: 'Active' as CaseStatus,
    stage: '',
    nextHearing: '',
    filedDate: new Date().toISOString().split('T')[0],
    description: ''
  });

  const loadCaseDetails = async (caseId: string) => {
    try {
      setLoadingDetails(true);
      const res = await api.getCase(caseId);
      if (res) {
        setSelectedCase(normalizeCase(res));
      }
    } catch (err) {
      console.error("Failed to load secure case details", err);
      // Fallback
      const local = caseList.find(c => c.id === caseId);
      if (local) {
        setSelectedCase(local);
      }
    } finally {
      setLoadingDetails(false);
    }
  };

  const loadCasesList = async () => {
    try {
      setLoading(true);
      const res = await api.getCases();
      const casesArray = Array.isArray(res) ? res : (res?.items || res?.Items || []);
      if (casesArray && casesArray.length > 0) {
        setCaseList(casesArray.map(normalizeCase));
      } else {
        setCaseList(cases.map(normalizeCase));
      }
    } catch (err) {
      console.error("Failed to load secure cases directory", err);
      setCaseList(cases.map(normalizeCase));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCasesList();
    
    // Load clients
    async function loadClients() {
      try {
        const res = await api.getClients();
        const clientList = Array.isArray(res) ? res : (res?.items || res?.Items || []);
        setClients(clientList);
      } catch (err) {
        console.error("Failed to load clients dropdown", err);
      }
    }
    loadClients();
  }, []);

  const handleAddCase = async () => {
    try {
      setAddingCase(true);
      const payload = {
        title: newCaseData.title,
        caseNumber: newCaseData.caseNumber,
        firNumber: newCaseData.firNumber,
        clientNameRaw: newCaseData.client,
        clientId: newCaseData.clientId || null,
        courtName: newCaseData.court,
        judgeName: newCaseData.judge,
        opposingCounsel: newCaseData.opposingCounsel,
        caseType: newCaseData.type || 'Civil',
        priority: newCaseData.priority || 'Normal',
        filingDate: newCaseData.filedDate ? new Date(newCaseData.filedDate).toISOString() : new Date().toISOString(),
        description: newCaseData.description
      };
      
      await api.createCase(payload);
      setShowNewCase(false);
      setNewCaseData({
        title: '',
        caseNumber: '',
        firNumber: '',
        client: '',
        clientId: '',
        court: '',
        judge: '',
        opposingCounsel: '',
        type: '',
        priority: 'Medium',
        status: 'Active',
        stage: '',
        nextHearing: '',
        filedDate: new Date().toISOString().split('T')[0],
        description: ''
      });
      await loadCasesList();
    } catch (err) {
      console.error("Failed to create case", err);
    } finally {
      setAddingCase(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedCase) return;
    const noteText = newNote;
    try {
      setSavingNote(true);
      await api.addCaseNote(selectedCase.id, {
        content: noteText,
        isPrivate: false
      });
      setNewNote('');
      toast({
        title: "Note Recorded",
        description: "Case note saved successfully."
      });
      await loadCaseDetails(selectedCase.id);
    } catch (err: any) {
      console.error("Failed to add internal note", err);
      const errMsg = err?.message || "An unexpected error occurred.";
      toast({
        variant: "destructive",
        title: "Failed to Add Note",
        description: errMsg
      });
    } finally {
      setSavingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!selectedCase) return;
    try {
      await api.deleteCaseNote(selectedCase.id, noteId);
      await loadCaseDetails(selectedCase.id);
    } catch (err) {
      console.error("Failed to delete note", err);
    }
  };

  const handleUploadDocumentClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCase) return;
    const titlePrompt = prompt("Enter a title for this document (optional):", file.name) || file.name;
    try {
      setUploadingDoc(true);
      await api.uploadDocument(file, titlePrompt, selectedCase.id);
      toast({
        title: "Document Uploaded",
        description: "Case file successfully saved to records vault."
      });
      await loadCaseDetails(selectedCase.id);
    } catch (err: any) {
      console.error("Failed to upload case document", err);
      const errMsg = err?.message || "An unexpected error occurred.";
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: errMsg
      });
    } finally {
      setUploadingDoc(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleArchiveCase = async () => {
    if (!selectedCase) return;
    if (confirm("Are you sure you want to archive this case? It will be removed from active listings.")) {
      try {
        setArchivingCase(true);
        await api.archiveCase(selectedCase.id);
        setSelectedCase(null);
        toast({
          title: "Case Archived",
          description: "Case successfully archived."
        });
        await loadCasesList();
      } catch (err: any) {
        console.error("Failed to archive case", err);
        const errMsg = err?.message || "An unexpected error occurred.";
        toast({
          variant: "destructive",
          title: "Failed to Archive Case",
          description: errMsg
        });
      } finally {
        setArchivingCase(false);
      }
    }
  };

  const handleOpenEdit = () => {
    if (!selectedCase) return;
    setEditCaseData({
      id: selectedCase.id,
      title: selectedCase.title,
      caseNumber: selectedCase.caseNumber,
      firNumber: selectedCase.firNumber || '',
      clientNameRaw: selectedCase.client || '',
      clientId: selectedCase.clientId || null,
      courtName: selectedCase.court || '',
      judgeName: selectedCase.judge || '',
      opposingCounsel: selectedCase.opposingCounsel || '',
      caseType: selectedCase.type || 'Civil',
      priority: selectedCase.priority || 'Medium',
      status: selectedCase.status || 'Active',
      description: selectedCase.description || '',
      filedDate: selectedCase.filedDate || '',
      nextDate: selectedCase.nextHearing || ''
    });
    setShowEditCase(true);
  };

  const handleUpdateCase = async () => {
    if (!editCaseData) return;
    try {
      setUpdatingCase(true);
      const payload = {
        id: editCaseData.id,
        title: editCaseData.title,
        caseNumber: editCaseData.caseNumber,
        firNumber: editCaseData.firNumber,
        clientNameRaw: editCaseData.clientNameRaw,
        courtName: editCaseData.courtName,
        judgeName: editCaseData.judgeName,
        opposingCounsel: editCaseData.opposingCounsel,
        caseType: editCaseData.caseType,
        priority: editCaseData.priority,
        status: editCaseData.status,
        description: editCaseData.description,
        filingDate: editCaseData.filedDate ? new Date(editCaseData.filedDate).toISOString() : undefined,
        nextDate: editCaseData.nextDate ? editCaseData.nextDate : undefined
      };
      
      await api.updateCase(editCaseData.id, payload);
      setShowEditCase(false);
      toast({
        title: "Case Updated",
        description: "Case details saved successfully."
      });
      await loadCaseDetails(editCaseData.id);
      await loadCasesList();
    } catch (err: any) {
      console.error("Failed to update case details", err);
      const errMsg = err?.message || "An unexpected error occurred.";
      toast({
        variant: "destructive",
        title: "Failed to Update Case",
        description: errMsg
      });
    } finally {
      setUpdatingCase(false);
    }
  };

  const handleAddEventOpenChange = (open: boolean) => {
    setShowAddEvent(open);
    if (!open && cameFromEdit) {
      setCameFromEdit(false);
      setShowEditCase(true);
    }
  };

  const handleAddEvent = async () => {
    if (!selectedCase) return;
    try {
      setAddingEvent(true);

      const isFromEdit = cameFromEdit;
      const finalEventDate = newEventData.eventDate;
      const finalEventType = newEventData.eventType;

      await api.addCaseTimelineEvent(selectedCase.id, {
        eventType: newEventData.eventType.toLowerCase(),
        title: newEventData.title,
        description: newEventData.description,
        eventDate: new Date(newEventData.eventDate).toISOString(),
        attachmentId: newEventData.attachmentId || null
      });
      toast({
        title: "Event Added",
        description: "Key timeline event recorded successfully."
      });
      setShowAddEvent(false);
      setNewEventData({
        eventType: 'Hearing',
        title: '',
        description: '',
        eventDate: new Date().toISOString().split('T')[0],
        attachmentId: ''
      });
      if (isFromEdit) {
        if (editCaseData) {
          setEditCaseData(prev => ({
            ...prev,
            nextDate: finalEventType.toLowerCase() === 'hearing' ? finalEventDate : prev.nextDate
          }));
        }
        setCameFromEdit(false);
        setShowEditCase(true);
      }
      await loadCaseDetails(selectedCase.id);
    } catch (err: any) {
      console.error("Failed to add event", err);
      const errMsg = err?.message || "An unexpected error occurred.";
      toast({
        variant: "destructive",
        title: "Failed to Add Event",
        description: errMsg
      });
    } finally {
      setAddingEvent(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!selectedCase) return;
    if (!confirm("Are you sure you want to delete this event from the timeline?")) return;
    try {
      await api.deleteCaseTimelineEvent(selectedCase.id, eventId);
      toast({ title: "Event Deleted", description: "The timeline event has been removed." });
      await loadCaseDetails(selectedCase.id);
    } catch (err: any) {
      console.error("Failed to delete event", err);
      toast({
        variant: "destructive",
        title: "Deletion Failed",
        description: err?.message || "Could not delete timeline event."
      });
    }
  };

  const handleDownloadDoc = (url: string, name: string) => {
    // In a real implementation this would fetch the blob and trigger download
    // For now we use the anchor download fallback
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleLinkCaseSubmit = async () => {
    if (!selectedCase || !linkTargetId) return;
    const targetId = linkTargetId;
    try {
      setLinkingCase(true);
      await api.linkCase(selectedCase.id, {
        linkedCaseId: targetId,
        relationship: linkRelationship,
        note: linkNote || undefined
      });
      toast({
        title: "Success",
        description: "Cases successfully linked in records timeline."
      });
      setShowLinkCase(false);
      setLinkSearch('');
      setLinkTargetId('');
      setLinkNote('');
      await loadCaseDetails(selectedCase.id);
    } catch (err: any) {
      console.error("Failed to link cases", err);
      const errMsg = err?.message || "An unexpected error occurred.";
      toast({
        variant: "destructive",
        title: "Failed to Link Cases",
        description: errMsg
      });
    } finally {
      setLinkingCase(false);
    }
  };

  const handleTransitionStatus = async (targetStatus: CaseStatus) => {
    if (!selectedCase) return;
    const currentStatus = selectedCase.status;
    if (currentStatus === targetStatus) return;

    if (!isTransitionAllowed(currentStatus, targetStatus)) {
      toast({
        title: "Transition Blocked",
        description: `Cannot transition case directly from "${currentStatus}" to "${targetStatus}" per legal matrix.`,
        variant: "destructive"
      });
      return;
    }

    try {
      const reason = prompt(`Enter the reason or outcome for status transition to "${targetStatus}":`, "Arguments completed");
      if (reason === null) return;

      await api.updateCase(selectedCase.id, {
        id: selectedCase.id,
        status: targetStatus,
        reason: reason || undefined
      });

      toast({
        title: "Status Transitioned",
        description: `Case status moved to "${targetStatus}".`
      });

      await loadCaseDetails(selectedCase.id);
      await loadCasesList();
    } catch (err: any) {
      console.error("Failed to transition status", err);
      const errMsg = err?.message || "An unexpected error occurred.";
      toast({
        variant: "destructive",
        title: "Transition Failed",
        description: errMsg
      });
    }
  };

  const filteredCases = caseList.filter(c => {
    const matchSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.judge.toLowerCase().includes(searchQuery.toLowerCase());
    const matchTab = activeTab === 'all' || c.status.toLowerCase() === activeTab;
    const matchCourt = filterCourt === 'All Courts' || c.court.includes(filterCourt);
    const matchType = filterType === 'All Types' || c.type === filterType;
    return matchSearch && matchTab && matchCourt && matchType;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-sans">Connecting to secure cases vault...</p>
      </div>
    );
  }

  if (loadingDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-sans">Retrieving case records & history...</p>
      </div>
    );
  }

  // ─── Case Detail View ──────────────────────────────────────────
  const currentStageIndex = selectedCase
    ? pipelineStages.findIndex(s => s.status === selectedCase.status)
    : -1;

  return (
    <div className="space-y-5">
      {selectedCase ? (
        <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="space-y-5"
      >
        {/* Back Button + Title */}
        <div className="flex flex-col gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-fit text-xs font-sans gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
            onClick={() => setSelectedCase(null)}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Cases
          </Button>

          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold font-sans text-foreground">{selectedCase.title}</h2>
                <Badge variant="outline" className={`text-[10px] font-sans ${priorityColor[selectedCase.priority]}`}>
                  {selectedCase.priority}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[11px] text-muted-foreground font-sans">
                <span className="flex items-center gap-1 font-mono"><Hash className="h-3 w-3" />{selectedCase.caseNumber}</span>
                {selectedCase.firNumber && (
                  <span className="flex items-center gap-1">FIR: {selectedCase.firNumber}</span>
                )}
                <span className="flex items-center gap-1"><User className="h-3 w-3" />{selectedCase.client}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{selectedCase.court}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" className="text-xs font-sans h-8 gap-1.5 border-border/50" onClick={handleOpenEdit}>
                <Edit className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button variant="outline" size="sm" className="text-xs font-sans h-8 gap-1.5 border-border/50 text-destructive hover:bg-destructive/10" onClick={handleArchiveCase} disabled={archivingCase}>
                <Trash2 className="h-3.5 w-3.5" /> {archivingCase ? 'Archiving...' : 'Archive'}
              </Button>
            </div>
          </div>
        </div>

        {/* Status Pipeline */}
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 font-sans">Case Pipeline</p>
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {pipelineStages.map((stage, i) => {
                const isActive = i === currentStageIndex;
                const isPast = i < currentStageIndex;
                return (
                  <div key={stage.label} className="flex items-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleTransitionStatus(stage.status)}
                      title={`Click to transition status to ${stage.label}`}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-sans font-medium transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20'
                          : isPast
                            ? 'bg-success/10 text-success hover:bg-success/20'
                            : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {isPast ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : isActive ? (
                        <CircleDot className="h-3.5 w-3.5 animate-pulse" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 opacity-60" />
                      )}
                      {stage.label}
                    </button>
                    {i < pipelineStages.length - 1 && (
                      <ChevronRight className={`h-3.5 w-3.5 mx-0.5 shrink-0 ${isPast ? 'text-success/50' : 'text-border'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Case Info Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Judge', value: selectedCase.judge, icon: Gavel },
            { label: 'Opposing Counsel', value: selectedCase.opposingCounsel, icon: User },
            { label: 'Next Hearing', value: selectedCase.nextHearing, icon: Calendar },
            { label: 'Filed Date', value: selectedCase.filedDate, icon: Clock },
          ].map(item => (
            <Card key={item.label} className="border-border/50 shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider">{item.label}</span>
                </div>
                <p className="text-xs font-medium font-sans text-foreground leading-snug">{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Description */}
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 font-sans">Case Summary</p>
            <p className="text-sm text-foreground/80 font-sans leading-relaxed">{selectedCase.description}</p>
          </CardContent>
        </Card>

        {/* Linked Cases */}
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider font-sans flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5 text-primary" /> Linked Cases
              </p>
              <Button type="button" variant="outline" size="sm" className="text-[11px] font-sans h-7 gap-1 border-border/50" onClick={() => setShowLinkCase(true)}>
                <Plus className="h-3 w-3" /> Link Case
              </Button>
            </div>
            {selectedCase.linkedCases && selectedCase.linkedCases.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedCase.linkedCases.map(linkedId => {
                  const linked = caseList.find(c => c.id === linkedId) || cases.find(c => c.id === linkedId);
                  if (!linked) return null;
                  return (
                    <button
                      key={linkedId}
                      onClick={() => { setSelectedCase(linked); setDetailTab('timeline'); }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all text-left"
                    >
                      <GitBranch className="h-3.5 w-3.5 text-primary" />
                      <div>
                        <p className="text-xs font-medium font-sans text-foreground">{linked.title}</p>
                        <p className="text-[10px] text-muted-foreground font-sans">{linked.id} · {linked.court}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4 border border-dashed border-border/60 rounded-lg">
                <p className="text-xs text-muted-foreground font-sans">No related files linked to this case record.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detail Tabs */}
        <Tabs value={detailTab} onValueChange={setDetailTab}>
          <TabsList className="bg-secondary/50 h-9">
            <TabsTrigger value="timeline" className="text-xs font-sans h-7 gap-1.5">
              <Clock className="h-3 w-3" /> Timeline
            </TabsTrigger>
            <TabsTrigger value="documents" className="text-xs font-sans h-7 gap-1.5">
              <FileText className="h-3 w-3" /> Documents ({selectedCase.documents.length})
            </TabsTrigger>
            <TabsTrigger value="notes" className="text-xs font-sans h-7 gap-1.5">
              <MessageSquare className="h-3 w-3" /> Notes ({selectedCase.notes.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={detailTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {/* Timeline */}
            {detailTab === 'timeline' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <Button size="sm" className="bg-gradient-primary text-xs font-sans gap-1.5 h-8" onClick={() => setShowAddEvent(true)}>
                    <Plus className="h-3.5 w-3.5" /> Add Event
                  </Button>
                </div>
                {selectedCase.timeline.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground font-sans border border-dashed rounded-lg">
                    No timeline history found. Start by adding key events.
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border" />
                    <div className="space-y-0">
                      {selectedCase.timeline.map((event, i) => {
                        const Icon = timelineIcon[event.type] || Clock;
                        return (
                          <div key={event.id} className="relative flex gap-4 pb-5">
                            <div className={`relative z-10 h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${timelineColor[event.type]}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="pt-1 min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium font-sans text-foreground">{event.title}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-muted-foreground font-sans whitespace-nowrap">{event.date}</span>
                                  <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteEvent(event.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-[11px] text-muted-foreground font-sans mt-0.5 leading-relaxed">{event.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Documents */}
            {detailTab === 'documents' && (
              <div className="space-y-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleUploadDocument}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
                <div className="flex justify-end">
                  <Button size="sm" className="bg-gradient-primary text-xs font-sans gap-1.5 h-8" onClick={handleUploadDocumentClick} disabled={uploadingDoc}>
                    {uploadingDoc ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Upload Document
                  </Button>
                </div>
                {selectedCase.documents.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground font-sans border border-dashed rounded-lg">
                    No documents uploaded. Click upload to store files securely in this case.
                  </div>
                ) : (
                  selectedCase.documents.map(doc => (
                    <Card key={doc.id} className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-sm font-medium font-sans text-foreground truncate">{doc.name}</p>
                              </div>
                              <p className="text-[10px] text-muted-foreground font-sans mt-0.5">
                                {doc.size} · Uploaded {doc.uploadedAt}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Badge variant="secondary" className="text-[9px] font-sans">{doc.type}</Badge>
                            {doc.url && (
                              <div className="flex gap-1">
                                <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                  <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                                </a>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownloadDoc(doc.url, doc.name)}>
                                  <Download className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Notes */}
            {detailTab === 'notes' && (
              <div className="space-y-4">
                {/* Add Note */}
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 font-sans">Add Internal Note</p>
                    <Textarea
                      placeholder="Write a private note about this case..."
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      className="text-sm font-sans min-h-[80px] bg-secondary/30 border-border/50 resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <Button size="sm" className="bg-gradient-primary text-xs font-sans gap-1.5 h-8" onClick={handleAddNote} disabled={savingNote || !newNote.trim()}>
                        {savingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Save Note
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Existing Notes */}
                {selectedCase.notes.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground font-sans border border-dashed rounded-lg">
                    No notes recorded yet.
                  </div>
                ) : (
                  selectedCase.notes.map(note => (
                    <Card key={note.id} className="border-border/50 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-3 w-3 text-primary" />
                            </div>
                            <span className="text-xs font-semibold font-sans text-foreground">{note.author}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground font-sans">{note.date}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteNote(note.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-foreground/80 font-sans leading-relaxed">{note.content}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        </motion.div>
      ) : (
        <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold font-sans text-foreground">Case Management</h2>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">
            {caseList.length} total cases · {caseList.filter(c => c.status === 'Active').length} active · {caseList.filter(c => c.priority === 'Critical').length} critical
          </p>
        </div>
        <Button
          size="sm"
          className="bg-gradient-primary font-sans text-xs gap-1.5 h-9"
          onClick={() => setShowNewCase(true)}
        >
          <Plus className="h-3.5 w-3.5" /> New Case
        </Button>
      </div>

      {/* Pipeline Summary */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-4">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 font-sans">Status Pipeline</p>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
            {pipelineStages.map(stage => {
              const count = caseList.filter(c => c.status === stage.status).length;
              return (
                <button
                  key={stage.label}
                  onClick={() => setActiveTab(stage.status.toLowerCase())}
                  className={`p-2.5 rounded-lg text-center transition-all border ${
                    activeTab === stage.status.toLowerCase()
                      ? 'bg-primary/10 border-primary/30 shadow-sm'
                      : 'bg-secondary/30 border-border/20 hover:border-border/50'
                  }`}
                >
                  <p className="text-lg font-bold font-sans text-foreground">{count}</p>
                  <p className="text-[10px] text-muted-foreground font-sans">{stage.label}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by case, client, court, judge..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm font-sans bg-card border-border/50"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          className="h-9 font-sans text-xs gap-1.5 border-border/50"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-3.5 w-3.5" /> Filters {(filterCourt !== 'All Courts' || filterType !== 'All Types') && '•'}
        </Button>
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-sans text-muted-foreground uppercase tracking-wider">Court</Label>
                    <Select value={filterCourt} onValueChange={setFilterCourt}>
                      <SelectTrigger className="h-9 text-xs font-sans">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {courtTypes.map(c => (
                          <SelectItem key={c} value={c} className="text-xs font-sans">{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-sans text-muted-foreground uppercase tracking-wider">Case Type</Label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="h-9 text-xs font-sans">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {caseTypes.map(t => (
                          <SelectItem key={t} value={t} className="text-xs font-sans">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs font-sans h-9"
                      onClick={() => { setFilterCourt('All Courts'); setFilterType('All Types'); }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-secondary/50 h-9 flex-wrap">
          <TabsTrigger value="all" className="text-xs font-sans h-7">All Cases</TabsTrigger>
          <TabsTrigger value="active" className="text-xs font-sans h-7">Active</TabsTrigger>
          <TabsTrigger value="discovery" className="text-xs font-sans h-7">Discovery</TabsTrigger>
          <TabsTrigger value="appeal" className="text-xs font-sans h-7">Appeal</TabsTrigger>
          <TabsTrigger value="negotiation" className="text-xs font-sans h-7">Negotiation</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Cases List */}
      <div className="space-y-3">
        {filteredCases.length === 0 ? (
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-8 text-center">
              <Briefcase className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-sans text-muted-foreground">No cases match your filters</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-xs font-sans"
                onClick={() => { setActiveTab('all'); setSearchQuery(''); setFilterCourt('All Courts'); setFilterType('All Types'); }}
              >
                Clear all filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredCases.map(c => (
            <Card
              key={c.id}
              className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
              onClick={() => { loadCaseDetails(c.id); setDetailTab('timeline'); }}
            >
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      c.priority === 'Critical'
                        ? 'bg-destructive/10 group-hover:bg-destructive/15'
                        : 'bg-secondary group-hover:bg-primary/10'
                    }`}>
                      <Briefcase className={`h-4 w-4 transition-colors ${
                        c.priority === 'Critical'
                          ? 'text-destructive'
                          : 'text-muted-foreground group-hover:text-primary'
                      }`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold font-sans text-foreground">{c.title}</p>
                        <span className="text-[10px] text-muted-foreground font-mono">{c.id}</span>
                        {c.linkedCases.length > 0 && (
                          <span className="flex items-center gap-0.5 text-[9px] text-primary font-sans">
                            <Link2 className="h-3 w-3" /> {c.linkedCases.length} linked
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-[11px] text-muted-foreground font-sans">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" />{c.client}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{c.court}</span>
                        <span className="flex items-center gap-1"><Gavel className="h-3 w-3" />{c.judge}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Next: {c.nextHearing}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={`text-[10px] font-sans ${priorityColor[c.priority]}`}>{c.priority}</Badge>
                    <Badge variant="outline" className={`text-[10px] font-sans ${statusColor[c.status]}`}>{c.status}</Badge>
                    <Badge variant="secondary" className="text-[10px] font-sans">{c.stage}</Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      </div>
      )}

      {/* New Case Dialog */}
      <Dialog open={showNewCase} onOpenChange={setShowNewCase}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-sans">Create New Case</DialogTitle>
            <DialogDescription className="text-xs font-sans text-muted-foreground">
              Fill in the case details below. Fields marked * are required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Case Title *</Label>
              <Input value={newCaseData.title} onChange={e => setNewCaseData({...newCaseData, title: e.target.value})} placeholder="e.g., Ahmed v. State Bank of Pakistan" className="h-9 text-sm font-sans" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Case Number *</Label>
                <Input value={newCaseData.caseNumber} onChange={e => setNewCaseData({...newCaseData, caseNumber: e.target.value})} placeholder="e.g., WP No. 12345/2024" className="h-9 text-sm font-sans" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">FIR Number</Label>
                <Input value={newCaseData.firNumber} onChange={e => setNewCaseData({...newCaseData, firNumber: e.target.value})} placeholder="Optional" className="h-9 text-sm font-sans" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Client Name *</Label>
              {clients.length > 0 ? (
                <Select
                  value={newCaseData.clientId}
                  onValueChange={val => {
                    const matched = clients.find(cl => cl.id === val);
                    setNewCaseData({
                      ...newCaseData,
                      clientId: val,
                      client: matched ? matched.fullName || matched.name : ''
                    });
                  }}
                >
                  <SelectTrigger className="h-9 text-xs font-sans bg-card border-border/50">
                    <SelectValue placeholder="Select existing client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(cl => (
                      <SelectItem key={cl.id} value={cl.id} className="text-xs font-sans">
                        {cl.fullName || cl.name} ({cl.email || 'No email'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={newCaseData.client} onChange={e => setNewCaseData({...newCaseData, client: e.target.value})} placeholder="Client or company name" className="h-9 text-sm font-sans" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Court *</Label>
                <Select value={newCaseData.court} onValueChange={val => setNewCaseData({...newCaseData, court: val})}>
                  <SelectTrigger className="h-9 text-xs font-sans">
                    <SelectValue placeholder="Select court" />
                  </SelectTrigger>
                  <SelectContent>
                    {courtTypes.filter(c => c !== 'All Courts').map(c => (
                      <SelectItem key={c} value={c} className="text-xs font-sans">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Case Type *</Label>
                <Select value={newCaseData.type} onValueChange={val => setNewCaseData({...newCaseData, type: val})}>
                  <SelectTrigger className="h-9 text-xs font-sans">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {caseTypes.filter(t => t !== 'All Types').map(t => (
                      <SelectItem key={t} value={t} className="text-xs font-sans">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Assigned Judge</Label>
                <Input value={newCaseData.judge} onChange={e => setNewCaseData({...newCaseData, judge: e.target.value})} placeholder="Judge name" className="h-9 text-sm font-sans" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Opposing Counsel</Label>
                <Input value={newCaseData.opposingCounsel} onChange={e => setNewCaseData({...newCaseData, opposingCounsel: e.target.value})} placeholder="Counsel name" className="h-9 text-sm font-sans" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Priority</Label>
                <Select value={newCaseData.priority} onValueChange={val => setNewCaseData({...newCaseData, priority: val})}>
                  <SelectTrigger className="h-9 text-xs font-sans">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Low', 'Medium', 'High', 'Critical'].map(p => (
                      <SelectItem key={p} value={p} className="text-xs font-sans">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Next Hearing Date</Label>
                <div className="h-9 px-3 rounded-md border border-border bg-muted flex items-center text-xs font-sans text-muted-foreground leading-snug">
                  Derived dynamically from scheduled hearings.
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Case Description</Label>
              <Textarea value={newCaseData.description} onChange={e => setNewCaseData({...newCaseData, description: e.target.value})} placeholder="Brief summary of the case..." className="text-sm font-sans min-h-[80px] resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="font-sans text-xs" onClick={() => setShowNewCase(false)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-gradient-primary font-sans text-xs gap-1.5" onClick={handleAddCase} disabled={addingCase || !newCaseData.title || !newCaseData.caseNumber || !newCaseData.client}>
              {addingCase ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Create Case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Case Dialog */}
      <Dialog open={showEditCase} onOpenChange={setShowEditCase}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-sans">Edit Case Details</DialogTitle>
            <DialogDescription className="text-xs font-sans text-muted-foreground">
              Modify the case details and parameters below.
            </DialogDescription>
          </DialogHeader>
          {editCaseData && (
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Case Title *</Label>
                <Input value={editCaseData.title} onChange={e => setEditCaseData({...editCaseData, title: e.target.value})} className="h-9 text-sm font-sans" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-sans">Case Number *</Label>
                  <Input value={editCaseData.caseNumber} onChange={e => setEditCaseData({...editCaseData, caseNumber: e.target.value})} className="h-9 text-sm font-sans" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-sans">FIR Number</Label>
                  <Input value={editCaseData.firNumber} onChange={e => setEditCaseData({...editCaseData, firNumber: e.target.value})} className="h-9 text-sm font-sans" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Client Name *</Label>
                <Input value={editCaseData.clientNameRaw} onChange={e => setEditCaseData({...editCaseData, clientNameRaw: e.target.value})} className="h-9 text-sm font-sans" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-sans">Court *</Label>
                  <Select value={editCaseData.courtName} onValueChange={val => setEditCaseData({...editCaseData, courtName: val})}>
                    <SelectTrigger className="h-9 text-xs font-sans">
                      <SelectValue placeholder="Select court" />
                    </SelectTrigger>
                    <SelectContent>
                      {(editCaseData.courtName && !courtTypes.filter(c => c !== 'All Courts').includes(editCaseData.courtName)
                        ? [editCaseData.courtName, ...courtTypes.filter(c => c !== 'All Courts')]
                        : courtTypes.filter(c => c !== 'All Courts')).map(c => (
                        <SelectItem key={c} value={c} className="text-xs font-sans">{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-sans">Case Type *</Label>
                  <Select value={editCaseData.caseType} onValueChange={val => setEditCaseData({...editCaseData, caseType: val})}>
                    <SelectTrigger className="h-9 text-xs font-sans">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {caseTypes.filter(t => t !== 'All Types').map(t => (
                        <SelectItem key={t} value={t} className="text-xs font-sans">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-sans">Assigned Judge</Label>
                  <Input value={editCaseData.judgeName} onChange={e => setEditCaseData({...editCaseData, judgeName: e.target.value})} className="h-9 text-sm font-sans" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-sans">Opposing Counsel</Label>
                  <Input value={editCaseData.opposingCounsel} onChange={e => setEditCaseData({...editCaseData, opposingCounsel: e.target.value})} className="h-9 text-sm font-sans" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-sans">Priority</Label>
                  <Select value={editCaseData.priority} onValueChange={val => setEditCaseData({...editCaseData, priority: val})}>
                    <SelectTrigger className="h-9 text-xs font-sans">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['Low', 'Medium', 'High', 'Critical'].map(p => (
                        <SelectItem key={p} value={p} className="text-xs font-sans">{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-sans">Status</Label>
                  <Select
                    value={editCaseData.status}
                    onValueChange={(val: CaseStatus) => {
                      const currentStatus = selectedCase?.status || editCaseData.status;
                      if (!isTransitionAllowed(currentStatus, val)) {
                        toast({
                          title: "Transition Blocked",
                          description: `Cannot transition directly from "${currentStatus}" to "${val}" per legal matrix.`,
                          variant: "destructive"
                        });
                        return;
                      }
                      setEditCaseData({...editCaseData, status: val});
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs font-sans">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pipelineStages.map(s => (
                        <SelectItem key={s.status} value={s.status} className="text-xs font-sans">{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-sans">Next Hearing Date</Label>
                  <div className="h-9 px-3 rounded-md border border-border bg-muted flex items-center justify-between text-xs font-sans text-muted-foreground">
                    <span className="truncate">{editCaseData.nextDate ? new Date(editCaseData.nextDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No hearing scheduled'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditCase(false);
                        setCameFromEdit(true);
                        setNewEventData({
                          eventType: 'Hearing',
                          title: 'Next hearing scheduled',
                          description: 'Enter courtroom and judge instructions...',
                          eventDate: new Date().toISOString().split('T')[0],
                          attachmentId: ''
                        });
                        setShowAddEvent(true);
                      }}
                      className="text-primary hover:underline font-medium text-[11px] shrink-0"
                    >
                      [Schedule new]
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-sans">Filed Date</Label>
                  <Input type="date" value={editCaseData.filedDate} onChange={e => setEditCaseData({...editCaseData, filedDate: e.target.value})} className="h-9 text-sm font-sans" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Case Description</Label>
                <Textarea value={editCaseData.description} onChange={e => setEditCaseData({...editCaseData, description: e.target.value})} className="text-sm font-sans min-h-[80px] resize-none" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" className="font-sans text-xs" onClick={() => setShowEditCase(false)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-gradient-primary font-sans text-xs gap-1.5" onClick={handleUpdateCase} disabled={updatingCase}>
              {updatingCase ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Event Dialog */}
      <Dialog open={showAddEvent} onOpenChange={handleAddEventOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-sans">Add Key Case Event</DialogTitle>
            <DialogDescription className="text-xs font-sans text-muted-foreground">
              Add a new milestone, hearing, filing, or order to the case timeline.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Event Type</Label>
              <Select value={newEventData.eventType} onValueChange={val => setNewEventData({...newEventData, eventType: val})}>
                <SelectTrigger className="h-9 text-xs font-sans">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['Hearing', 'Order', 'Filing', 'Adjournment', 'Document', 'Note'].map(type => (
                    <SelectItem key={type} value={type} className="text-xs font-sans">{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Event Title *</Label>
              <Input value={newEventData.title} onChange={e => setNewEventData({...newEventData, title: e.target.value})} placeholder="e.g. Interim injunction argued" className="h-9 text-sm font-sans" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Event Date *</Label>
              <Input type="date" value={newEventData.eventDate} onChange={e => setNewEventData({...newEventData, eventDate: e.target.value})} className="h-9 text-sm font-sans" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Event Description</Label>
              <Textarea value={newEventData.description} onChange={e => setNewEventData({...newEventData, description: e.target.value})} placeholder="Describe details of this milestone..." className="text-sm font-sans min-h-[80px] resize-none" />
            </div>
            {selectedCase?.documents && selectedCase.documents.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Link Case Document (Optional)</Label>
                <Select value={newEventData.attachmentId || "none"} onValueChange={val => setNewEventData({...newEventData, attachmentId: val === "none" ? "" : val})}>
                  <SelectTrigger className="h-9 text-xs font-sans">
                    <SelectValue placeholder="Select associated document..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs font-sans">None</SelectItem>
                    {selectedCase.documents.map((doc: any) => (
                      <SelectItem key={doc.id} value={doc.id.toString()} className="text-xs font-sans">{doc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="font-sans text-xs" onClick={() => handleAddEventOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" className="bg-gradient-primary font-sans text-xs gap-1.5" onClick={handleAddEvent} disabled={addingEvent || !newEventData.title}>
              {addingEvent ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} Add Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Case Modal */}
      <Dialog open={showLinkCase} onOpenChange={setShowLinkCase}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-sans flex items-center gap-1.5">
              <Link2 className="h-4.5 w-4.5 text-primary" /> Link Related Case
            </DialogTitle>
            <DialogDescription className="text-xs font-sans text-muted-foreground">
              Establish a connection between this case file and another active record in your firm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Search Cases *</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Type to search case name or number..."
                  value={linkSearch}
                  onChange={e => {
                    setLinkSearch(e.target.value);
                    setLinkTargetId('');
                  }}
                  className="pl-8 h-9 text-xs font-sans"
                />
              </div>
              {linkSearch.trim() && (
                <div className="mt-1 border border-border/80 rounded-md max-h-32 overflow-y-auto bg-card shadow-sm divide-y">
                  {caseList
                    .filter(c =>
                      c.id !== selectedCase?.id &&
                      (c.title.toLowerCase().includes(linkSearch.toLowerCase()) ||
                       c.caseNumber.toLowerCase().includes(linkSearch.toLowerCase()))
                    )
                    .map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setLinkTargetId(c.id);
                          setLinkSearch(c.title);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-sans hover:bg-primary/5 transition-colors flex justify-between"
                      >
                        <span className="font-medium text-foreground truncate mr-2">{c.title}</span>
                        <span className="text-muted-foreground shrink-0 font-mono text-[10px]">{c.caseNumber}</span>
                      </button>
                    ))}
                </div>
              )}
              {linkTargetId && (
                <div className="p-2 mt-1 rounded bg-primary/5 border border-primary/20 text-xs font-sans text-foreground flex items-center justify-between">
                  <span>Selected: <span className="font-semibold">{caseList.find(c => c.id === linkTargetId)?.title}</span></span>
                  <Badge variant="outline" className="text-[9px] font-mono shrink-0">{linkTargetId.slice(0, 8)}...</Badge>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Relationship Type *</Label>
              <Select value={linkRelationship} onValueChange={(val: any) => setLinkRelationship(val)}>
                <SelectTrigger className="h-9 text-xs font-sans">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    { value: 'related', label: 'Related Case' },
                    { value: 'parent', label: 'Parent Case' },
                    { value: 'child', label: 'Child Case' },
                    { value: 'appeal_of', label: 'Appeal of' },
                    { value: 'consolidated_with', label: 'Consolidated with' },
                    { value: 'cross_suit', label: 'Cross Suit' }
                  ].map(item => (
                    <SelectItem key={item.value} value={item.value} className="text-xs font-sans">{item.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Connection Note (Optional)</Label>
              <Textarea
                placeholder="e.g. Challenging identical notification issued by FBR..."
                value={linkNote}
                onChange={e => setLinkNote(e.target.value)}
                className="text-xs font-sans min-h-[70px] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="font-sans text-xs" onClick={() => setShowLinkCase(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-gradient-primary font-sans text-xs gap-1.5"
              onClick={handleLinkCaseSubmit}
              disabled={linkingCase || !linkTargetId}
            >
              {linkingCase ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />} Link Files
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
