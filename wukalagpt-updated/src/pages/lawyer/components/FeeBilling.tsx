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
  Loader2, Share2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import { InvoiceTemplate } from './InvoiceTemplate';
import { useAuth } from '@/contexts/AuthContext';

// ── Types ──────────────────────────────────────────────────────
interface InvoiceItem {
  description: string;
  hours: number;
  rate: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  caseRef: string;
  items: InvoiceItem[];
  amount: number;
  amountFormatted: string;
  dateIssued: string;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Draft' | 'Partially Paid';
  paymentMethod?: string;
  paidDate?: string;
  paidAmount?: number;
  notes?: string;
}

interface Retainer {
  id: string;
  retainerNumber: string;
  clientName: string;
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
  invoiceNumber: string;
  clientName: string;
  amount: number;
  date: string;
  method: string;
  reference: string;
  status: 'Completed' | 'Processing' | 'Failed';
}

interface BillingSummary {
  totalRevenue: number;
  outstandingAmount: number;
  overdueAmount: number;
  activeRetainersCount: number;
  totalRevenueFormatted: string;
  outstandingAmountFormatted: string;
  overdueAmountFormatted: string;
}

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

const EXPENSE_CATEGORIES = {
  OFFICE_RENT: "Office Rent",
  SALARIES: "Staff Salaries",
  SOFTWARE: "Technology & Subscriptions",
  BAR_DUES: "Bar Dues & Licenses",
  MARKETING: "Marketing & Ads",
  TRAVEL: "Court Travel & Lodging",
  UTILITIES: "Utilities & Communication"
};

type MainTab = 'invoices' | 'payments' | 'retainers' | 'templates' | 'expenses';
type View = 'list' | 'invoice-detail' | 'retainer-detail' | 'template-detail';

