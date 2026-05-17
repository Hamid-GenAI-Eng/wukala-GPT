import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Heart, 
  MessageSquare, 
  Loader2, 
  Lock, 
  Camera, 
  Trash2, 
  CheckCircle, 
  Scale, 
  ExternalLink,
  Users,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { api, PublicLawyerProfile } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ClientProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isDynamicMode = !!id;
  const isOwnProfile = !isDynamicMode || id === user?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    city: '',
    preferredArea: 'General Law',
    status: 'Active',
    profileImage: ''
  });

  const [savedLawyers, setSavedLawyers] = useState<PublicLawyerProfile[]>([]);
  const [isLoadingLawyers, setIsLoadingLawyers] = useState(false);

  // Security Form
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
    if (isOwnProfile) {
      fetchSavedLawyers();
    }
  }, [id, user]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      if (isOwnProfile) {
        const data = await api.getProfile();
        setProfileData({
          id: data.id,
          name: data.name || '',
          email: data.email || '',
          phone: data.phoneNo || '',
          city: data.city || '',
          preferredArea: 'General Practice',
          status: 'Active',
          profileImage: data.profileImage || ''
        });
      } else {
        // If lawyer or admin wants to view a specific client by ID
        const data = await api.getClientDetail(id!);
        setProfileData({
          id: data.id,
          name: data.fullName || data.name || 'Client User',
          email: data.email || '',
          phone: data.phoneNumber || data.phoneNo || '',
          city: data.city || '',
          preferredArea: data.preferredLegalArea || 'General Practice',
          status: data.isArchived ? 'Archived' : 'Active',
          profileImage: data.profilePhotoUrl || ''
        });
      }
    } catch (error: any) {
      console.error("Failed to load client profile", error);
      toast.error("Failed to load client profile details");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSavedLawyers = async () => {
    setIsLoadingLawyers(true);
    try {
      const data = await api.getSavedProfiles();
      setSavedLawyers(data || []);
    } catch (error) {
      console.error("Failed to fetch saved lawyers", error);
    } finally {
      setIsLoadingLawyers(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnProfile) return;

    setIsSaving(true);
    try {
      await api.updateClientProfile(profileData.id, {
        fullName: profileData.name,
        phoneNumber: profileData.phone,
        city: profileData.city,
        preferredLegalArea: profileData.preferredArea
      });
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }

    setIsSaving(true);
    try {
      await api.changePassword({
        currentPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success("Password changed successfully!");
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUnsaveLawyer = async (lawyerId: string) => {
    try {
      await api.saveProfile(lawyerId);
      setSavedLawyers(prev => prev.filter(l => l.id !== lawyerId));
      toast.success("Lawyer removed from saved list");
    } catch (error) {
      toast.error("Failed to update saved list");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Consulting Client Dossier...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />

      <div className="container relative px-4 py-8 max-w-6xl mx-auto">
        
        {/* Profile Header Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          <Card className="lg:col-span-2 border-border bg-card/50 backdrop-blur-md overflow-hidden shadow-xl shadow-primary/5">
            <div className="h-28 bg-gradient-to-r from-emerald-500/10 via-background to-emerald-500/5 border-b border-border/50" />
            <CardContent className="px-8 pb-8 -mt-12">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                
                <div className="relative group">
                  <Avatar className="h-28 w-28 border-4 border-background shadow-2xl">
                    <AvatarImage src={profileData.profileImage} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-3xl font-extrabold">
                      {profileData.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {isOwnProfile && (
                    <button className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                      <Camera className="h-6 w-6 text-white" />
                    </button>
                  )}
                </div>

                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                    <h1 className="text-3xl font-extrabold tracking-tight">{profileData.name}</h1>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      Client Portal
                    </Badge>
                  </div>
                  <p className="text-muted-foreground font-medium mb-3">{profileData.email}</p>
                  
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-primary" /> {profileData.city || 'N/A'}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-border" />
                    <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-success" /> Verified Account</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Summary Card */}
          <Card className="border-border bg-card/85 backdrop-blur-sm shadow-xl flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Dashboard Summary</CardTitle>
              <CardDescription>Activity and metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/40 rounded-xl border border-border/50 text-center">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Saved Lawyers</p>
                  <p className="text-2xl font-bold text-primary">{savedLawyers.length}</p>
                </div>
                <div className="p-3 bg-muted/40 rounded-xl border border-border/50 text-center">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Status</p>
                  <p className="text-sm font-extrabold text-emerald-600 flex items-center justify-center gap-1 mt-2">
                    <CheckCircle className="h-4 w-4" /> {profileData.status}
                  </p>
                </div>
              </div>
              
              <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 flex items-center gap-3">
                <Scale className="h-5 w-5 text-primary flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-extrabold text-primary">Preferred Legal Area</h4>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">{profileData.preferredArea}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Menu Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 w-full md:w-auto grid grid-cols-3 md:inline-flex border border-border/50">
            <TabsTrigger value="profile" className="px-6 text-xs font-bold">Profile Info</TabsTrigger>
            {isOwnProfile && <TabsTrigger value="saved" className="px-6 text-xs font-bold">Saved Partners</TabsTrigger>}
            {isOwnProfile && <TabsTrigger value="security" className="px-6 text-xs font-bold">Security</TabsTrigger>}
          </TabsList>

          {/* Profile Form Tab */}
          <TabsContent value="profile">
            <Card className="border border-border bg-card/60 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Account Details
                </CardTitle>
                <CardDescription>
                  {isOwnProfile ? "Manage your contact credentials and preferences." : "Public details for this client."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Full Name</label>
                      <Input 
                        disabled={!isOwnProfile}
                        value={profileData.name} 
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        className="h-11 rounded-xl" 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Email Address</label>
                      <Input 
                        disabled
                        value={profileData.email} 
                        className="h-11 rounded-xl bg-muted/50 text-muted-foreground" 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Phone Number</label>
                      <Input 
                        disabled={!isOwnProfile}
                        value={profileData.phone} 
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        className="h-11 rounded-xl" 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">City</label>
                      <Input 
                        disabled={!isOwnProfile}
                        value={profileData.city} 
                        onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                        className="h-11 rounded-xl" 
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Preferred Practice Area</label>
                      <select 
                        disabled={!isOwnProfile}
                        value={profileData.preferredArea} 
                        onChange={(e) => setProfileData({...profileData, preferredArea: e.target.value})}
                        className="w-full h-11 bg-background border border-input rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="General Practice">General Practice</option>
                        <option value="Criminal Law">Criminal Law</option>
                        <option value="Corporate & Business">Corporate & Business</option>
                        <option value="Family & Divorce">Family & Divorce</option>
                        <option value="Taxation">Taxation</option>
                        <option value="Intellectual Property">Intellectual Property</option>
                        <option value="Real Estate">Real Estate</option>
                      </select>
                    </div>

                  </div>

                  {isOwnProfile && (
                    <Button 
                      disabled={isSaving}
                      type="submit" 
                      className="bg-primary hover:bg-primary/95 text-white font-bold h-11 px-8 rounded-xl"
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Save Changes
                    </Button>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Saved Lawyers Tab */}
          <TabsContent value="saved">
            <Card className="border border-border bg-card/60 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-destructive fill-destructive" />
                  Saved Legal Experts
                </CardTitle>
                <CardDescription>Lawyers you have pinned for quick consultation.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingLawyers ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                ) : savedLawyers.length === 0 ? (
                  <div className="text-center py-14 max-w-sm mx-auto">
                    <Heart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-bold mb-2">No Saved Partners Yet</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed mb-6">Explore the directory to find and save verified top legal specialists.</p>
                    <Button onClick={() => navigate('/lawyers')} className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl">
                      Browse Lawyers
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {savedLawyers.map(lawyer => (
                      <div 
                        key={lawyer.id} 
                        className="p-4 bg-muted/20 border border-border/50 rounded-2xl flex items-center justify-between gap-4 hover:border-primary/30 transition-all group cursor-pointer"
                        onClick={() => navigate(`/lawyer/${lawyer.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-12 w-12 border border-border shadow-sm">
                            <AvatarImage src={lawyer.profileImage} />
                            <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold">
                              {lawyer.fullName.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-bold text-sm group-hover:text-primary transition-colors flex items-center gap-1.5">
                              {lawyer.fullName}
                              {lawyer.isVerified && <Badge variant="outline" className="text-[9px] bg-success/5 text-success border-success/20 px-1.5 py-0">Verified</Badge>}
                            </h4>
                            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{lawyer.degreeTitle || 'Legal Specialist'}</p>
                            <p className="text-[10px] text-muted-foreground/80 mt-0.5">{lawyer.city}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleUnsaveLawyer(lawyer.id)}
                            className="text-destructive hover:bg-destructive/10 rounded-full"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            onClick={() => navigate(`/messages?lawyerId=${lawyer.id}`)}
                            size="sm" 
                            className="bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-xs"
                          >
                            <MessageSquare className="h-3.5 w-3.5 mr-1" />
                            Chat
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="border border-border bg-card/60 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Security Settings
                </CardTitle>
                <CardDescription>Maintain your portal credentials securely.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Current Password</label>
                    <Input 
                      type="password"
                      value={passwordForm.oldPassword}
                      onChange={e => setPasswordForm({...passwordForm, oldPassword: e.target.value})}
                      className="h-11 rounded-xl"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">New Password</label>
                    <Input 
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                      className="h-11 rounded-xl"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase">Confirm New Password</label>
                    <Input 
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                      className="h-11 rounded-xl"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <Button 
                    disabled={isSaving}
                    type="submit" 
                    className="bg-primary hover:bg-primary/95 text-white font-bold h-11 px-8 rounded-xl"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Update Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

      </div>
    </div>
  );
}
