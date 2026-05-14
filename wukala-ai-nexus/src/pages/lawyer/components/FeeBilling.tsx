import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  DollarSign, Plus, TrendingUp, Clock, CheckCircle2, AlertCircle,
  Receipt, Download, Eye, Send, Printer, FileText, Wallet,
  CreditCard, ArrowLeft, Calendar, Users, Search, Filter,
  BarChart3, RefreshCw, BanknoteIcon, Briefcase, X, ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ──────────────────────────────────────────────────────
interface InvoiceItem {
  description: string;
  hours: number;
  rate: number;
  amount: number;
}

interface Invoice {
  id: string;
  client: string;
  caseRef: string;
  items: InvoiceItem[];
  amount: string;
  amountNum: number;
  date: string;
  due: string;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Draft' | 'Partially Paid';
  paymentMethod?: string;
  paidDate?: string;
  paidAmount?: number;
  notes?: string;
}

interface Retainer {
  id: string;
  client: string;
  totalAmount: number;
  usedAmount: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Expiring' | 'Exhausted' | 'Expired';
  billingCycle: string;
}

interface BillingTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  items: InvoiceItem[];
  usageCount: number;
  lastUsed: string;
}

interface Payment {
  id: string;
  invoiceId: string;
  client: string;
  amount: number;
  date: string;
  method: string;
  reference: string;
  status: 'Completed' | 'Processing' | 'Failed';
}

// ── Data ───────────────────────────────────────────────────────
const invoices: Invoice[] = [
  { id: 'INV-2024-034', client: 'Khan Industries Ltd.', caseRef: 'CASE-2024-011', items: [
    { description: 'Court Appearance — Session Court', hours: 4, rate: 50000, amount: 200000 },
    { description: 'Legal Research & Brief Preparation', hours: 10, rate: 15000, amount: 150000 },
    { description: 'Client Meetings & Consultations', hours: 4, rate: 25000, amount: 100000 },
  ], amount: '₨ 450,000', amountNum: 450000, date: 'Mar 10, 2024', due: 'Mar 25, 2024', status: 'Paid', paidDate: 'Mar 22, 2024', paymentMethod: 'Bank Transfer', paidAmount: 450000 },
  { id: 'INV-2024-033', client: 'Noor Enterprises', caseRef: 'CASE-2024-009', items: [
    { description: 'Contract Drafting', hours: 8, rate: 20000, amount: 160000 },
    { description: 'Negotiations & Review', hours: 6, rate: 20000, amount: 120000 },
  ], amount: '₨ 280,000', amountNum: 280000, date: 'Mar 8, 2024', due: 'Mar 23, 2024', status: 'Pending', notes: 'Payment reminder sent on Mar 18' },
  { id: 'INV-2024-032', client: 'Fatima Enterprises', caseRef: 'CASE-2024-007', items: [
    { description: 'Property Dispute Hearing', hours: 3, rate: 40000, amount: 120000 },
    { description: 'Document Review', hours: 5, rate: 11000, amount: 55000 },
  ], amount: '₨ 175,000', amountNum: 175000, date: 'Mar 5, 2024', due: 'Mar 20, 2024', status: 'Overdue' },
  { id: 'INV-2024-031', client: 'Islamabad Realty Corp.', caseRef: 'CASE-2024-005', items: [
    { description: 'Real Estate Transaction Advisory', hours: 12, rate: 25000, amount: 300000 },
    { description: 'Title Search & Verification', hours: 8, rate: 15000, amount: 120000 },
    { description: 'Filing Fees & Court Costs', hours: 0, rate: 100000, amount: 100000 },
  ], amount: '₨ 520,000', amountNum: 520000, date: 'Mar 1, 2024', due: 'Mar 15, 2024', status: 'Paid', paidDate: 'Mar 12, 2024', paymentMethod: 'Cheque', paidAmount: 520000 },
  { id: 'INV-2024-030', client: 'Pakistan Workers Union', caseRef: 'CASE-2024-003', items: [
    { description: 'Labour Law Consultation', hours: 5, rate: 19000, amount: 95000 },
  ], amount: '₨ 95,000', amountNum: 95000, date: 'Feb 28, 2024', due: 'Mar 14, 2024', status: 'Paid', paidDate: 'Mar 10, 2024', paymentMethod: 'Online Transfer', paidAmount: 95000 },
  { id: 'INV-2024-029', client: 'Ali Raza', caseRef: 'CASE-2024-002', items: [
    { description: 'Criminal Defence Hearing', hours: 6, rate: 35000, amount: 210000 },
    { description: 'Bail Application Filing', hours: 2, rate: 25000, amount: 50000 },
  ], amount: '₨ 260,000', amountNum: 260000, date: 'Feb 25, 2024', due: 'Mar 10, 2024', status: 'Partially Paid', paidAmount: 150000, paymentMethod: 'Cash' },
];

