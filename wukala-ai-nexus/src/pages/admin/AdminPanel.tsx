import { useState, useEffect } from 'react';
import { Search, Eye, Check, X, Clock, Filter, User, FileText, Video, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
// Using CSS animations instead

interface LawyerApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  barCouncilNumber: string;
  degreeTitle: string;
  university: string;
  yearOfCompletion: string;
  chamberAddress: string;
  degreeDocument: string;
  introVideo: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

const AdminPanel = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<LawyerApplication | null>(null);

  useEffect(() => {
    console.log('AdminPanel useEffect - isLoading:', isLoading, 'user:', user);
    console.log('AdminPanel useEffect - user role:', user?.role);
    
    // Wait for auth to fully load before making navigation decisions
    if (isLoading) {
      console.log('Auth is still loading...');
      return; // Still loading auth, don't redirect yet
    }
    
    // Only redirect if user is loaded and is not admin
    if (!user || user.role !== 'admin') {
      console.log('User is not admin, redirecting to home');
      navigate('/');
    } else {
      console.log('User is admin, staying on admin page');
    }
  }, [user, isLoading, navigate]);

  // Show loading state while authentication is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render admin panel if user is not admin (will redirect via useEffect)
  if (!user || user.role !== 'admin') {
    return null;
  }
  const [applications, setApplications] = useState<LawyerApplication[]>([]);

  // Load applications from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('lawyer_applications');
      if (stored) setApplications(JSON.parse(stored));
    } catch {}
  }, []);

  // Remove the problematic CSS animation that might be causing visual issues
  useEffect(() => {
    console.log('AdminPanel animation effect running');
  }, []);

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.barCouncilNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (applicationId: string, newStatus: 'approved' | 'rejected') => {
    setApplications(prev => {
      const updated = prev.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      );
      try {
        localStorage.setItem('lawyer_applications', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    
    // Success animation using CSS
    const element = document.querySelector(`[data-application-id="${applicationId}"]`);
    if (element) {
      element.classList.add('animate-scale-in');
      setTimeout(() => element.classList.remove('animate-scale-in'), 400);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = {
    pending: applications.filter(app => app.status === 'pending').length,
    approved: applications.filter(app => app.status === 'approved').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
    total: applications.length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="admin-content">
          {/* Header */}
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Admin Panel</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Manage lawyer verification applications</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 w-full sm:w-auto"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
            <div className="bg-card border border-border rounded-lg p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-muted-foreground">Total Applications</p>
                  <p className="text-xl lg:text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
                <User className="w-6 h-6 lg:w-8 lg:h-8 text-primary" />
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-xl lg:text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-600" />
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-muted-foreground">Approved</p>
                  <p className="text-xl lg:text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <Check className="w-6 h-6 lg:w-8 lg:h-8 text-green-600" />
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-muted-foreground">Rejected</p>
                  <p className="text-xl lg:text-2xl font-bold text-red-600">{stats.rejected}</p>
                </div>
                <X className="w-6 h-6 lg:w-8 lg:h-8 text-red-600" />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-card border border-border rounded-lg p-4 lg:p-6 mb-8">
            <div className="flex flex-col space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or bar council number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full lg:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Applications List */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Lawyer Applications</h2>
            </div>
            
            <div className="divide-y divide-border">
              {filteredApplications.map((application) => (
                <div
                  key={application.id}
                  data-application-id={application.id}
                  className="p-4 lg:p-6 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex items-center space-x-3 lg:space-x-4">
                      <Avatar className="w-10 h-10 lg:w-12 lg:h-12 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground text-sm">
                          {application.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground text-sm lg:text-base truncate">{application.name}</h3>
                        <p className="text-xs lg:text-sm text-muted-foreground truncate">{application.email}</p>
                        <p className="text-xs lg:text-sm text-muted-foreground">Bar Council: {application.barCouncilNumber}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col lg:flex-row lg:items-center space-y-3 lg:space-y-0 lg:space-x-4">
                      <div className="flex items-center justify-between lg:block lg:text-right">
                        <div>
                          <p className="text-xs lg:text-sm text-muted-foreground">{formatDate(application.submittedAt)}</p>
                          <p className="text-xs lg:text-sm text-muted-foreground">{application.city}</p>
                        </div>
                        <div className="lg:mt-2">
                          {getStatusBadge(application.status)}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedApplication(application)}
                              className="text-xs"
                            >
                              <Eye className="w-3 h-3 lg:w-4 lg:h-4 lg:mr-2" />
                              <span className="hidden lg:inline">View Details</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Application Details - {application.name}</DialogTitle>
                            </DialogHeader>
                            {selectedApplication && (
                              <Tabs defaultValue="personal" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                  <TabsTrigger value="personal">Personal Info</TabsTrigger>
                                  <TabsTrigger value="verification">Verification</TabsTrigger>
                                  <TabsTrigger value="documents">Documents</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="personal" className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Full Name</Label>
                                      <p className="text-sm text-muted-foreground">{selectedApplication.name}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Email</Label>
                                      <p className="text-sm text-muted-foreground">{selectedApplication.email}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Phone</Label>
                                      <p className="text-sm text-muted-foreground">{selectedApplication.phone}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">City</Label>
                                      <p className="text-sm text-muted-foreground">{selectedApplication.city}</p>
                                    </div>
                                  </div>
                                </TabsContent>
                                
                                <TabsContent value="verification" className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-sm font-medium">Bar Council Number</Label>
                                      <p className="text-sm text-muted-foreground">{selectedApplication.barCouncilNumber}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Degree</Label>
                                      <p className="text-sm text-muted-foreground">{selectedApplication.degreeTitle}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">University</Label>
                                      <p className="text-sm text-muted-foreground">{selectedApplication.university}</p>
                                    </div>
                                    <div>
                                      <Label className="text-sm font-medium">Year of Completion</Label>
                                      <p className="text-sm text-muted-foreground">{selectedApplication.yearOfCompletion}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium">Chamber Address</Label>
                                    <p className="text-sm text-muted-foreground">{selectedApplication.chamberAddress}</p>
                                  </div>
                                </TabsContent>
                                
                                <TabsContent value="documents" className="space-y-4">
                                  <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                      <div className="flex items-center space-x-3">
                                        <FileText className="w-8 h-8 text-primary" />
                                        <div>
                                          <p className="font-medium">Degree Document</p>
                                          <p className="text-sm text-muted-foreground">{selectedApplication.degreeDocument}</p>
                                        </div>
                                      </div>
                                      <Button variant="outline" size="sm">View Document</Button>
                                    </div>
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                      <div className="flex items-center space-x-3">
                                        <Video className="w-8 h-8 text-primary" />
                                        <div>
                                          <p className="font-medium">Introduction Video</p>
                                          <p className="text-sm text-muted-foreground">{selectedApplication.introVideo}</p>
                                        </div>
                                      </div>
                                      <Button variant="outline" size="sm">Play Video</Button>
                                    </div>
                                  </div>
                                </TabsContent>
                              </Tabs>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        {application.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(application.id, 'approved')}
                              className="bg-green-600 hover:bg-green-700 text-xs"
                            >
                              <Check className="w-3 h-3 lg:w-4 lg:h-4 lg:mr-2" />
                              <span className="hidden lg:inline">Approve</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleStatusChange(application.id, 'rejected')}
                              className="text-xs"
                            >
                              <X className="w-3 h-3 lg:w-4 lg:h-4 lg:mr-2" />
                              <span className="hidden lg:inline">Reject</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;