export default function FeeBilling() {
  const navigate = useNavigate();
  const { type, id } = useParams();
  const { user } = useAuth();
  const [mainTab, setMainTab] = useState<MainTab>('invoices');
  const [invoiceFilter, setInvoiceFilter] = useState('all');
  const [expenseFilter, setExpenseFilter] = useState('all');
  const [view, setView] = useState<View>('list');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedRetainer, setSelectedRetainer] = useState<Retainer | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<BillingTemplate | null>(null);
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [retainers, setRetainers] = useState<Retainer[]>([]);
  const [templates, setTemplates] = useState<BillingTemplate[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState<BillingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewExpense, setShowNewExpense] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showRetainerDialog, setShowRetainerDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    method: 'Bank Transfer',
    reference: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [retainerForm, setRetainerForm] = useState({
    clientId: '',
    totalAmount: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    billingCycle: 'Monthly'
  });

  const [templateForm, setTemplateForm] = useState({
    name: '',
    category: 'General',
    description: '',
    items: [{ description: '', rate: '', hours: 1, amount: 0 }]
  });

  const [clients, setClients] = useState<any[]>([]);
  const [clientCases, setClientCases] = useState<any[]>([]);

  const [expenseForm, setExpenseForm] = useState({
    category: '0',
    description: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0]
  });

  const [invoiceForm, setInvoiceForm] = useState({
    clientId: '',
    caseRef: '',
    dateIssued: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    notes: '',
    items: [{ description: '', hours: '', rate: '', amount: 0 }]
  });

  const [bankDetails, setBankDetails] = useState({
    bankName: localStorage.getItem('invoice_bankName') || '',
    accountTitle: localStorage.getItem('invoice_accountTitle') || '',
    accountNumber: localStorage.getItem('invoice_accountNumber') || '',
    iban: localStorage.getItem('invoice_iban') || '',
    branch: localStorage.getItem('invoice_branch') || ''
  });

  const handleSaveExpense = async () => {
    if (!expenseForm.category || !expenseForm.amount || !expenseForm.expenseDate) {
      alert('Please fill out Category, Amount, and Expense Date.');
      return;
    }
    try {
      await api.addExpense({
        category: parseInt(expenseForm.category),
        description: expenseForm.description,
        amount: parseFloat(expenseForm.amount),
        expenseDate: new Date(expenseForm.expenseDate).toISOString()
      });
      setShowNewExpense(false);
      fetchExpenses(); // Refresh list
    } catch (err) {
      console.error('Failed to save expense', err);
      alert('Failed to save expense');
    }
  };

  const handleCreateInvoice = async () => {
    if (!invoiceForm.clientId || !invoiceForm.caseRef || !invoiceForm.dateIssued || !invoiceForm.dueDate) {
      alert('Client, Case Reference, Issue Date, and Due Date are required.');
      return;
    }
    if (invoiceForm.items.length === 0 || invoiceForm.items.some(i => !i.description)) {
      alert('At least one line item with a description is required.');
      return;
    }

    try {
      const selectedCase = clientCases.find(c => c.caseNumber === invoiceForm.caseRef);
      
      const bankDetailsJson = `\n\n___BANK_DETAILS___${JSON.stringify(bankDetails)}___`;
      
      localStorage.setItem('invoice_bankName', bankDetails.bankName);
      localStorage.setItem('invoice_accountTitle', bankDetails.accountTitle);
      localStorage.setItem('invoice_accountNumber', bankDetails.accountNumber);
      localStorage.setItem('invoice_iban', bankDetails.iban);
      localStorage.setItem('invoice_branch', bankDetails.branch);

      await api.createInvoice({
        clientId: invoiceForm.clientId,
        caseId: selectedCase?.id,
        caseRef: invoiceForm.caseRef,
        dateIssued: new Date(invoiceForm.dateIssued).toISOString(),
        dueDate: new Date(invoiceForm.dueDate).toISOString(),
        notes: invoiceForm.notes + bankDetailsJson,
        items: invoiceForm.items.map(item => ({
          description: item.description,
          hours: parseFloat(item.hours as string) || 0,
          rate: parseFloat(item.rate as string) || 0,
          amount: (parseFloat(item.hours as string) || 0) * (parseFloat(item.rate as string) || 0)
        }))
      });
      setShowNewInvoice(false);
      fetchInvoices(); // Refresh list
      fetchInitialData(); // Refresh summary
    } catch (err) {
      console.error('Failed to create invoice', err);
      alert('Failed to create invoice. Please check the inputs.');
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedInvoice || !paymentForm.amount || !paymentForm.method) return;
    try {
      await api.recordPayment(selectedInvoice.id, {
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method,
        reference: paymentForm.reference,
        date: new Date(paymentForm.date).toISOString()
      });
      setShowPaymentDialog(false);
      fetchInvoices();
      fetchPayments();
      fetchInitialData();
      // update local view
      setSelectedInvoice({...selectedInvoice, paidAmount: (selectedInvoice.paidAmount || 0) + parseFloat(paymentForm.amount), status: 'Partially Paid'});
    } catch (err) { console.error('Failed to record payment', err); alert('Failed to record payment'); }
  };

  const handleCreateRetainer = async () => {
    if (!retainerForm.clientId || !retainerForm.totalAmount) return;
    try {
      await api.createRetainer({
        clientId: retainerForm.clientId,
        totalAmount: parseFloat(retainerForm.totalAmount),
        startDate: new Date(retainerForm.startDate).toISOString(),
        endDate: new Date(retainerForm.endDate).toISOString(),
        billingCycle: retainerForm.billingCycle
      });
      setShowRetainerDialog(false);
      fetchRetainers();
      fetchInitialData();
    } catch (err) { console.error('Failed to create retainer', err); alert('Failed to create retainer'); }
  };

  const handleCreateTemplate = async () => {
    if (!templateForm.name || !templateForm.category) return;
    try {
      await api.createTemplate({
        name: templateForm.name,
        category: templateForm.category,
        description: templateForm.description,
        items: templateForm.items.map(i => ({
          description: i.description,
          rate: parseFloat(i.rate as string) || 0,
          hours: 1,
          amount: parseFloat(i.rate as string) || 0
        }))
      });
      setShowTemplateDialog(false);
      fetchTemplates();
    } catch (err) { console.error('Failed to create template', err); alert('Failed to create template'); }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (type && id) {
      if (type === 'invoice') {
        const inv = invoices.find(i => i.id === id);
        if (inv) {
          setSelectedInvoice(inv);
          setView('invoice-detail');
        }
      } else if (type === 'retainer') {
        const ret = retainers.find(r => r.id === id);
        if (ret) {
          setSelectedRetainer(ret);
          setView('retainer-detail');
        }
      } else if (type === 'template') {
        const tpl = templates.find(t => t.id === id);
        if (tpl) {
          setSelectedTemplate(tpl);
          setView('template-detail');
        }
      }
    } else {
      setSelectedInvoice(null);
      setSelectedRetainer(null);
      setSelectedTemplate(null);
      setView('list');
    }
  }, [type, id, invoices, retainers, templates]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      try {
        const summaryData = await api.getBillingSummary();
        setSummary(summaryData);
      } catch (err) {
        console.error('Failed to fetch billing summary:', err);
      }
      
      await Promise.all([
        fetchInvoices(),
        fetchPayments(),
        fetchRetainers(),
        fetchTemplates(),
        fetchExpenses(),
        fetchClients()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const data = await api.getClients();
      const clientsArray = Array.isArray(data) ? data : (data?.data || data?.Data || data?.items || data?.Items || []);
      setClients(clientsArray);
    } catch (err) { console.error('Failed to fetch clients', err); }
  };

  const handleClientChange = async (clientId: string) => {
    setInvoiceForm({ ...invoiceForm, clientId, caseRef: '' });
    try {
      const cases = await api.getCases({ clientId });
      const casesArray = Array.isArray(cases) ? cases : (cases?.data || cases?.Data || cases?.items || cases?.Items || []);
      setClientCases(casesArray);
    } catch (err) { console.error('Failed to fetch cases', err); }
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setInvoiceForm({
        ...invoiceForm,
        notes: template.description || invoiceForm.notes,
        items: template.items && template.items.length > 0 
          ? template.items.map(i => ({ description: i.description, hours: '', rate: i.rate, amount: 0 }))
          : [{ description: template.name, hours: '', rate: '', amount: 0 }]
      });
    }
  };

  const fetchExpenses = async () => {
    try {
      const data = await api.getExpenses();
      setExpenses(data.map((e: any) => ({
        id: e.id,
        date: new Date(e.expenseDate).toLocaleDateString(),
        category: Object.values(EXPENSE_CATEGORIES)[e.category] || 'General',
        description: e.description,
        amount: e.amount,
        status: 'Paid'
      })));
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    }
  };

  const fetchInvoices = async () => {
    try {
      const data = await api.getInvoices(invoiceFilter, searchQuery);
      setInvoices(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchInvoices();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, invoiceFilter]);

  const fetchPayments = async () => {
    try {
      const data = await api.getRecentPayments();
      setPayments(data);
    } catch (err) { console.error(err); }
  };

  const fetchRetainers = async () => {
    try {
      const data = await api.getRetainers();
      setRetainers(data);
    } catch (err) { console.error(err); }
  };

  const fetchTemplates = async () => {
    try {
      const data = await api.getTemplates();
      setTemplates(data);
    } catch (err) { console.error(err); }
  };

  const handleDownloadInvoicePDF = async () => {
    const el = document.getElementById('invoice-pdf-container');
    if (!el) return;
    setIsGeneratingPdf(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const opt = {
        margin:       0,
        filename:     `${selectedInvoice?.invoiceNumber || 'Invoice'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().set(opt).from(el).save();
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const openInvoice = (inv: Invoice) => { navigate('/lawyer-dashboard/billing/invoice/' + inv.id); };
  const openRetainer = (r: Retainer) => { navigate('/lawyer-dashboard/billing/retainer/' + r.id); };
  const openTemplate = (t: BillingTemplate) => { navigate('/lawyer-dashboard/billing/template/' + t.id); };
  const goBack = () => { navigate('/lawyer-dashboard/billing'); };

  const formatPKR = (n: number) => `₨ ${n.toLocaleString()}`;

  // ── Detail Views ──
  if (view === 'invoice-detail' && selectedInvoice) {
    const inv = selectedInvoice;
    const Icon = statusIcon[inv.status] || Receipt;
    const subtotal = inv.items.reduce((s, it) => s + it.amount, 0);

    let savedBankDetails = null;
    let cleanNotes = inv.notes || '';
    if (inv.notes?.includes('___BANK_DETAILS___')) {
      try {
        const match = inv.notes.match(/___BANK_DETAILS___(.*?)___/);
        if (match && match[1]) {
          savedBankDetails = JSON.parse(match[1]);
          cleanNotes = inv.notes.replace(/___BANK_DETAILS___(.*?)___/, '').trim();
        }
      } catch(e) {}
    }

    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5 relative">
        
        {/* Hidden Invoice Template for PDF Generation */}
        <div className="hidden">
          <div id="invoice-pdf-container">
            <InvoiceTemplate invoice={{...inv, notes: cleanNotes}} bankDetails={savedBankDetails} lawyerDetails={user} />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={goBack} className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold font-sans text-foreground">{inv.invoiceNumber}</h2>
            <p className="text-xs text-muted-foreground font-sans">{inv.clientName}</p>
          </div>
          <Badge variant="outline" className={`text-[10px] font-sans gap-1 ${statusStyle[inv.status]}`}>
            <Icon className="h-3 w-3" />{inv.status}
          </Badge>
        </div>

        {/* Invoice Meta */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Invoice Date', value: inv.dateIssued, icon: Calendar },
            { label: 'Due Date', value: inv.dueDate, icon: Clock },
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

        {cleanNotes && (
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-[10px] text-muted-foreground font-sans mb-1">Notes</p>
              <p className="text-xs font-sans text-foreground whitespace-pre-wrap">{cleanNotes}</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="bg-gradient-primary text-xs font-sans gap-1.5 h-8" onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: `Invoice ${inv.invoiceNumber}`,
                text: `Invoice ${inv.invoiceNumber} for ${inv.clientName}`,
                url: window.location.href,
              }).catch(console.error);
            } else {
              alert('Sharing is not supported on this browser.');
            }
          }}><Share2 className="h-3 w-3" />Share</Button>
          <Button size="sm" variant="outline" className="text-xs font-sans gap-1.5 h-8" disabled={isGeneratingPdf} onClick={handleDownloadInvoicePDF}><Printer className="h-3 w-3" />Print</Button>
          <Button size="sm" variant="outline" className="text-xs font-sans gap-1.5 h-8" disabled={isGeneratingPdf} onClick={handleDownloadInvoicePDF}>
            {isGeneratingPdf ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
            {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}
          </Button>
          {inv.status !== 'Paid' && (
            <Button size="sm" variant="outline" className="text-xs font-sans gap-1.5 h-8 text-success border-success/30" onClick={() => setShowPaymentDialog(true)}>
              <CreditCard className="h-3 w-3" />Record Payment
            </Button>
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
            <h2 className="text-lg font-semibold font-sans text-foreground">{r.clientName}</h2>
            <p className="text-xs text-muted-foreground font-sans">Retainer {r.retainerNumber}</p>
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
          <Button size="sm" className="bg-gradient-primary text-xs font-sans gap-1.5 h-8" onClick={() => setShowRetainerDialog(true)}><RefreshCw className="h-3 w-3" />Renew Retainer</Button>
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
            <div id="template-preview-container" className="bg-secondary/30 rounded-lg p-4 border border-border/30">
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
          <Button size="sm" className="bg-gradient-primary text-xs font-sans gap-1.5 h-8" onClick={() => {
            setInvoiceForm({
              ...invoiceForm,
              notes: t.description || invoiceForm.notes,
              items: t.items && t.items.length > 0 
                ? t.items.map(i => ({ description: i.description, hours: '', rate: i.rate, amount: 0 }))
                : [{ description: t.name, hours: '', rate: '', amount: 0 }]
            });
            setView('list');
            setMainTab('invoices');
            setShowNewInvoice(true);
          }}>
            <Plus className="h-3 w-3" />Use Template
          </Button>
          
          <Button size="sm" variant="outline" className="text-xs font-sans gap-1.5 h-8" onClick={() => {
            setTemplateForm({
              name: t.name + ' (Copy)',
              category: t.category,
              description: t.description,
              items: t.items.map(i => ({ description: i.description, hours: 1, rate: i.rate.toString(), amount: i.rate }))
            });
            setView('list');
            setMainTab('templates');
            setShowTemplateDialog(true);
          }}>
            <FileText className="h-3 w-3" />Duplicate / Edit
          </Button>
          
          <Button size="sm" variant="outline" className="text-xs font-sans gap-1.5 h-8" onClick={async () => {
            const element = document.getElementById('template-preview-container');
            if (element) {
              const opt = {
                margin: 0,
                filename: `Template_${t.name}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
              };
              const html2pdf = (await import('html2pdf.js')).default;
              html2pdf().from(element).set(opt).save();
            }
          }}>
            <Eye className="h-3 w-3" />Preview PDF
          </Button>
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
          <h2 className="text-lg font-semibold font-sans text-foreground">Finance</h2>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">Invoices, payments, retainers, billing templates & expenses</p>
        </div>
        <Button size="sm" onClick={() => setShowNewInvoice(true)} className="bg-gradient-primary font-sans text-xs gap-1.5 h-9">
          <Plus className="h-3.5 w-3.5" /> Create Invoice
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Revenue', value: summary?.totalRevenueFormatted || '₨ 0', sub: 'Collected', icon: DollarSign, color: 'text-success' },
          { label: 'Outstanding', value: summary?.outstandingAmountFormatted || '₨ 0', sub: 'Pending invoices', icon: Clock, color: 'text-gold' },
          { label: 'Overdue', value: summary?.overdueAmountFormatted || '₨ 0', sub: 'Action required', icon: AlertCircle, color: 'text-destructive' },
          { label: 'Retainers Active', value: summary?.activeRetainersCount.toString() || '0', sub: 'Active contracts', icon: Wallet, color: 'text-primary' },
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
          <TabsTrigger value="expenses" className="text-xs font-sans h-7 gap-1 text-destructive data-[state=active]:text-foreground"><DollarSign className="h-3 w-3" />Expenses</TabsTrigger>
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
              {loading ? (
                <div className="p-12 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                  <p className="text-xs text-muted-foreground font-sans">Fetching invoices...</p>
                </div>
              ) : invoices.map(inv => {
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
                              <p className="text-sm font-semibold font-sans text-foreground">{inv.clientName}</p>
                              <span className="text-[10px] text-muted-foreground font-mono">{inv.invoiceNumber}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground font-sans flex-wrap">
                              <span>Issued: {inv.dateIssued}</span>
                              <span>·</span>
                              <span>Due: {inv.dueDate}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-bold font-sans text-foreground">{inv.amountFormatted}</p>
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
              {!loading && invoices.length === 0 && (
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
                          <p className="text-sm font-semibold font-sans text-foreground">{p.clientName}</p>
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
                        <p className="text-[10px] text-muted-foreground font-mono">{p.invoiceNumber}</p>
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
            <div className="flex justify-end">
              <Button size="sm" variant="outline" className="text-xs font-sans gap-1.5 h-8" onClick={() => setShowRetainerDialog(true)}><Plus className="h-3 w-3" />New Retainer</Button>
            </div>
            {retainers.map(r => {
              const pct = Math.round((r.usedAmount / r.totalAmount) * 100);
              return (
                <Card key={r.id} onClick={() => openRetainer(r)} className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold font-sans text-foreground">{r.clientName}</p>
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
              <Button size="sm" variant="outline" className="text-xs font-sans gap-1.5 h-8" onClick={() => setShowTemplateDialog(true)}><Plus className="h-3 w-3" />New Template</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {templates.map(t => (
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

        {/* ─── EXPENSES TAB ─── */}
        {mainTab === 'expenses' && (
          <motion.div key="expenses" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  onClick={() => setShowNewExpense(true)}
                  className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20 font-sans text-[10px] h-7 gap-1.5"
                >
                  <Plus className="h-3 w-3" /> Record Expense
                </Button>
                <Select value={expenseFilter} onValueChange={setExpenseFilter}>
                  <SelectTrigger className="h-7 text-[10px] font-sans w-[120px]">
                    <div className="flex items-center gap-1.5"><Filter className="h-3 w-3" /> <SelectValue placeholder="Category" /></div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Categories</SelectItem>
                    {Object.values(EXPENSE_CATEGORIES).map(cat => (
                      <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider">Total Monthly Pivot</p>
                <p className="text-sm font-bold font-sans text-destructive">₨ {expenses.filter(e => expenseFilter === 'all' || e.category === expenseFilter).reduce((s, e) => s + e.amount, 0).toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-2">
              {expenses.filter(e => expenseFilter === 'all' || e.category === expenseFilter).map(exp => (
                <Card key={exp.id} className="border-border/50 shadow-sm hover:border-destructive/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-destructive/5 flex items-center justify-center shrink-0 border border-destructive/10">
                          <DollarSign className="h-4 w-4 text-destructive" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold font-sans text-foreground">{exp.description}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground font-sans">
                            <Badge variant="outline" className="py-0 h-4 text-[9px] font-sans border-border/50">{exp.category}</Badge>
                            <span>·</span>
                            <span>{exp.date}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold font-sans text-foreground">₨ {exp.amount.toLocaleString()}</p>
                        <Badge variant="outline" className={`text-[9px] font-sans py-0 h-4 ${exp.status === 'Paid' ? 'text-success border-success/30' : 'text-gold border-gold/30'}`}>
                          {exp.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Record Expense Dialog ─── */}
      <Dialog open={showNewExpense} onOpenChange={setShowNewExpense}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-sans text-destructive flex items-center gap-2">
              <DollarSign className="h-5 w-5" /> Record Firm Expense
            </DialogTitle>
            <DialogDescription className="text-xs font-sans">Track outgoing costs for your firm's practice analytics</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Expense Category</Label>
              <Select value={expenseForm.category} onValueChange={(val) => setExpenseForm({...expenseForm, category: val})}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXPENSE_CATEGORIES).map(([key, value], idx) => (
                    <SelectItem key={key} value={idx.toString()} className="text-xs">{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Description</Label>
              <Input placeholder="e.g. Monthly Internet Bill or Junior Associate stipend" className="h-9 text-xs" 
                value={expenseForm.description} onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Amount (₨)</Label>
                <Input type="number" placeholder="0.00" className="h-9 text-xs" 
                  value={expenseForm.amount} onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Expense Date</Label>
                <Input type="date" className="h-9 text-xs" 
                  value={expenseForm.expenseDate} onChange={(e) => setExpenseForm({...expenseForm, expenseDate: e.target.value})} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-sans flex items-center justify-between">
                Receipt Attachment
                <span className="text-[10px] font-normal text-muted-foreground uppercase">Optional</span>
              </Label>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:bg-secondary/30 transition-colors cursor-pointer">
                <Plus className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-[10px] text-muted-foreground font-sans">Click to upload receipt or invoice</p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" size="sm" className="text-xs font-sans h-9">Cancel</Button>
            </DialogClose>
            <Button size="sm" className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs font-sans h-9 px-5" onClick={handleSaveExpense}>
              Save Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                <Select value={invoiceForm.clientId} onValueChange={handleClientChange}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Case Reference</Label>
                <Select value={invoiceForm.caseRef} onValueChange={(val) => setInvoiceForm({...invoiceForm, caseRef: val})} disabled={!invoiceForm.clientId}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select case" /></SelectTrigger>
                  <SelectContent>
                    {clientCases.map(c => (
                      <SelectItem key={c.id} value={c.caseNumber}>{c.title} ({c.caseNumber})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Invoice Date</Label>
                <Input type="date" className="h-9 text-xs" 
                  value={invoiceForm.dateIssued} onChange={(e) => setInvoiceForm({...invoiceForm, dateIssued: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Due Date</Label>
                <Input type="date" className="h-9 text-xs" 
                  value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm({...invoiceForm, dueDate: e.target.value})} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Billing Template</Label>
              <Select onValueChange={handleTemplateChange}><SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Choose a template (optional)" /></SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-sans">Line Items</Label>
                <Button variant="ghost" size="sm" className="text-[10px] h-6 gap-1 text-primary" 
                  onClick={() => setInvoiceForm({...invoiceForm, items: [...invoiceForm.items, { description: '', hours: '', rate: '', amount: 0 }]})}>
                  <Plus className="h-3 w-3" />Add Item
                </Button>
              </div>
              {invoiceForm.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5 space-y-1">
                    {idx === 0 && <Label className="text-[10px] font-sans text-muted-foreground">Description</Label>}
                    <Input placeholder="Service description" className="h-8 text-xs" 
                      value={item.description} onChange={(e) => {
                        const newItems = [...invoiceForm.items];
                        newItems[idx].description = e.target.value;
                        setInvoiceForm({...invoiceForm, items: newItems});
                      }} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    {idx === 0 && <Label className="text-[10px] font-sans text-muted-foreground">Hours</Label>}
                    <Input type="number" placeholder="Hrs" className="h-8 text-xs" 
                      value={item.hours} onChange={(e) => {
                        const newItems = [...invoiceForm.items];
                        newItems[idx].hours = e.target.value;
                        setInvoiceForm({...invoiceForm, items: newItems});
                      }} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    {idx === 0 && <Label className="text-[10px] font-sans text-muted-foreground">Rate (₨)</Label>}
                    <Input type="number" placeholder="Rate" className="h-8 text-xs" 
                      value={item.rate} onChange={(e) => {
                        const newItems = [...invoiceForm.items];
                        newItems[idx].rate = e.target.value;
                        setInvoiceForm({...invoiceForm, items: newItems});
                      }} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    {idx === 0 && <Label className="text-[10px] font-sans text-muted-foreground">Amount</Label>}
                    <Input disabled placeholder="₨ 0" className="h-8 text-xs bg-secondary/50" 
                      value={`₨ ${((parseFloat(item.hours as string) || 0) * (parseFloat(item.rate as string) || 0)).toLocaleString()}`} />
                  </div>
                  <div className="col-span-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        const newItems = invoiceForm.items.filter((_, i) => i !== idx);
                        setInvoiceForm({...invoiceForm, items: newItems});
                      }}><X className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t pt-3 mt-1">
              <Label className="text-xs font-sans text-foreground">Payment Details (Bank Info)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Bank Name" className="h-8 text-xs" value={bankDetails.bankName} onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})} />
                <Input placeholder="Account Title" className="h-8 text-xs" value={bankDetails.accountTitle} onChange={(e) => setBankDetails({...bankDetails, accountTitle: e.target.value})} />
                <Input placeholder="Account Number" className="h-8 text-xs" value={bankDetails.accountNumber} onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})} />
                <Input placeholder="IBAN" className="h-8 text-xs" value={bankDetails.iban} onChange={(e) => setBankDetails({...bankDetails, iban: e.target.value})} />
                <Input placeholder="Branch" className="h-8 text-xs col-span-2" value={bankDetails.branch} onChange={(e) => setBankDetails({...bankDetails, branch: e.target.value})} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Notes</Label>
              <Textarea placeholder="Additional notes or payment terms..." className="text-xs min-h-[60px]" 
                value={invoiceForm.notes} onChange={(e) => setInvoiceForm({...invoiceForm, notes: e.target.value})} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline" size="sm" className="text-xs font-sans">Cancel</Button></DialogClose>
            <Button size="sm" variant="outline" className="text-xs font-sans gap-1.5"><Eye className="h-3 w-3" />Preview</Button>
            <Button size="sm" className="bg-gradient-primary text-xs font-sans gap-1.5" onClick={handleCreateInvoice}><Send className="h-3 w-3" />Create & Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Record Payment Dialog ─── */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-sans flex items-center gap-2"><CreditCard className="h-5 w-5 text-success" /> Record Payment</DialogTitle>
            <DialogDescription className="text-xs font-sans">Record a payment received for invoice {selectedInvoice?.invoiceNumber}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Amount (₨)</Label>
              <Input type="number" placeholder="0.00" className="h-9 text-xs" 
                value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Payment Date</Label>
                <Input type="date" className="h-9 text-xs" 
                  value={paymentForm.date} onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Payment Method</Label>
                <Select value={paymentForm.method} onValueChange={(val) => setPaymentForm({...paymentForm, method: val})}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Retainer">Apply Retainer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Reference (Optional)</Label>
              <Input placeholder="Check #, Transaction ID..." className="h-9 text-xs" 
                value={paymentForm.reference} onChange={(e) => setPaymentForm({...paymentForm, reference: e.target.value})} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline" size="sm" className="text-xs font-sans">Cancel</Button></DialogClose>
            <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90 text-xs font-sans" onClick={handleRecordPayment}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── New Retainer Dialog ─── */}
      <Dialog open={showRetainerDialog} onOpenChange={setShowRetainerDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-sans">New Retainer</DialogTitle>
            <DialogDescription className="text-xs font-sans">Create a new retainer agreement for a client</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Client</Label>
              <Select value={retainerForm.clientId} onValueChange={(val) => setRetainerForm({...retainerForm, clientId: val})}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Total Amount (₨)</Label>
              <Input type="number" placeholder="0.00" className="h-9 text-xs" 
                value={retainerForm.totalAmount} onChange={(e) => setRetainerForm({...retainerForm, totalAmount: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Start Date</Label>
                <Input type="date" className="h-9 text-xs" 
                  value={retainerForm.startDate} onChange={(e) => setRetainerForm({...retainerForm, startDate: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">End Date</Label>
                <Input type="date" className="h-9 text-xs" 
                  value={retainerForm.endDate} onChange={(e) => setRetainerForm({...retainerForm, endDate: e.target.value})} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Billing Cycle</Label>
              <Select value={retainerForm.billingCycle} onValueChange={(val) => setRetainerForm({...retainerForm, billingCycle: val})}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Billing Cycle" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Annual">Annual</SelectItem>
                  <SelectItem value="Lump Sum">Lump Sum</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline" size="sm" className="text-xs font-sans">Cancel</Button></DialogClose>
            <Button size="sm" className="bg-gradient-primary text-xs font-sans" onClick={handleCreateRetainer}>Create Retainer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── New Template Dialog ─── */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-sans">New Billing Template</DialogTitle>
            <DialogDescription className="text-xs font-sans">Create a reusable template for standardized billing</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Template Name</Label>
                <Input placeholder="e.g. Standard Consultation" className="h-9 text-xs" 
                  value={templateForm.name} onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Category</Label>
                <Input placeholder="e.g. Litigation, Advisory" className="h-9 text-xs" 
                  value={templateForm.category} onChange={(e) => setTemplateForm({...templateForm, category: e.target.value})} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-sans">Description (Optional)</Label>
              <Textarea placeholder="Short description..." className="text-xs min-h-[60px]" 
                value={templateForm.description} onChange={(e) => setTemplateForm({...templateForm, description: e.target.value})} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-sans">Default Line Items</Label>
                <Button variant="ghost" size="sm" className="text-[10px] h-6 gap-1 text-primary" 
                  onClick={() => setTemplateForm({...templateForm, items: [...templateForm.items, { description: '', hours: 1, rate: '', amount: 0 }]})}>
                  <Plus className="h-3 w-3" />Add Item
                </Button>
              </div>
              {templateForm.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-8 space-y-1">
                    {idx === 0 && <Label className="text-[10px] font-sans text-muted-foreground">Description</Label>}
                    <Input placeholder="Service description" className="h-8 text-xs" 
                      value={item.description} onChange={(e) => {
                        const newItems = [...templateForm.items];
                        newItems[idx].description = e.target.value;
                        setTemplateForm({...templateForm, items: newItems});
                      }} />
                  </div>
                  <div className="col-span-3 space-y-1">
                    {idx === 0 && <Label className="text-[10px] font-sans text-muted-foreground">Default Rate</Label>}
                    <Input type="number" placeholder="Rate" className="h-8 text-xs" 
                      value={item.rate} onChange={(e) => {
                        const newItems = [...templateForm.items];
                        newItems[idx].rate = e.target.value;
                        setTemplateForm({...templateForm, items: newItems});
                      }} />
                  </div>
                  <div className="col-span-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        const newItems = templateForm.items.filter((_, i) => i !== idx);
                        setTemplateForm({...templateForm, items: newItems});
                      }}><X className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline" size="sm" className="text-xs font-sans">Cancel</Button></DialogClose>
            <Button size="sm" className="bg-gradient-primary text-xs font-sans" onClick={handleCreateTemplate}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