const retainers: Retainer[] = [
  { id: 'RET-001', client: 'Khan Industries Ltd.', totalAmount: 2400000, usedAmount: 1800000, startDate: 'Jan 1, 2024', endDate: 'Dec 31, 2024', status: 'Active', billingCycle: 'Monthly' },
  { id: 'RET-002', client: 'Islamabad Realty Corp.', totalAmount: 1200000, usedAmount: 1100000, startDate: 'Feb 1, 2024', endDate: 'Jul 31, 2024', status: 'Expiring', billingCycle: 'Quarterly' },
  { id: 'RET-003', client: 'Noor Enterprises', totalAmount: 600000, usedAmount: 600000, startDate: 'Jan 15, 2024', endDate: 'Jun 30, 2024', status: 'Exhausted', billingCycle: 'Monthly' },
  { id: 'RET-004', client: 'Fatima Enterprises', totalAmount: 480000, usedAmount: 120000, startDate: 'Mar 1, 2024', endDate: 'Aug 31, 2024', status: 'Active', billingCycle: 'Monthly' },
];

const billingTemplates: BillingTemplate[] = [
  { id: 'TPL-001', name: 'Standard Litigation Invoice', category: 'Litigation', description: 'Court appearances, research, and filing fees', items: [
    { description: 'Court Appearance', hours: 0, rate: 50000, amount: 0 },
    { description: 'Legal Research', hours: 0, rate: 15000, amount: 0 },
    { description: 'Filing Fees', hours: 0, rate: 5000, amount: 0 },
  ], usageCount: 45, lastUsed: 'Mar 10, 2024' },
  { id: 'TPL-002', name: 'Corporate Advisory', category: 'Corporate', description: 'Consultations, contract review, and compliance', items: [
    { description: 'Advisory Consultation', hours: 0, rate: 25000, amount: 0 },
    { description: 'Contract Review', hours: 0, rate: 20000, amount: 0 },
    { description: 'Compliance Check', hours: 0, rate: 18000, amount: 0 },
  ], usageCount: 32, lastUsed: 'Mar 8, 2024' },
  { id: 'TPL-003', name: 'Property Transaction', category: 'Real Estate', description: 'Title search, registration, and transfer', items: [
    { description: 'Title Search & Verification', hours: 0, rate: 15000, amount: 0 },
    { description: 'Registration Assistance', hours: 0, rate: 30000, amount: 0 },
    { description: 'Transfer Documentation', hours: 0, rate: 25000, amount: 0 },
  ], usageCount: 18, lastUsed: 'Mar 1, 2024' },
  { id: 'TPL-004', name: 'Criminal Defence Package', category: 'Criminal', description: 'Bail, hearing, and appeal', items: [
    { description: 'Bail Application', hours: 0, rate: 25000, amount: 0 },
    { description: 'Court Hearing', hours: 0, rate: 40000, amount: 0 },
    { description: 'Appeal Brief', hours: 0, rate: 35000, amount: 0 },
  ], usageCount: 27, lastUsed: 'Feb 25, 2024' },
  { id: 'TPL-005', name: 'Labour Law Retainer', category: 'Labour', description: 'Monthly retainer billing for labour law clients', items: [
    { description: 'Monthly Retainer Fee', hours: 0, rate: 80000, amount: 0 },
    { description: 'Additional Consultation', hours: 0, rate: 15000, amount: 0 },
  ], usageCount: 12, lastUsed: 'Feb 28, 2024' },
];

