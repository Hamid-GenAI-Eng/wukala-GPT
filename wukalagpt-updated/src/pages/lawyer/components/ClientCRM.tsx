import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Phone, Mail, MoreVertical, Star, MapPin, Briefcase,
  MessageSquare, ArrowLeft, Calendar, Clock, FileText, Shield,
  AlertTriangle, Tag, UserCheck, Eye, Send, PhoneCall, Video,
  Users, TrendingUp, UserPlus, Bell, CreditCard, ChevronRight,
  CheckCircle2, XCircle, Edit, Trash2, Loader2
} from 'lucide-react';
import api from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────
interface Interaction {
  id: string;
  type: 'call' | 'meeting' | 'whatsapp' | 'email' | 'sms';
  summary: string;
  date: string;
  time: string;
  duration?: string;
}

interface ClientCase {
  id: string;
  title: string;
  caseNumber: string;
  court: string;
  status: 'Active' | 'Disposed' | 'Pending';
  nextHearing?: string;
}

interface SharedDocument {
  id: string;
  fullName: string;
  type: string;
  sharedDate: string;
  size: string;
}

interface Client {
  id: string;
  fullName: string;
  contactPerson: string;
  cnic: string;
  email: string;
  phone: string;
  whatsapp: string;
  city: string;
  address: string;
  activeCasesCount: number;
  totalBilled: number;
  outstandingBalance: number;
  status: string;
  vip: boolean;
  tags: string[];
  onboardedAt: string;
  lastContactDate: string;
  retentionFlagged: boolean;
  portalEnabled: boolean;
  cases?: ClientCase[];
  interactions?: Interaction[];
  documents?: SharedDocument[];
}

// ─── Mock Data ────────────────────────────────────────────────────


const allTags = ['Corporate', 'Criminal', 'Property', 'Labour Law', 'Banking', 'Family Law', 'Individual', 'High Value', 'NGO'];

const interactionIcons: Record<string, React.ReactNode> = {
  call: <PhoneCall className="h-3.5 w-3.5" />,
  meeting: <Users className="h-3.5 w-3.5" />,
  whatsapp: <MessageSquare className="h-3.5 w-3.5" />,
  email: <Mail className="h-3.5 w-3.5" />,
  sms: <Send className="h-3.5 w-3.5" />,
};

const interactionColors: Record<string, string> = {
  call: 'bg-blue-500/10 text-blue-600 border-blue-200',
  meeting: 'bg-purple-500/10 text-purple-600 border-purple-200',
  whatsapp: 'bg-green-500/10 text-green-600 border-green-200',
  email: 'bg-orange-500/10 text-orange-600 border-orange-200',
  sms: 'bg-cyan-500/10 text-cyan-600 border-cyan-200',
};

