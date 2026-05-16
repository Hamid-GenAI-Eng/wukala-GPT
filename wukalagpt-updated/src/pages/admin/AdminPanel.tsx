import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Check, X, Clock, Filter, User, FileText, Video, ArrowLeft, Loader2, ShieldAlert, BarChart3, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api, ApiError, LawyerApplication, AdminStats } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

/**
 * Enterprise Admin Control Center
 * Manages lawyer verifications, platform oversight, and analytics.
 */
const AdminPanel = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedApplication, setSelectedApplication] = useState<LawyerApplication | null>(null);
  const [applications, setApplications] = useState<LawyerApplication[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  // Verification Modal State
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verifyAction, setVerifyAction] = useState<'approved' | 'rejected' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Status Mapping Utility
   */
  const mapStatusToNumber = (status: string): number | undefined => {
    switch (status) {
      case 'pending': return 0;
      case 'approved': return 1;
      case 'rejected': return 2;
      default: return undefined;
    }
  };

  const mapNumberToStatus = (statusNum: number | string): string => {
    const s = Number(statusNum);
    switch (s) {
      case 0: return 'pending';
      case 1: return 'approved';
      case 2: return 'rejected';
      default: return 'pending';
    }
  };

  /**
   * Data Fetching
   */
  const fetchData = useCallback(async () => {
    setIsDataLoading(true);
    try {
      const numericStatus = statusFilter !== 'all' ? mapStatusToNumber(statusFilter) : undefined;
      const [apps, dashboardStats] = await Promise.all([
        api.getLawyers(numericStatus),
        api.getAdminStats()
      ]);
      
      setApplications(apps);
      
      // Normalize stats object to handle PascalCase from backend
      if (dashboardStats) {
        const normalized: AdminStats = {
          totalUsers: (dashboardStats as any).totalUsers ?? (dashboardStats as any).TotalUsers ?? 0,
          totalLawyers: (dashboardStats as any).totalLawyers ?? (dashboardStats as any).TotalLawyers ?? 0,
          totalClients: (dashboardStats as any).totalClients ?? (dashboardStats as any).TotalClients ?? 0,
          pendingVerifications: (dashboardStats as any).pendingVerifications ?? (dashboardStats as any).PendingVerifications ?? 0,
          approvedVerifications: (dashboardStats as any).approvedVerifications ?? (dashboardStats as any).ApprovedVerifications ?? 0,
          rejectedVerifications: (dashboardStats as any).rejectedVerifications ?? (dashboardStats as any).RejectedVerifications ?? 0,
          activeChats: (dashboardStats as any).activeChats ?? (dashboardStats as any).ActiveChats ?? 0,
          totalDocuments: (dashboardStats as any).totalDocuments ?? (dashboardStats as any).TotalDocuments ?? 0,
        };
        setStats(normalized);
      }
    } catch (err) {
      console.error('Admin data fetch error:', err);
      toast({
        title: 'Fetch Error',
        description: 'Unable to sync with live backend. Showing fallback data if available.',
        variant: 'destructive'
      });
    } finally {
      setIsDataLoading(false);
    }
  }, [statusFilter, toast]);

  useEffect(() => {
    if (!isAuthLoading && user?.role?.toLowerCase() === 'admin') {
      fetchData();
    }
  }, [user, isAuthLoading, fetchData]);

  useEffect(() => {
    if (!isAuthLoading && (!user || user.role?.toLowerCase() !== 'admin')) {
      navigate('/');
    }
  }, [user, isAuthLoading, navigate]);

  /**
   * Verification Logic
   */
  const openVerifyDialog = (application: LawyerApplication, action: 'approved' | 'rejected') => {
    setSelectedApplication(application);
    setVerifyAction(action);
    setReviewNotes('');
    setIsVerifyModalOpen(true);
  };

  const handleVerifySubmit = async () => {
    if (!selectedApplication || !verifyAction) return;

    setIsProcessing(true);
    console.group(`[Admin] Verification Action: ${verifyAction}`);
    console.log('Target Application ID:', selectedApplication.id);
    console.log('Associated User ID:', selectedApplication.userId || 'MISSING');
    console.log('Status requested:', mapStatusToNumber(verifyAction));
    
    try {
      const numericStatus = mapStatusToNumber(verifyAction)!;
      await api.verifyLawyer(selectedApplication.id, numericStatus, reviewNotes);
      
      console.log('Action successful');
      toast({
        title: `Lawyer ${verifyAction === 'approved' ? 'Verified' : 'Rejected'}`,
        description: `Application for ${selectedApplication.fullName} has been updated.`,
      });
      
      setIsVerifyModalOpen(false);
      fetchData(); 
    } catch (err: any) {
      console.error('Verification Action Failed:', err);
      const errorMessage = err instanceof ApiError ? err.message : 'Connection error';
      const isUserNotFound = errorMessage.toLowerCase().includes('user') && errorMessage.toLowerCase().includes('exist');
      
      toast({
        title: 'Action Failed',
        description: isUserNotFound 
          ? `ORPHAN DATA DETECTED: The backend has a record for this application (${selectedApplication.id}) but cannot find the linked user account (${selectedApplication.userId || 'Unknown'}). Please contact system administrator to manually clean up this ghost record.`
          : errorMessage,
        variant: 'destructive',
        duration: 8000
      });
    } finally {
      console.groupEnd();
      setIsProcessing(false);
    }
  };

  /**
   * Emergency Cleanup Logic
   * Permanently removes an application record that is orphaned or corrupted.
   */
  const handleForceDelete = async () => {
    if (!selectedApplication) return;
    
    if (!window.confirm(`CRITICAL ACTION: Are you sure you want to PERMANENTLY delete the application for ${selectedApplication.fullName}? This cannot be undone and is only used for cleaning up ghost data.`)) return;

    setIsProcessing(true);
    try {
      await api.deleteLawyerApplication(selectedApplication.id);
      toast({
        title: 'System Cleanup Successful',
        description: 'The orphaned application record has been removed from the database.',
      });
      setIsVerifyModalOpen(false);
      setSelectedApplication(null);
      fetchData();
    } catch (err: any) {
      toast({
        title: 'Cleanup Failed',
        description: err instanceof ApiError ? err.message : 'The server does not support force-deletion for this record.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: number | string) => {
    const s = mapNumberToStatus(status);
    switch (s) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><Check className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isAuthLoading || isDataLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium animate-pulse">Initializing Administrative Secure Uplink...</p>
      </div>
    );
  }

  const filteredApplications = applications.filter(app => {
    const searchStr = (searchTerm || '').toLowerCase();
    const fullName = (app?.fullName || '').toLowerCase();
    const email = (app?.email || '').toLowerCase();
    const barId = (app?.barCouncilNumber || '').toLowerCase();
    
    return (
      fullName.includes(searchStr) ||
      email.includes(searchStr) ||
      barId.includes(searchStr)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
      {/* Top Header */}
      <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <ShieldAlert className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">Wukala-GPT Admin Console</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Frontend Site
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Users', value: stats?.totalUsers, icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Pending Lawyers', value: stats?.pendingVerifications, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Approved Pros', value: stats?.approvedVerifications, icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Platform Stats', value: stats?.activeChats, icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50', sub: 'Active Chats' },
          ].map((item, i) => (
            <div key={i} className="bg-card rounded-2xl border p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                <p className="text-3xl font-bold mt-1">{item.value ?? 0}</p>
                {item.sub && <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">{item.sub}</p>}
              </div>
              <div className={`${item.bg} ${item.color} p-3 rounded-xl`}>
                <item.icon className="w-6 h-6" />
              </div>
            </div>
          ))}
        </div>

        {/* Filters and List Section */}
        <div className="bg-card rounded-3xl border shadow-xl overflow-hidden relative">
          <div className="p-6 border-b bg-muted/20 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-96 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search across lawyers, emails, bar IDs..." 
                className="pl-10 h-11 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 h-11 bg-background">
                  <SelectValue placeholder="All Applications" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Applications</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/30 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
                  <th className="px-6 py-4">Applicant</th>
                  <th className="px-6 py-4">City / Region</th>
                  <th className="px-6 py-4">Review Status</th>
                  <th className="px-6 py-4">System Health</th>
                  <th className="px-6 py-4">Submission Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredApplications.length > 0 ? filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 ring-2 ring-primary/10">
                          <AvatarFallback className="bg-gradient-to-br from-primary/10 to-primary/5 text-primary text-xs font-bold">
                            {(app?.fullName || 'U').split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm leading-none mb-1 flex items-center gap-2">
                            {app.fullName}
                            {!app.userId && (
                              <Badge className="bg-red-100 text-red-600 border-red-200 text-[9px] h-4 px-1">GHOST RECORD</Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">{app.email}</p>
                          <p className="text-[10px] font-mono text-muted-foreground bg-muted inline-block px-1 mt-1">ID: {app.barCouncilNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-400 capitalize">{app.city}</td>
                    <td className="px-6 py-4">{getStatusBadge(app.status)}</td>
                    <td className="px-6 py-4">
                      {!app.userId ? (
                        <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 gap-1">
                          <ShieldAlert className="w-3 h-3" /> Ghost Record
                        </Badge>
                      ) : app.isEmailVerified === true ? (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 gap-1">
                          <Check className="w-3 h-3" /> Ready
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 gap-1">
                          <Clock className="w-3 h-3" /> Awaiting Sync
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-muted-foreground">{formatDate(app.submittedAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-9 px-3 gap-2">
                              <Eye className="w-4 h-4" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl overflow-hidden rounded-3xl p-0 border-none shadow-2xl">
                            <div className="bg-primary p-8 text-white relative">
                              <DialogTitle className="sr-only">Lawyer Application: {app?.fullName}</DialogTitle>
                              <DialogDescription className="sr-only">Detailed professional profile and documents for {app?.fullName}</DialogDescription>
                              <div className="relative z-10 flex items-center gap-4">
                                <Avatar className="w-20 h-20 border-4 border-white/20">
                                  <AvatarFallback className="text-2xl font-black bg-white/20">{(app?.fullName || 'U')[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <h2 className="text-2xl font-bold">{app?.fullName || 'Unnamed Professional'}</h2>
                                  <p className="opacity-80 flex items-center gap-2"><MapPin className="w-3 h-3" /> {app.city}</p>
                                </div>
                              </div>
                            </div>
                            <div className="p-8">
                              <Tabs defaultValue="info" className="w-full">
                                <TabsList className="grid w-full grid-cols-3 mb-6 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                  <TabsTrigger value="info" className="rounded-lg">Professional Info</TabsTrigger>
                                  <TabsTrigger value="docs" className="rounded-lg">Assets & Docs</TabsTrigger>
                                  <TabsTrigger value="debug" className="rounded-lg">Diagnostics</TabsTrigger>
                                </TabsList>
                                <TabsContent value="info" className="space-y-4">
                                  <div className="grid grid-cols-2 gap-y-4 text-sm">
                                    <div className="space-y-1">
                                      <p className="text-muted-foreground font-medium">Bar Council ID</p>
                                      <p className="font-semibold">{app.barCouncilNumber}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-muted-foreground font-medium">Degree Program</p>
                                      <p className="font-semibold">{app.degreeTitle}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-muted-foreground font-medium">University</p>
                                      <p className="font-semibold">{app.university}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-muted-foreground font-medium">Completion Yr</p>
                                      <p className="font-semibold">{app.yearOfCompletion}</p>
                                    </div>
                                  </div>
                                  <div className="pt-4 border-t space-y-2">
                                    <p className="text-sm text-muted-foreground font-medium">Chamber Address</p>
                                    <p className="text-sm bg-muted/30 p-3 rounded-lg leading-relaxed">{app.chamberAddress}</p>
                                  </div>
                                </TabsContent>
                                <TabsContent value="docs" className="space-y-3">
                                  {[
                                    { label: 'Academic Degree', icon: FileText, value: app.degree },
                                    { label: 'Introduction Narrative', icon: Video, value: app.introVideo }
                                  ].map((asset, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-muted/20 border rounded-2xl">
                                      <div className="flex items-center gap-3">
                                        <div className="bg-background p-2 rounded-lg"><asset.icon className="w-5 h-5 text-primary" /></div>
                                        <p className="text-sm font-semibold">{asset.label}</p>
                                      </div>
                                      <Button 
                                        variant="secondary" 
                                        size="sm" 
                                        className="rounded-lg h-8"
                                        disabled={!asset.value}
                                        onClick={() => asset.value && window.open(asset.value, '_blank')}
                                      >
                                        {asset.value ? 'Access Asset' : 'Not Provided'}
                                      </Button>
                                    </div>
                                  ))}
                                </TabsContent>
                                <TabsContent value="debug" className="space-y-4">
                                  <div className="space-y-4">
                                    <div className="p-4 rounded-2xl bg-slate-900 text-slate-300 font-mono text-[11px] space-y-3">
                                      <div className="flex justify-between border-b border-slate-800 pb-2">
                                        <span className="text-slate-500">APPLICATION_ID:</span>
                                        <span className="text-amber-400">{app.id}</span>
                                      </div>
                                      <div className="flex justify-between border-b border-slate-800 pb-2">
                                        <span className="text-slate-500">USER_ID_LINK:</span>
                                        <span className={app.userId ? 'text-blue-400' : 'text-red-500'}>{app.userId || 'NULL - DISCONNECTED'}</span>
                                      </div>
                                      <div className="flex justify-between border-b border-slate-800 pb-2">
                                        <span className="text-slate-500">SYSTEM_STATUS:</span>
                                        <span className="capitalize">{mapNumberToStatus(app.status)}</span>
                                      </div>
                                    </div>

                                    <div className="p-5 rounded-2xl border bg-slate-50 dark:bg-slate-900/50 space-y-4">
                                      <div className="flex items-center justify-between pointer-events-none">
                                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Public Visibility Audit</h4>
                                        <Badge variant="outline" className={app.status === 1 ? 'border-emerald-200 text-emerald-600 bg-emerald-50' : 'border-amber-200 text-amber-600 bg-amber-50'}>
                                          {app.status === 1 ? 'Verification Pass' : 'Verification Required'}
                                        </Badge>
                                      </div>
                                      
                                      <div className="grid grid-cols-1 gap-3">
                                        {[
                                          { label: 'Admin Approval', pass: app.status === 1, tip: 'Verification must be "Approved" to show publicly.' },
                                          { label: 'Identity Linked', pass: !!app.userId, tip: 'System account must be linked to the application.' },
                                          { label: 'Profile Completion', pass: !!app.chamberAddress && !!app.city, passText: 'Minimum Data Pass', failText: 'Missing Chamber/City', tip: 'Lawyers must have a valid city and address.' },
                                          { label: 'Search Indexing', pass: app.status === 1 && !!app.userId, tip: 'Only fully approved & linked profiles are searchable.' }
                                        ].map((check, idx) => (
                                          <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-background border transition-all hover:shadow-sm">
                                            {check.pass ? (
                                              <div className="bg-emerald-100 text-emerald-600 p-1 rounded-full"><Check className="w-3.5 h-3.5" /></div>
                                            ) : (
                                              <div className="bg-amber-100 text-amber-600 p-1 rounded-full"><AlertCircle className="w-3.5 h-3.5" /></div>
                                            )}
                                            <div className="space-y-0.5">
                                              <p className="text-xs font-bold">{check.label}: <span className={check.pass ? 'text-emerald-600' : 'text-amber-600'}>{check.pass ? (check.passText || 'Ready') : (check.failText || 'Blocked')}</span></p>
                                              <p className="text-[10px] text-muted-foreground leading-tight">{check.tip}</p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>

                                      {app.status === 1 && app.userId ? (
                                        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 flex gap-3 text-emerald-700">
                                          <Check className="w-5 h-5 shrink-0" />
                                          <div className="space-y-1">
                                            <p className="text-xs font-bold uppercase tracking-tight">Search Result: EXPECTED VISIBLE</p>
                                            <p className="text-[11px] leading-relaxed">This professional should now appear in the public directory. If they are missing, please advise them to log in and add <b>Specialties</b> and a <b>Bio</b> to their profile settings.</p>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 flex gap-3 text-red-600">
                                          <ShieldAlert className="w-5 h-5 shrink-0" />
                                          <div className="space-y-1">
                                            <p className="text-xs font-bold uppercase tracking-tight">Search Result: HIDDEN</p>
                                            <p className="text-[11px] leading-relaxed">This record is hidden from the public directory because it is either unverified or lacks a valid user association. Standard search results exclude incomplete data.</p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="pt-4 border-t space-y-3">
                                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Administrative Recovery Tools</p>
                                      <Button 
                                        variant="destructive" 
                                        size="sm" 
                                        className="w-full bg-red-950/20 hover:bg-red-900/30 text-red-500 border border-red-900/50 rounded-xl h-10 gap-2"
                                        onClick={handleForceDelete}
                                        disabled={isProcessing}
                                      >
                                        <ShieldAlert className="w-4 h-4" />
                                        Force Delete Ghost Record
                                      </Button>
                                    </div>
                                  </div>
                                </TabsContent>
                              </Tabs>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {mapNumberToStatus(app.status) === 'pending' && (
                          <div className="flex items-center gap-2">
                            {app.userId && app.isEmailVerified === true ? (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => openVerifyDialog(app, 'approved')} 
                                  className="bg-emerald-600 hover:bg-emerald-700 h-9 px-4 rounded-xl shadow-lg shadow-emerald-600/10"
                                >
                                  <Check className="w-4 h-4 mr-1.5" /> Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive" 
                                  onClick={() => openVerifyDialog(app, 'rejected')} 
                                  className="h-9 px-4 rounded-xl shadow-lg shadow-destructive/10"
                                >
                                  <X className="w-4 h-4 mr-1.5" /> Reject
                                </Button>
                              </>
                            ) : (
                              <Badge variant="outline" className="h-9 px-3 text-muted-foreground border-dashed bg-slate-50/50">
                                {!app.userId ? 'Sync Broken' : 'Pending OTP'}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="max-w-xs mx-auto space-y-3">
                        <div className="bg-muted rounded-full w-12 h-12 flex items-center justify-center mx-auto opacity-50">
                          <Search className="w-6 h-6" />
                        </div>
                        <p className="text-muted-foreground font-medium">No results matched your search criteria.</p>
                        <Button variant="outline" size="sm" onClick={() => {setSearchTerm(''); setStatusFilter('all');}}>Clear Filters</Button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Verification Action Modal */}
      <Dialog open={isVerifyModalOpen} onOpenChange={setIsVerifyModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              {verifyAction === 'approved' ? (
                <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl"><Check className="w-6 h-6" /></div>
              ) : (
                <div className="bg-red-100 text-red-600 p-2 rounded-xl"><X className="w-6 h-6" /></div>
              )}
              {verifyAction === 'approved' ? 'Approve Registration' : 'Reject Application'}
            </DialogTitle>
            <DialogDescription className="text-left text-muted-foreground mt-2">
              Please finalize your review by {verifyAction === 'approved' ? 'approving' : 'rejecting'} this application. Your notes will be saved to the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-2xl bg-muted/30 border border-slate-200 dark:border-slate-800">
              <p className="text-sm font-semibold mb-1">Applying Action for:</p>
              <p className="text-sm text-muted-foreground">{selectedApplication?.fullName}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reviewNotes" className="text-sm font-bold">Internal Review Notes</Label>
              <Textarea 
                id="reviewNotes" 
                placeholder={verifyAction === 'approved' ? "e.g. Profile verified via Bar Council Database." : "Provide reasons for rejection..."} 
                className="min-h-[120px] rounded-2xl focus-visible:ring-primary"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground italic px-1">Notes are required for audit trail purposes.</p>
            </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-0">
            <Button variant="outline" onClick={() => setIsVerifyModalOpen(false)} className="rounded-xl h-12">Cancel</Button>
            <Button 
              className={`rounded-xl h-12 flex-1 font-bold ${verifyAction === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
              onClick={handleVerifySubmit}
              disabled={isProcessing || !reviewNotes}
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
              Confirm {verifyAction === 'approved' ? 'Verification' : 'Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Internal Map Pin icon for details view
const MapPin = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
);

export default AdminPanel;