const payments: Payment[] = [
  { id: 'PAY-001', invoiceId: 'INV-2024-034', client: 'Khan Industries Ltd.', amount: 450000, date: 'Mar 22, 2024', method: 'Bank Transfer', reference: 'TXN-88291', status: 'Completed' },
  { id: 'PAY-002', invoiceId: 'INV-2024-031', client: 'Islamabad Realty Corp.', amount: 520000, date: 'Mar 12, 2024', method: 'Cheque', reference: 'CHQ-45120', status: 'Completed' },
  { id: 'PAY-003', invoiceId: 'INV-2024-030', client: 'Pakistan Workers Union', amount: 95000, date: 'Mar 10, 2024', method: 'Online Transfer', reference: 'TXN-77432', status: 'Completed' },
  { id: 'PAY-004', invoiceId: 'INV-2024-029', client: 'Ali Raza', amount: 150000, date: 'Mar 5, 2024', method: 'Cash', reference: 'RCP-1001', status: 'Completed' },
];

// ── Styles ─────────────────────────────────────────────────────
const statusStyle: Record<string, string> = {
  Paid: 'bg-success/10 text-success border-success/20',
  Pending: 'bg-gold/10 text-gold border-gold/20',
  Overdue: 'bg-destructive/10 text-destructive border-destructive/20',
  Draft: 'bg-muted text-muted-foreground border-border',
  'Partially Paid': 'bg-primary/10 text-primary border-primary/20',
  Active: 'bg-success/10 text-success border-success/20',
  Expiring: 'bg-gold/10 text-gold border-gold/20',
  Exhausted: 'bg-destructive/10 text-destructive border-destructive/20',
  Expired: 'bg-muted text-muted-foreground border-border',
  Completed: 'bg-success/10 text-success border-success/20',
  Processing: 'bg-gold/10 text-gold border-gold/20',
  Failed: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusIcon: Record<string, typeof CheckCircle2> = {
  Paid: CheckCircle2,
  Pending: Clock,
  Overdue: AlertCircle,
  Draft: FileText,
  'Partially Paid': RefreshCw,
};

type MainTab = 'invoices' | 'payments' | 'retainers' | 'templates';
type View = 'list' | 'invoice-detail' | 'retainer-detail' | 'template-detail';

export default function FeeBilling() {
  const [mainTab, setMainTab] = useState<MainTab>('invoices');
  const [invoiceFilter, setInvoiceFilter] = useState('all');
  const [view, setView] = useState<View>('list');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedRetainer, setSelectedRetainer] = useState<Retainer | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<BillingTemplate | null>(null);
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInvoices = invoices.filter(i => {
    const matchesFilter = invoiceFilter === 'all' || i.status.toLowerCase().replace(' ', '-') === invoiceFilter;
    const matchesSearch = !searchQuery || i.client.toLowerCase().includes(searchQuery.toLowerCase()) || i.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + i.amountNum, 0);
  const outstanding = invoices.filter(i => i.status === 'Pending' || i.status === 'Partially Paid').reduce((s, i) => s + (i.amountNum - (i.paidAmount || 0)), 0);
  const overdue = invoices.filter(i => i.status === 'Overdue').reduce((s, i) => s + i.amountNum, 0);

  const openInvoice = (inv: Invoice) => { setSelectedInvoice(inv); setView('invoice-detail'); };
  const openRetainer = (r: Retainer) => { setSelectedRetainer(r); setView('retainer-detail'); };
  const openTemplate = (t: BillingTemplate) => { setSelectedTemplate(t); setView('template-detail'); };
  const goBack = () => { setView('list'); setSelectedInvoice(null); setSelectedRetainer(null); setSelectedTemplate(null); };

  const formatPKR = (n: number) => `₨ ${n.toLocaleString()}`;

  // ── Detail Views ──
  if (view === 'invoice-detail' && selectedInvoice) {
    const inv = selectedInvoice;
    const Icon = statusIcon[inv.status] || Receipt;
    const subtotal = inv.items.reduce((s, it) => s + it.amount, 0);
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack} className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold font-sans text-foreground">{inv.id}</h2>
            <p className="text-xs text-muted-foreground font-sans">{inv.client}</p>
          </div>
          <Badge variant="outline" className={`text-[10px] font-sans gap-1 ${statusStyle[inv.status]}`}>
            <Icon className="h-3 w-3" />{inv.status}
          </Badge>
        </div>

        {/* Invoice Meta */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Invoice Date', value: inv.date, icon: Calendar },
            { label: 'Due Date', value: inv.due, icon: Clock },
            { label: 'Case Reference', value: inv.caseRef, icon: Briefcase },
            { label: 'Payment Method', value: inv.paymentMethod || '—', icon: CreditCard },
          ].map(m => (
            <Card key={m.label} className="border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <m.icon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-sans">{m.label}</span>
                </div>
                <p className="text-xs font-semibold font-sans text-foreground">{m.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Line Items */}
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="p-4 border-b border-border/50">
              <h3 className="text-sm font-semibold font-sans text-foreground">Line Items</h3>
            </div>
            <div className="divide-y divide-border/50">
              {inv.items.map((item, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium font-sans text-foreground">{item.description}</p>
                    {item.hours > 0 && (
                      <p className="text-[10px] text-muted-foreground font-sans mt-0.5">
                        {item.hours} hrs × {formatPKR(item.rate)}/hr
                      </p>
                    )}
                  </div>
                  <p className="text-xs font-bold font-sans text-foreground shrink-0">{formatPKR(item.amount)}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-border/50 bg-secondary/30">
              <div className="flex justify-between text-xs font-sans mb-1">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-foreground">{formatPKR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs font-sans mb-1">
                <span className="text-muted-foreground">Tax (0%)</span>
                <span className="text-foreground">₨ 0</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between text-sm font-sans">
                <span className="font-semibold text-foreground">Total</span>
                <span className="font-bold text-foreground">{formatPKR(subtotal)}</span>
              </div>
              {inv.status === 'Partially Paid' && inv.paidAmount && (
                <>
                  <div className="flex justify-between text-xs font-sans mt-2">
                    <span className="text-success">Paid</span>
                    <span className="text-success font-semibold">{formatPKR(inv.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-sans">
                    <span className="text-destructive">Balance Due</span>
                    <span className="text-destructive font-semibold">{formatPKR(subtotal - inv.paidAmount)}</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Info */}
        {inv.paidDate && (
          <Card className="border-success/20 bg-success/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span className="text-xs font-semibold font-sans text-success">Payment Received</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-sans text-muted-foreground">
                <div><span className="block text-[10px]">Date</span>{inv.paidDate}</div>
                <div><span className="block text-[10px]">Method</span>{inv.paymentMethod}</div>
                <div><span className="block text-[10px]">Amount</span>{formatPKR(inv.paidAmount || 0)}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {inv.notes && (
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-[10px] text-muted-foreground font-sans mb-1">Notes</p>
              <p className="text-xs font-sans text-foreground">{inv.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="bg-gradient-primary text-xs font-sans gap-1.5 h-8"><Send className="h-3 w-3" />Send to Client</Button>
          <Button size="sm" variant="outline" className="text-xs font-sans gap-1.5 h-8"><Printer className="h-3 w-3" />Print</Button>
          <Button size="sm" variant="outline" className="text-xs font-sans gap-1.5 h-8"><Download className="h-3 w-3" />Download PDF</Button>
          {inv.status !== 'Paid' && (
            <Button size="sm" variant="outline" className="text-xs font-sans gap-1.5 h-8 text-success border-success/30"><CreditCard className="h-3 w-3" />Record Payment</Button>
          )}
        </div>
      </motion.div>
    );
  }

  if (view === 'retainer-detail' && selectedRetainer) {
    const r = selectedRetainer;
    const usagePercent = Math.round((r.usedAmount / r.totalAmount) * 100);
    const remaining = r.totalAmount - r.usedAmount;
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack} className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold font-sans text-foreground">{r.client}</h2>
            <p className="text-xs text-muted-foreground font-sans">Retainer {r.id}</p>
          </div>
          <Badge variant="outline" className={`text-[10px] font-sans ${statusStyle[r.status]}`}>{r.status}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Total Retainer', value: formatPKR(r.totalAmount) },
            { label: 'Used Amount', value: formatPKR(r.usedAmount) },
            { label: 'Remaining', value: formatPKR(remaining) },
            { label: 'Utilization', value: `${usagePercent}%` },
          ].map(m => (
            <Card key={m.label} className="border-border/50">
              <CardContent className="p-3">
                <p className="text-[10px] text-muted-foreground font-sans">{m.label}</p>
                <p className="text-sm font-bold font-sans text-foreground mt-0.5">{m.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Usage Bar */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <div className="flex justify-between text-xs font-sans mb-2">
              <span className="text-muted-foreground">Retainer Usage</span>
              <span className="font-semibold text-foreground">{usagePercent}%</span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${usagePercent >= 90 ? 'bg-destructive' : usagePercent >= 70 ? 'bg-gold' : 'bg-success'}`}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-[11px] font-sans">
              <div><span className="text-[10px] text-muted-foreground block">Period</span>{r.startDate} — {r.endDate}</div>
              <div><span className="text-[10px] text-muted-foreground block">Billing Cycle</span>{r.billingCycle}</div>
              <div><span className="text-[10px] text-muted-foreground block">Status</span>{r.status}</div>
            </div>
          </CardContent>
        </Card>

        {r.status === 'Expiring' && (
          <Card className="border-gold/20 bg-gold/5">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-gold shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold font-sans text-gold">Retainer Expiring Soon</p>
                <p className="text-[11px] text-muted-foreground font-sans mt-0.5">
                  This retainer is {usagePercent}% utilized and nearing its end date. Consider renewal.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {r.status === 'Exhausted' && (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold font-sans text-destructive">Retainer Exhausted</p>
                <p className="text-[11px] text-muted-foreground font-sans mt-0.5">
                  All funds have been utilized. Further services will be billed separately.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="bg-gradient-primary text-xs font-sans gap-1.5 h-8"><RefreshCw className="h-3 w-3" />Renew Retainer</Button>
          <Button size="sm" variant="outline" className="text-xs font-sans gap-1.5 h-8"><BarChart3 className="h-3 w-3" />Usage Report</Button>
          <Button size="sm" variant="outline" className="text-xs font-sans gap-1.5 h-8"><Send className="h-3 w-3" />Send Statement</Button>
        </div>
      </motion.div>
    );
  }

  if (view === 'template-detail' && selectedTemplate) {
    const t = selectedTemplate;
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack} className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold font-sans text-foreground">{t.name}</h2>
            <p className="text-xs text-muted-foreground font-sans">{t.description}</p>
          </div>
          <Badge variant="outline" className="text-[10px] font-sans bg-primary/10 text-primary border-primary/20">{t.category}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="border-border/50">
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground font-sans">Times Used</p>
              <p className="text-sm font-bold font-sans text-foreground mt-0.5">{t.usageCount}</p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="p-3">
              <p className="text-[10px] text-muted-foreground font-sans">Last Used</p>
              <p className="text-sm font-bold font-sans text-foreground mt-0.5">{t.lastUsed}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="p-4 border-b border-border/50">
              <h3 className="text-sm font-semibold font-sans text-foreground">Template Line Items</h3>
              <p className="text-[10px] text-muted-foreground font-sans mt-0.5">Pre-configured billing items — hours are filled per invoice</p>
            </div>
            <div className="divide-y divide-border/50">
              {t.items.map((item, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between">
                  <p className="text-xs font-medium font-sans text-foreground">{item.description}</p>
                  <p className="text-xs font-sans text-muted-foreground">{formatPKR(item.rate)}/hr</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Template Preview */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold font-sans text-foreground mb-3">Invoice Preview</h3>
            <div className="bg-secondary/30 rounded-lg p-4 border border-border/30">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-bold font-sans text-foreground">LAW CHAMBERS</p>
                  <p className="text-[10px] text-muted-foreground font-sans">Advocate & Legal Consultants</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground font-sans">INVOICE</p>
                  <p className="text-xs font-mono text-foreground">INV-XXXX-XXX</p>
                </div>
              </div>
              <Separator className="mb-3" />
              {t.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-[11px] font-sans py-1">
                  <span className="text-muted-foreground">{item.description}</span>
                  <span className="text-foreground">__ hrs × {formatPKR(item.rate)}</span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between text-xs font-sans font-bold">
                <span>Total</span><span>₨ ________</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="bg-gradient-primary text-xs font-sans gap-1.5 h-8"><Plus className="h-3 w-3" />Use Template</Button>
          <Button size="sm" variant="outline" className="text-xs font-sans gap-1.5 h-8"><FileText className="h-3 w-3" />Edit Template</Button>
          <Button size="sm" variant="outline" className="text-xs font-sans gap-1.5 h-8"><Eye className="h-3 w-3" />Preview PDF</Button>
        </div>
      </motion.div>
    );
  }

  // ── Main List View ──
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold font-sans text-foreground">Fee & Billing</h2>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">Invoices, payments, retainers & billing templates</p>
        </div>
        <Button size="sm" onClick={() => setShowNewInvoice(true)} className="bg-gradient-primary font-sans text-xs gap-1.5 h-9">
          <Plus className="h-3.5 w-3.5" /> Create Invoice
        </Button>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Revenue', value: formatPKR(totalRevenue), sub: 'Collected', icon: DollarSign, color: 'text-success' },
          { label: 'Outstanding', value: formatPKR(outstanding), sub: `${invoices.filter(i => i.status === 'Pending' || i.status === 'Partially Paid').length} invoices`, icon: Clock, color: 'text-gold' },
          { label: 'Overdue', value: formatPKR(overdue), sub: `${invoices.filter(i => i.status === 'Overdue').length} invoice(s)`, icon: AlertCircle, color: 'text-destructive' },
          { label: 'Retainers Active', value: retainers.filter(r => r.status === 'Active').length.toString(), sub: `${retainers.length} total`, icon: Wallet, color: 'text-primary' },
        ].map(s => (
          <Card key={s.label} className="border-border/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`h-8 w-8 rounded-lg bg-secondary flex items-center justify-center ${s.color}`}>
                  <s.icon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-lg font-bold font-sans text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground font-sans mt-0.5">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={v => { setMainTab(v as MainTab); setSearchQuery(''); }}>
        <TabsList className="bg-secondary/50 h-9">
          <TabsTrigger value="invoices" className="text-xs font-sans h-7 gap-1"><Receipt className="h-3 w-3" />Invoices</TabsTrigger>
          <TabsTrigger value="payments" className="text-xs font-sans h-7 gap-1"><CreditCard className="h-3 w-3" />Payments</TabsTrigger>
          <TabsTrigger value="retainers" className="text-xs font-sans h-7 gap-1"><Wallet className="h-3 w-3" />Retainers</TabsTrigger>
          <TabsTrigger value="templates" className="text-xs font-sans h-7 gap-1"><FileText className="h-3 w-3" />Templates</TabsTrigger>
        </TabsList>
      </Tabs>

      <AnimatePresence mode="wait">
        {/* ─── INVOICES TAB ─── */}
        {mainTab === 'invoices' && (
          <motion.div key="invoices" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search invoices..." className="pl-8 h-8 text-xs" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <Tabs value={invoiceFilter} onValueChange={setInvoiceFilter}>
                <TabsList className="bg-secondary/50 h-8">
                  <TabsTrigger value="all" className="text-[10px] font-sans h-6">All</TabsTrigger>
                  <TabsTrigger value="paid" className="text-[10px] font-sans h-6">Paid</TabsTrigger>
                  <TabsTrigger value="pending" className="text-[10px] font-sans h-6">Pending</TabsTrigger>
                  <TabsTrigger value="overdue" className="text-[10px] font-sans h-6">Overdue</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-2">
              {filteredInvoices.map(inv => {
                const Icon = statusIcon[inv.status] || Receipt;
                return (
                  <Card key={inv.id} onClick={() => openInvoice(inv)} className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                            <Receipt className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-semibold font-sans text-foreground">{inv.client}</p>
                              <span className="text-[10px] text-muted-foreground font-mono">{inv.id}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground font-sans flex-wrap">
                              <span>Issued: {inv.date}</span>
                              <span>·</span>
                              <span>Due: {inv.due}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-bold font-sans text-foreground">{inv.amount}</p>
                            {inv.status === 'Partially Paid' && inv.paidAmount && (
                              <p className="text-[10px] text-success font-sans">Paid: {formatPKR(inv.paidAmount)}</p>
                            )}
                          </div>
                          <Badge variant="outline" className={`text-[10px] font-sans gap-1 ${statusStyle[inv.status]} hidden sm:flex`}>
                            <Icon className="h-3 w-3" />{inv.status}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {filteredInvoices.length === 0 && (
                <div className="text-center py-8">
                  <Receipt className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground font-sans">No invoices found</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ─── PAYMENTS TAB ─── */}
        {mainTab === 'payments' && (
          <motion.div key="payments" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            <Card className="border-border/50 bg-success/5">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-sans">Total Payments Received</p>
                  <p className="text-lg font-bold font-sans text-foreground">{formatPKR(payments.reduce((s, p) => s + p.amount, 0))}</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <BanknoteIcon className="h-5 w-5 text-success" />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              {payments.map(p => (
                <Card key={p.id} className="border-border/50 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold font-sans text-foreground">{p.client}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground font-sans flex-wrap">
                            <span>{p.date}</span>
                            <span>·</span>
                            <span>{p.method}</span>
                            <span>·</span>
                            <span className="font-mono">{p.reference}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold font-sans text-success">{formatPKR(p.amount)}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{p.invoiceId}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* ─── RETAINERS TAB ─── */}
        {mainTab === 'retainers' && (
          <motion.div key="retainers" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {retainers.map(r => {
              const pct = Math.round((r.usedAmount / r.totalAmount) * 100);
              return (
                <Card key={r.id} onClick={() => openRetainer(r)} className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold font-sans text-foreground">{r.client}</p>
                        <p className="text-[10px] text-muted-foreground font-sans">{r.billingCycle} · {r.startDate} — {r.endDate}</p>
                      </div>
                      <Badge variant="outline" className={`text-[10px] font-sans ${statusStyle[r.status]}`}>{r.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-sans text-muted-foreground mb-1.5">
                      <span>Used: {formatPKR(r.usedAmount)}</span>
                      <span>Total: {formatPKR(r.totalAmount)}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 90 ? 'bg-destructive' : pct >= 70 ? 'bg-gold' : 'bg-success'}`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-right font-sans text-muted-foreground mt-1">{pct}% utilized</p>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>
        )}

        {/* ─── TEMPLATES TAB ─── */}
        {mainTab === 'templates' && (
          <motion.div key="templates" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" variant="outline" className="text-xs font-sans gap-1.5 h-8"><Plus className="h-3 w-3" />New Template</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {billingTemplates.map(t => (
                <Card key={t.id} onClick={() => openTemplate(t)} className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <Badge variant="outline" className="text-[10px] font-sans bg-secondary/50">{t.category}</Badge>
                    </div>
                    <p className="text-sm font-semibold font-sans text-foreground mb-0.5">{t.name}</p>
                    <p className="text-[11px] text-muted-foreground font-sans mb-2">{t.description}</p>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-sans">
                      <span>{t.items.length} line items</span>
                      <span>Used {t.usageCount}× · {t.lastUsed}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Create Invoice Dialog ─── */}
      <Dialog open={showNewInvoice} onOpenChange={setShowNewInvoice}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-sans">Create New Invoice</DialogTitle>
            <DialogDescription className="text-xs font-sans">Generate a professional invoice for your client</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Client</Label>
                <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="khan">Khan Industries Ltd.</SelectItem>
                    <SelectItem value="noor">Noor Enterprises</SelectItem>
                    <SelectItem value="fatima">Fatima Enterprises</SelectItem>
                    <SelectItem value="islamabad">Islamabad Realty Corp.</SelectItem>
                    <SelectItem value="pwu">Pakistan Workers Union</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Case Reference</Label>
                <Input placeholder="CASE-2024-XXX" className="h-9 text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Invoice Date</Label>
                <Input type="date" className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Due Date</Label>
                <Input type="date" className="h-9 text-xs" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Billing Template</Label>
              <Select><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Choose a template (optional)" /></SelectTrigger>
                <SelectContent>
                  {billingTemplates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-sans">Line Items</Label>
                <Button variant="ghost" size="sm" className="text-[10px] h-6 gap-1 text-primary"><Plus className="h-3 w-3" />Add Item</Button>
              </div>
              {[1].map(idx => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5 space-y-1">
                    {idx === 1 && <Label className="text-[10px] font-sans text-muted-foreground">Description</Label>}
                    <Input placeholder="Service description" className="h-8 text-xs" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    {idx === 1 && <Label className="text-[10px] font-sans text-muted-foreground">Hours</Label>}
                    <Input type="number" placeholder="Hrs" className="h-8 text-xs" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    {idx === 1 && <Label className="text-[10px] font-sans text-muted-foreground">Rate (₨)</Label>}
                    <Input type="number" placeholder="Rate" className="h-8 text-xs" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    {idx === 1 && <Label className="text-[10px] font-sans text-muted-foreground">Amount</Label>}
                    <Input disabled placeholder="₨ 0" className="h-8 text-xs bg-secondary/50" />
                  </div>
                  <div className="col-span-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Notes</Label>
              <Textarea placeholder="Additional notes or payment terms..." className="text-xs min-h-[60px]" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline" size="sm" className="text-xs font-sans">Cancel</Button></DialogClose>
            <Button size="sm" variant="outline" className="text-xs font-sans gap-1.5"><Eye className="h-3 w-3" />Preview</Button>
            <Button size="sm" className="bg-gradient-primary text-xs font-sans gap-1.5"><Send className="h-3 w-3" />Create & Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