// ─── Component ────────────────────────────────────────────────────
export default function ClientCRM() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [detailTab, setDetailTab] = useState('overview');
  const [showAddClient, setShowAddClient] = useState(false);
  const [showConflictCheck, setShowConflictCheck] = useState(false);
  const [showLogInteraction, setShowLogInteraction] = useState(false);
  const [conflictQuery, setConflictQuery] = useState('');
  const [newInteraction, setNewInteraction] = useState({ type: 'call', summary: '' });

  // Dynamic states
  const [loading, setLoading] = useState(true);
  const [clientList, setClientList] = useState<Client[]>([]);
  const [clientStats, setClientStats] = useState<any>(null);

  // Invite/add client form state
  const [newClientData, setNewClientData] = useState({
    fullName: '',
    contactPerson: '',
    cnic: '',
    email: '',
    phone: '',
    whatsapp: '',
    city: '',
    address: '',
    vip: false,
    tags: [] as string[],
    linkedCaseId: ''
  });
  const [addingClient, setAddingClient] = useState(false);
  const [availableCases, setAvailableCases] = useState<any[]>([]);

  useEffect(() => {
    async function loadClients() {
      try {
        setLoading(true);
        const [clientsRes, statsRes, casesRes] = await Promise.allSettled([
          api.getClients(),
          api.getClientStats(),
          api.getCases({ limit: 100 })
        ]);

        if (clientsRes.status === 'fulfilled' && clientsRes.value) {
          const fetchedData = clientsRes.value.data || clientsRes.value; // handle array or paginated object
          setClientList(Array.isArray(fetchedData) ? fetchedData : []);
        }

        if (statsRes.status === 'fulfilled' && statsRes.value) {
          setClientStats(statsRes.value);
        }

        if (casesRes.status === 'fulfilled' && casesRes.value) {
          const fetchedCases = casesRes.value.data || casesRes.value;
          setAvailableCases(Array.isArray(fetchedCases) ? fetchedCases : []);
        }
      } catch (err) {
        console.error("Failed to load secure CRM directory.", err);
        setClientList([]);
      } finally {
        setLoading(false);
      }
    }
    loadClients();
  }, []);

  const handleAddClient = async () => {
    try {
      setAddingClient(true);
      const createdClient = await api.createClient(newClientData);
      
      if (newClientData.linkedCaseId && newClientData.linkedCaseId !== 'none' && createdClient?.id) {
        // Link the selected case to the new client
        await api.updateCase(newClientData.linkedCaseId, { clientId: createdClient.id });
      }
      
      setShowAddClient(false);
      // Reset form
      setNewClientData({
        fullName: '',
        contactPerson: '',
        cnic: '',
        email: '',
        phone: '',
        whatsapp: '',
        city: '',
        address: '',
        vip: false,
        tags: [],
        linkedCaseId: ''
      });
      // Refresh list
      const res = await api.getClients();
      const updatedList = res.data || res;
      if (updatedList) {
        setClientList(Array.isArray(updatedList) ? updatedList : []);
      }
    } catch (err) {
      console.error("Failed to create client", err);
    } finally {
      setAddingClient(false);
    }
  };

  const handleClientClick = async (client: Client) => {
    try {
      // Show basic info immediately
      setSelectedClient({ ...client, cases: [], interactions: [], documents: [] });
      setDetailTab('overview');
      // Fetch full details
      const details = await api.getClientDetail(client.id);
      if (details) {
        setSelectedClient(prev => prev?.id === client.id ? { ...prev, ...details } : prev);
      }
    } catch (error) {
      console.error("Failed to load client details", error);
    }
  };

  const handleLogInteraction = async () => {
    if (!selectedClient || !newInteraction.summary) return;
    try {
      setLoading(true);
      const res = await api.logClientInteraction(selectedClient.id, newInteraction);
      if (res) {
        // Refresh details
        const details = await api.getClientDetail(selectedClient.id);
        if (details) {
          setSelectedClient(prev => prev?.id === selectedClient.id ? { ...prev, ...details } : prev);
        }
        setShowLogInteraction(false);
        setNewInteraction({ type: 'call', summary: '' });
      }
    } catch (err) {
      console.error("Failed to log interaction", err);
    } finally {
      setLoading(false);
    }
  };

  // Conflict check logic
  const conflictResults = useMemo(() => {
    if (!conflictQuery.trim()) return [];
    const q = conflictQuery.toLowerCase();
    return clientList.filter(c =>
      c.fullName.toLowerCase().includes(q) ||
      c.contactPerson.toLowerCase().includes(q) ||
      c.cnic.includes(conflictQuery)
    );
  }, [conflictQuery, clientList]);

  // Filtered clients
  const filtered = useMemo(() => {
    return clientList.filter(c => {
      const matchSearch = c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.cnic.includes(searchQuery);
      const matchTag = tagFilter === 'all' || c.tags.includes(tagFilter);
      if (tab === 'all') return matchSearch && matchTag;
      if (tab === 'vip') return matchSearch && matchTag && c.vip;
      if (tab === 'retention') return matchSearch && matchTag && c.retentionFlagged;
      return matchSearch && matchTag && c.status.toLowerCase() === tab;
    });
  }, [searchQuery, tab, tagFilter, clientList]);

  // Stats
  const stats = useMemo(() => {
    if (clientStats) return clientStats;
    return {
      total: clientList.length,
      active: clientList.filter(c => c.status === 'Active').length,
      vip: clientList.filter(c => c.vip).length,
      retentionAlerts: clientList.filter(c => c.retentionFlagged).length,
    };
  }, [clientList, clientStats]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-sans">Connecting to secure client CRM directory...</p>
      </div>
    );
  }

  // ── Detail View ───────────────────────────────────────────────
  if (selectedClient) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="detail"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-5"
        >
          {/* Header */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedClient(null)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold font-sans text-foreground">{selectedClient.fullName}</h2>
                {selectedClient.vip && <Star className="h-4 w-4 text-gold fill-gold" />}
                <Badge variant={selectedClient.status === 'Active' ? 'default' : 'secondary'} className="text-[10px] h-5">
                  {selectedClient.status}
                </Badge>
                {selectedClient.retentionFlagged && (
                  <Badge variant="destructive" className="text-[10px] h-5 gap-1">
                    <Bell className="h-2.5 w-2.5" /> Retention Alert
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-sans">CNIC: {selectedClient.cnic} · Client since {new Date(selectedClient.onboardedAt).toLocaleDateString('en-PK', { month: 'short', year: 'numeric' })}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5" onClick={() => setShowLogInteraction(true)}>
                <Plus className="h-3 w-3" /> Log Interaction
              </Button>
              {selectedClient.portalEnabled && (
                <Button size="sm" variant="outline" className="text-xs h-8 gap-1.5">
                  <Eye className="h-3 w-3" /> Client Portal
                </Button>
              )}
            </div>
          </div>

          {/* Quick Info Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Active Cases', value: selectedClient.activeCasesCount, icon: Briefcase, color: 'text-primary' },
              { label: 'Total Billed', value: selectedClient.totalBilled, icon: CreditCard, color: 'text-green-600' },
              { label: 'Outstanding', value: selectedClient.outstandingBalance, icon: TrendingUp, color: selectedClient.outstandingBalance !== '₨ 0' ? 'text-destructive' : 'text-green-600' },
              { label: 'Last Contact', value: new Date(selectedClient.lastContactDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' }), icon: Clock, color: 'text-muted-foreground' },
            ].map((s, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                    <div>
                      <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider">{s.label}</p>
                      <p className="text-sm font-semibold font-sans text-foreground">{s.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detail Tabs */}
          <Tabs value={detailTab} onValueChange={setDetailTab}>
            <TabsList className="bg-secondary/50 h-9">
              <TabsTrigger value="overview" className="text-xs font-sans h-7">Overview</TabsTrigger>
              <TabsTrigger value="cases" className="text-xs font-sans h-7">Cases ({selectedClient.cases.length})</TabsTrigger>
              <TabsTrigger value="communications" className="text-xs font-sans h-7">Communications ({selectedClient.interactions.length})</TabsTrigger>
              <TabsTrigger value="documents" className="text-xs font-sans h-7">Documents ({selectedClient.documents.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Contact Info */}
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold font-sans text-foreground mb-3">Contact Information</h3>
                    <div className="space-y-3 text-xs font-sans">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Shield className="h-3.5 w-3.5 text-primary" />
                        <span className="font-medium text-foreground mr-1">CNIC:</span> {selectedClient.cnic}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" /> {selectedClient.email}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" /> {selectedClient.phone}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MessageSquare className="h-3.5 w-3.5 text-green-600" /> {selectedClient.whatsapp} (WhatsApp)
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" /> {selectedClient.address}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tags & Portal */}
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold font-sans text-foreground mb-3">Tags & Categories</h3>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {selectedClient.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[10px] h-5 gap-1">
                          <Tag className="h-2.5 w-2.5" /> {tag}
                        </Badge>
                      ))}
                    </div>

                    <Separator className="my-3" />

                    <h3 className="text-sm font-semibold font-sans text-foreground mb-2">Client Portal</h3>
                    <div className="flex items-center gap-2">
                      {selectedClient.portalEnabled ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-xs font-sans text-green-600 font-medium">Enabled — Client can view case status</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs font-sans text-muted-foreground">Not enabled</span>
                          <Button size="sm" variant="outline" className="text-[10px] h-6 ml-auto">Enable Portal</Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Interactions */}
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold font-sans text-foreground">Recent Interactions</h3>
                    <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => setDetailTab('communications')}>
                      View All <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {selectedClient.interactions.slice(0, 3).map(interaction => (
                      <div key={interaction.id} className={`flex items-start gap-3 p-2.5 rounded-lg border ${interactionColors[interaction.type]}`}>
                        <div className="mt-0.5">{interactionIcons[interaction.type]}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold font-sans capitalize">{interaction.type}</span>
                            {interaction.duration && <span className="text-[10px] opacity-70">({interaction.duration})</span>}
                          </div>
                          <p className="text-[11px] font-sans mt-0.5 leading-relaxed">{interaction.summary}</p>
                        </div>
                        <span className="text-[10px] font-sans whitespace-nowrap opacity-70">{interaction.date}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cases" className="mt-4 space-y-3">
              {selectedClient.cases.map(cs => (
                <Card key={cs.id} className="border-border/50 hover:shadow-sm transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold font-sans text-foreground">{cs.title}</p>
                        <p className="text-[11px] text-muted-foreground font-sans mt-0.5">{cs.caseNumber} · {cs.court}</p>
                      </div>
                      <Badge variant={cs.status === 'Active' ? 'default' : cs.status === 'Disposed' ? 'secondary' : 'outline'} className="text-[10px] h-5">
                        {cs.status}
                      </Badge>
                    </div>
                    {cs.nextHearing && (
                      <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground font-sans">
                        <Calendar className="h-3 w-3" />
                        Next Hearing: <span className="font-medium text-foreground">{new Date(cs.nextHearing).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="communications" className="mt-4">
              <div className="space-y-2">
                {selectedClient.interactions.map(interaction => (
                  <div key={interaction.id} className={`flex items-start gap-3 p-3 rounded-lg border ${interactionColors[interaction.type]}`}>
                    <div className="mt-0.5">{interactionIcons[interaction.type]}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold font-sans capitalize">{interaction.type}</span>
                        {interaction.duration && (
                          <span className="text-[10px] opacity-70">· {interaction.duration}</span>
                        )}
                      </div>
                      <p className="text-[11px] font-sans leading-relaxed">{interaction.summary}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-sans font-medium">{interaction.date}</p>
                      <p className="text-[10px] font-sans opacity-70">{interaction.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              {selectedClient.documents.length === 0 ? (
                <div className="text-center py-10">
                  <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground font-sans">No documents shared yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedClient.documents.map(doc => (
                    <Card key={doc.id} className="border-border/50">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold font-sans text-foreground">{doc.name}</p>
                            <p className="text-[10px] text-muted-foreground font-sans">{doc.size} · Shared {doc.sharedDate}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-xs h-7">View</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Log Interaction Dialog */}
          <Dialog open={showLogInteraction} onOpenChange={setShowLogInteraction}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-sans text-base">Log Interaction</DialogTitle>
                <DialogDescription className="text-xs font-sans">Record a call, meeting, or message with {selectedClient.contactPerson}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-sans font-medium text-foreground mb-1 block">Type</label>
                  <Select value={newInteraction.type} onValueChange={v => setNewInteraction(p => ({ ...p, type: v }))}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">📞 Phone Call</SelectItem>
                      <SelectItem value="meeting">👥 Meeting</SelectItem>
                      <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                      <SelectItem value="email">📧 Email</SelectItem>
                      <SelectItem value="sms">📱 SMS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-sans font-medium text-foreground mb-1 block">Summary</label>
                  <Textarea
                    placeholder="Brief summary of the interaction..."
                    className="text-xs min-h-[80px] font-sans"
                    value={newInteraction.summary}
                    onChange={e => setNewInteraction(p => ({ ...p, summary: e.target.value }))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowLogInteraction(false)}>Cancel</Button>
                <Button size="sm" className="text-xs bg-primary" onClick={handleLogInteraction} disabled={!newInteraction.summary || loading}>Save Interaction</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── List View ─────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold font-sans text-foreground">Client CRM</h2>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">Manage clients, track interactions, ensure ethical compliance</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="text-xs h-9 gap-1.5" onClick={() => setShowConflictCheck(true)}>
            <Shield className="h-3.5 w-3.5" /> Conflict Check
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground font-sans text-xs gap-1.5 h-9" onClick={() => setShowAddClient(true)}>
            <Plus className="h-3.5 w-3.5" /> Add Client
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Clients', value: stats.total, icon: Users, color: 'text-primary' },
          { label: 'Active', value: stats.active, icon: UserCheck, color: 'text-green-600' },
          { label: 'VIP Clients', value: stats.vip, icon: Star, color: 'text-gold' },
          { label: 'Retention Alerts', value: stats.retentionFlaggeds, icon: Bell, color: 'text-destructive' },
        ].map((s, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2.5">
                <div className={`h-8 w-8 rounded-lg bg-secondary flex items-center justify-center`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider">{s.label}</p>
                  <p className="text-lg font-bold font-sans text-foreground leading-tight">{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, contact, or CNIC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm font-sans bg-card border-border/50"
          />
        </div>
        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-full sm:w-[160px] h-9 text-xs font-sans">
            <Tag className="h-3 w-3 mr-1.5" />
            <SelectValue placeholder="Filter by tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            {allTags.map(tag => (
              <SelectItem key={tag} value={tag}>{tag}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-secondary/50 h-9">
          <TabsTrigger value="all" className="text-xs font-sans h-7">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="active" className="text-xs font-sans h-7">Active ({stats.active})</TabsTrigger>
          <TabsTrigger value="vip" className="text-xs font-sans h-7">VIP ({stats.vip})</TabsTrigger>
          <TabsTrigger value="retention" className="text-xs font-sans h-7">
            {stats.retentionFlaggeds > 0 && <Bell className="h-3 w-3 mr-1 text-destructive" />}
            Alerts ({stats.retentionFlaggeds})
          </TabsTrigger>
          <TabsTrigger value="inactive" className="text-xs font-sans h-7">Inactive</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Client Cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map(client => (
          <Card
            key={client.id}
            className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
            onClick={() => handleClientClick(client)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-border">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold font-sans">
                      {client.contactPerson.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold font-sans text-foreground">{client.fullName}</p>
                      {client.vip && <Star className="h-3 w-3 text-gold fill-gold" />}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-sans">{client.contactPerson}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {client.retentionFlagged && (
                    <div className="h-6 w-6 rounded-full bg-destructive/10 flex items-center justify-center">
                      <Bell className="h-3 w-3 text-destructive" />
                    </div>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => e.stopPropagation()}>
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5 text-[11px] font-sans text-muted-foreground">
                <div className="flex items-center gap-1.5"><Shield className="h-3 w-3 text-primary/60" />{client.cnic}</div>
                <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" />{client.phone}</div>
                <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3" />{client.city}</div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mt-2.5">
                {client.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="text-[9px] h-4 px-1.5">{tag}</Badge>
                ))}
                {client.tags.length > 3 && (
                  <Badge variant="secondary" className="text-[9px] h-4 px-1.5">+{client.tags.length - 3}</Badge>
                )}
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                <div className="flex items-center gap-3 text-[11px] font-sans">
                  <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{client.activeCasesCount} cases</span>
                  <span className="font-semibold text-foreground">{client.totalBilled}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => e.stopPropagation()}>
                    <Phone className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => e.stopPropagation()}>
                    <MessageSquare className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground font-sans">No clients match your search</p>
        </div>
      )}

      {/* Conflict of Interest Check Dialog */}
      <Dialog open={showConflictCheck} onOpenChange={setShowConflictCheck}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-sans text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Conflict of Interest Check
            </DialogTitle>
            <DialogDescription className="text-xs font-sans">
              Search by name or CNIC to check if an opposing party is an existing client
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Enter name or CNIC (e.g., 35202-1234567-1)"
              value={conflictQuery}
              onChange={e => setConflictQuery(e.target.value)}
              className="h-9 text-xs font-sans"
            />
            {conflictQuery.trim() && (
              <div className="space-y-2">
                {conflictResults.length > 0 ? (
                  <>
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/20">
                      <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                      <p className="text-xs font-sans text-destructive font-medium">
                        Potential conflict found — {conflictResults.length} match{conflictResults.length > 1 ? 'es' : ''}
                      </p>
                    </div>
                    {conflictResults.map(c => (
                      <Card key={c.id} className="border-destructive/20">
                        <CardContent className="p-3 flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-destructive/10 text-destructive text-[10px] font-semibold">
                              {c.contactPerson.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-semibold font-sans">{c.fullName}</p>
                            <p className="text-[10px] text-muted-foreground font-sans">CNIC: {c.cnic} · {c.city}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                ) : (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-500/10 border border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <p className="text-xs font-sans text-green-700 font-medium">No conflict found — safe to proceed</p>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => { setShowConflictCheck(false); setConflictQuery(''); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Client Dialog */}
      <Dialog open={showAddClient} onOpenChange={setShowAddClient}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-sans text-base">Add New Client</DialogTitle>
            <DialogDescription className="text-xs font-sans">Enter client details to create a new profile</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-sans font-medium text-foreground mb-1 block">Full Name / Company *</label>
                <Input value={newClientData.fullName} onChange={e => setNewClientData({...newClientData, fullName: e.target.value})} placeholder="e.g., Khan Industries Ltd." className="h-9 text-xs font-sans" />
              </div>
              <div>
                <label className="text-xs font-sans font-medium text-foreground mb-1 block">Contact Person *</label>
                <Input value={newClientData.contactPerson} onChange={e => setNewClientData({...newClientData, contactPerson: e.target.value})} placeholder="e.g., Imran Khan" className="h-9 text-xs font-sans" />
              </div>
            </div>
            <div>
              <label className="text-xs font-sans font-medium text-foreground mb-1 block">CNIC Number *</label>
              <Input value={newClientData.cnic} onChange={e => setNewClientData({...newClientData, cnic: e.target.value})} placeholder="XXXXX-XXXXXXX-X" className="h-9 text-xs font-sans" />
              <p className="text-[10px] text-muted-foreground font-sans mt-1">Pakistani CNIC format: 35202-1234567-1</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-sans font-medium text-foreground mb-1 block">Email</label>
                <Input value={newClientData.email} onChange={e => setNewClientData({...newClientData, email: e.target.value})} placeholder="email@example.com" className="h-9 text-xs font-sans" />
              </div>
              <div>
                <label className="text-xs font-sans font-medium text-foreground mb-1 block">Phone *</label>
                <Input value={newClientData.phone} onChange={e => setNewClientData({...newClientData, phone: e.target.value})} placeholder="+92 3XX XXXXXXX" className="h-9 text-xs font-sans" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-sans font-medium text-foreground mb-1 block">WhatsApp</label>
                <Input value={newClientData.whatsapp} onChange={e => setNewClientData({...newClientData, whatsapp: e.target.value})} placeholder="+92 3XX XXXXXXX" className="h-9 text-xs font-sans" />
              </div>
              <div>
                <label className="text-xs font-sans font-medium text-foreground mb-1 block">City *</label>
                <Select value={newClientData.city} onValueChange={val => setNewClientData({...newClientData, city: val})}>
                  <SelectTrigger className="h-9 text-xs font-sans"><SelectValue placeholder="Select city" /></SelectTrigger>
                  <SelectContent>
                    {['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta'].map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-sans font-medium text-foreground mb-1 block">Address</label>
              <Textarea value={newClientData.address} onChange={e => setNewClientData({...newClientData, address: e.target.value})} placeholder="Full address" className="text-xs min-h-[60px] font-sans" />
            </div>
            <div>
              <label className="text-xs font-sans font-medium text-foreground mb-1 block">Client Tags</label>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map(tag => {
                  const active = newClientData.tags.includes(tag);
                  return (
                    <Badge
                      key={tag}
                      variant={active ? "default" : "outline"}
                      className={`text-[10px] h-5 cursor-pointer transition-colors ${
                        active ? "bg-primary text-primary-foreground" : "hover:bg-primary/10"
                      }`}
                      onClick={() => {
                        const tags = active
                          ? newClientData.tags.filter(t => t !== tag)
                          : [...newClientData.tags, tag];
                        setNewClientData({ ...newClientData, tags });
                      }}
                    >
                      {tag}
                    </Badge>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="vip" checked={newClientData.vip} onChange={e => setNewClientData({...newClientData, vip: e.target.checked})} className="rounded border-border" />
              <label htmlFor="vip" className="text-xs font-sans">Mark as VIP client</label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="portal" className="rounded border-border" />
              <label htmlFor="portal" className="text-xs font-sans">Enable client portal access</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowAddClient(false)}>Cancel</Button>
            <Button size="sm" className="text-xs bg-primary gap-1.5" onClick={handleAddClient} disabled={addingClient || !newClientData.fullName || !newClientData.contactPerson}>
              {addingClient && <Loader2 className="h-3 w-3 animate-spin" />} Create Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
