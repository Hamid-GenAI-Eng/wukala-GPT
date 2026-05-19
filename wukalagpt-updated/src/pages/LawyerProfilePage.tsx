import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Star, 
  Calendar, 
  BookOpen, 
  Award,
  Edit3,
  Save,
  Camera,
  Trash2,
  Plus,
  FileText,
  CheckCircle,
  ExternalLink,
  Loader2,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api, { SpecialityResponse, ExperienceResponse, EducationResponse } from '@/services/api';
import { useToast } from "@/hooks/use-toast";

const LawyerProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.fullName || 'User',
    email: user?.email || '',
    phone: '',
    city: '',
    bio: '',
    specialization: '',
    experience: '',
    education: '',
    barCouncil: '',
    license: '',
    hourlyRate: '0',
    casesWon: '0',
    activeCases: '0',
    responseTime: 'N/A',
    experiences: [] as ExperienceResponse[],
    educations: [] as EducationResponse[],
    specialities: [] as any[],
    profilePhotoUrl: '',
    rating: 0,
    reviewCount: 0,
    isProfileVisible: true,
    isAvailableForNewCases: true,
    receiveEmailNotifications: true,
  });

  const [status, setStatus] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [allSpecialities, setAllSpecialities] = useState<SpecialityResponse[]>([]);
  const [selectedSpecIds, setSelectedSpecIds] = useState<string[]>([]);

  // Dialog State
  const [isExpOpen, setIsExpOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<ExperienceResponse | null>(null);
  const [expForm, setExpForm] = useState({
    role: '',
    firmCompany: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    shortBio: '',
    proofUrl: ''
  });

  const [isEduOpen, setIsEduOpen] = useState(false);
  const [editingEdu, setEditingEdu] = useState<EducationResponse | null>(null);
  const [eduForm, setEduForm] = useState({
    instituteName: '',
    degreeName: '',
    grades: '',
    degreeImageUrl: ''
  });

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      await refreshUser();
      const [data, specs] = await Promise.all([
        api.getLawyerMe(),
        api.getSpecialities()
      ]);

      setAllSpecialities(specs || []);
      
      setProfileData({
        name: data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'User',
        email: data.email || '',
        phone: data.phoneNumber || data.phoneNo || '',
        city: data.city || '',
        bio: data.bio || '',
        specialization: data.degreeTitle || data.specialization || '',
        experience: data.yearsOfExperience?.toString() || '0',
        education: data.university || '',
        barCouncil: data.barAssociation || '',
        license: data.barCouncilNumber || data.licenseNumber || '',
        hourlyRate: data.consultationFee?.toString() || '0',
        casesWon: data.casesWon?.toString() || '0',
        activeCases: data.activeCases?.toString() || '0',
        responseTime: data.responseTime || 'N/A',
        experiences: data.experiences || [],
        educations: data.educations || [],
        specialities: data.specialities || [],
        profilePhotoUrl: data.profilePhotoUrl || '',
        rating: Number(data.rating ?? data.Rating) || 0,
        reviewCount: Number(data.reviewCount ?? data.ReviewCount) || 0,
        isProfileVisible: data.isProfileVisible ?? data.IsProfileVisible ?? true,
        isAvailableForNewCases: data.isAvailableForNewCases ?? data.IsAvailableForNewCases ?? true,
        receiveEmailNotifications: data.receiveEmailNotifications ?? data.ReceiveEmailNotifications ?? true,
      });

      setSelectedSpecIds((data.specialities || []).map((s: any) => s.id));

      let finalStatus = 0;
      const vStatus = data.verificationStatus ?? data.status;
      if (vStatus !== undefined && vStatus !== null) {
        const vStatusStr = String(vStatus).toLowerCase().trim();
        if (vStatusStr === 'approved' || vStatusStr === '1') {
          finalStatus = 1;
        } else if (vStatusStr === 'rejected' || vStatusStr === '2') {
          finalStatus = 2;
        }
      }
      setStatus(finalStatus);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleSetting = async (key: 'isProfileVisible' | 'isAvailableForNewCases' | 'receiveEmailNotifications', currentValue: boolean) => {
    const newValue = !currentValue;
    setProfileData(prev => ({ ...prev, [key]: newValue }));
    
    try {
      const nameParts = profileData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      await api.updateLawyerMe({
        firstName,
        lastName,
        phoneNumber: profileData.phone,
        city: profileData.city,
        bio: profileData.bio,
        consultationFee: parseFloat(profileData.hourlyRate) || 0,
        yearsOfExperience: parseInt(profileData.experience) || 0,
        isProfileVisible: key === 'isProfileVisible' ? newValue : profileData.isProfileVisible,
        isAvailableForNewCases: key === 'isAvailableForNewCases' ? newValue : profileData.isAvailableForNewCases,
        receiveEmailNotifications: key === 'receiveEmailNotifications' ? newValue : profileData.receiveEmailNotifications
      });
      
      toast({
        title: "Setting Updated",
        description: `Successfully updated setting.`,
      });
    } catch (err) {
      console.error('Failed to update setting:', err);
      setProfileData(prev => ({ ...prev, [key]: currentValue }));
      toast({
        title: "Error",
        description: "Failed to update setting. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSpecialityToggle = (id: string) => {
    setSelectedSpecIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setIsEditing(false);
    try {
      const nameParts = profileData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Update core profile fields
      await api.updateLawyerMe({
        firstName,
        lastName,
        phoneNumber: profileData.phone,
        city: profileData.city,
        bio: profileData.bio,
        consultationFee: parseFloat(profileData.hourlyRate) || 0,
        yearsOfExperience: parseInt(profileData.experience) || 0,
        isProfileVisible: profileData.isProfileVisible,
        isAvailableForNewCases: profileData.isAvailableForNewCases,
        receiveEmailNotifications: profileData.receiveEmailNotifications
      });

      // Update specialities interactive list
      await api.updateSpecialities(selectedSpecIds);

      await fetchProfile();
      toast({
        title: "Success",
        description: "Profile updated successfully.",
      });
    } catch (err) {
      console.error('Update failed:', err);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('photo', file);
      try {
        const response = await api.uploadLawyerPhoto(formData);
        setProfileData(prev => ({ ...prev, profilePhotoUrl: response.photoUrl }));
        await fetchProfile();
        toast({
          title: "Success",
          description: "Profile picture updated successfully.",
        });
      } catch (err) {
        console.error('Failed to upload photo:', err);
        toast({
          title: "Error",
          description: "Failed to upload profile picture. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'exp' | 'edu') => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await api.uploadProofDocument(formData);
        if (type === 'exp') {
          setExpForm(prev => ({ ...prev, proofUrl: response.url }));
        } else {
          setEduForm(prev => ({ ...prev, degreeImageUrl: response.url }));
        }
        toast({
          title: "Success",
          description: "Document uploaded successfully.",
        });
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to upload document. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  // --- EXPERIENCE CRUD ---
  const openExpDialog = (exp: ExperienceResponse | null = null) => {
    if (exp) {
      setEditingExp(exp);
      setExpForm({
        role: exp.role || '',
        firmCompany: exp.firmCompany || '',
        startDate: (() => { try { return exp.startDate ? new Date(exp.startDate).toISOString().split('T')[0] : ''; } catch { return ''; } })(),
        endDate: (() => { try { return exp.endDate ? new Date(exp.endDate).toISOString().split('T')[0] : ''; } catch { return ''; } })(),
        isCurrent: exp.isCurrent || false,
        shortBio: exp.shortBio || '',
        proofUrl: exp.proofUrl || ''
      });
    } else {
      setEditingExp(null);
      setExpForm({
        role: '',
        firmCompany: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        shortBio: '',
        proofUrl: ''
      });
    }
    setIsExpOpen(true);
  };

  const saveExperience = async () => {
    try {
      if (!expForm.role || !expForm.firmCompany || !expForm.startDate) {
        toast({ title: "Error", description: "Please fill out all required fields.", variant: "destructive" });
        return;
      }
      const payload = {
        role: expForm.role,
        firmCompany: expForm.firmCompany,
        startDate: expForm.startDate,
        endDate: expForm.isCurrent ? undefined : (expForm.endDate || undefined),
        isCurrent: expForm.isCurrent,
        shortBio: expForm.shortBio,
        proofUrl: expForm.proofUrl || undefined
      };

      if (editingExp) {
        await api.updateExperience(editingExp.id, payload);
        toast({ title: "Success", description: "Experience updated successfully." });
      } else {
        await api.addExperience(payload);
        toast({ title: "Success", description: "Experience added successfully." });
      }
      setIsExpOpen(false);
      await fetchProfile();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save experience.", variant: "destructive" });
    }
  };

  const deleteExperience = async (id: string) => {
    if (confirm("Are you sure you want to delete this experience?")) {
      try {
        await api.deleteExperience(id);
        toast({ title: "Success", description: "Experience deleted successfully." });
        await fetchProfile();
      } catch (err) {
        toast({ title: "Error", description: "Failed to delete experience.", variant: "destructive" });
      }
    }
  };

  // --- EDUCATION CRUD ---
  const openEduDialog = (edu: EducationResponse | null = null) => {
    if (edu) {
      setEditingEdu(edu);
      setEduForm({
        instituteName: edu.instituteName || '',
        degreeName: edu.degreeName || '',
        grades: edu.grades || '',
        degreeImageUrl: edu.degreeImageUrl || ''
      });
    } else {
      setEditingEdu(null);
      setEduForm({
        instituteName: '',
        degreeName: '',
        grades: '',
        degreeImageUrl: ''
      });
    }
    setIsEduOpen(true);
  };

  const saveEducation = async () => {
    try {
      if (!eduForm.instituteName || !eduForm.degreeName) {
        toast({ title: "Error", description: "Please fill out all required fields.", variant: "destructive" });
        return;
      }
      const payload = {
        instituteName: eduForm.instituteName,
        degreeName: eduForm.degreeName,
        grades: eduForm.grades,
        degreeImageUrl: eduForm.degreeImageUrl || undefined
      };

      if (editingEdu) {
        await api.updateEducation(editingEdu.id, payload);
        toast({ title: "Success", description: "Education updated successfully." });
      } else {
        await api.addEducation(payload);
        toast({ title: "Success", description: "Education added successfully." });
      }
      setIsEduOpen(false);
      await fetchProfile();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save education.", variant: "destructive" });
    }
  };

  const deleteEducation = async (id: string) => {
    if (confirm("Are you sure you want to delete this qualification?")) {
      try {
        await api.deleteEducation(id);
        toast({ title: "Success", description: "Education deleted successfully." });
        await fetchProfile();
      } catch (err) {
        toast({ title: "Error", description: "Failed to delete education.", variant: "destructive" });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading profile dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-6 sm:py-8">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Professional Profile
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Manage your professional information and showcase your expertise
              </p>
            </div>
            <Button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="bg-gradient-primary hover:shadow-lg transition-all duration-300"
            >
              {isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit Profile
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Left Column - Profile Overview */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Profile Card */}
            <Card className="overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                <div className="text-center">
                  <div className="relative mb-4">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-gradient-primary rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold overflow-hidden">
                      {profileData.profilePhotoUrl ? (
                        <img src={profileData.profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        profileData.name.split(' ').map(n => n[0]).join('')
                      )}
                    </div>
                    {isEditing && (
                      <div className="absolute bottom-0 right-1/2 translate-x-1/2 translate-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                          id="profile-photo-upload"
                        />
                        <label htmlFor="profile-photo-upload">
                          <Button
                            size="sm"
                            className="w-8 h-8 rounded-full p-0 cursor-pointer"
                            asChild
                          >
                            <span>
                              <Camera className="w-4 h-4" />
                            </span>
                          </Button>
                        </label>
                      </div>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <Input
                      value={profileData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="text-center font-semibold text-lg mb-2"
                    />
                  ) : (
                    <h3 className="font-semibold text-base sm:text-lg text-foreground mb-2">
                      {profileData.name}
                    </h3>
                  )}
                  
                  {status === 1 ? (
                    <Badge variant="secondary" className="mb-4 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200">
                      Verified Lawyer
                    </Badge>
                  ) : status === 2 ? (
                    <Badge variant="destructive" className="mb-4">Rejected</Badge>
                  ) : (
                    <Badge variant="secondary" className="mb-4 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200">Pending Verification</Badge>
                  )}
                  
                  <div className="flex items-center justify-center mb-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(profileData.rating)
                              ? 'fill-gold text-gold'
                              : 'text-muted-foreground/30'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm text-muted-foreground">
                        {profileData.rating > 0 ? profileData.rating.toFixed(1) : 'No ratings'} ({profileData.reviewCount} {profileData.reviewCount === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mt-6">
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 text-muted-foreground mr-3" />
                    {isEditing ? (
                      <Input
                        value={profileData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        type="email"
                        className="text-sm"
                      />
                    ) : (
                      <span className="text-sm truncate">{profileData.email}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-muted-foreground mr-3" />
                    {isEditing ? (
                      <Input
                        value={profileData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="text-sm"
                      />
                    ) : (
                      <span className="text-sm">{profileData.phone || 'N/A'}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 text-muted-foreground mr-3" />
                    {isEditing ? (
                      <Input
                        value={profileData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="text-sm"
                      />
                    ) : (
                      <span className="text-sm">{profileData.city ? `${profileData.city}, Pakistan` : 'N/A'}</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Professional Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Cases Won</span>
                  <span className="font-semibold">{profileData.casesWon}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Cases</span>
                  <span className="font-semibold">{profileData.activeCases}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Response Time</span>
                  <span className="font-semibold">{profileData.responseTime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Consultation Fee</span>
                  {isEditing ? (
                    <Input
                      value={profileData.hourlyRate}
                      onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                      className="w-24 text-right text-sm"
                      placeholder="Fee"
                    />
                  ) : (
                    <span className="font-semibold text-primary font-bold">PKR {Number(profileData.hourlyRate).toLocaleString()} /hr</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Detailed Information */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="about" className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto gap-1">
                <TabsTrigger value="about" className="text-xs sm:text-sm py-2">About</TabsTrigger>
                <TabsTrigger value="specializations" className="text-xs sm:text-sm py-2">Specializations</TabsTrigger>
                <TabsTrigger value="experience" className="text-xs sm:text-sm py-2">Experience</TabsTrigger>
                <TabsTrigger value="education" className="text-xs sm:text-sm py-2">Education</TabsTrigger>
                <TabsTrigger value="settings" className="text-xs sm:text-sm py-2">Settings</TabsTrigger>
              </TabsList>

              {/* ABOUT TAB */}
              <TabsContent value="about" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="w-5 h-5 mr-2 text-primary" />
                      Professional Bio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        value={profileData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        rows={6}
                        placeholder="Tell clients about your experience, legal expertise, accomplishments, and client focus..."
                        className="text-sm leading-relaxed"
                      />
                    ) : (
                      <p className="text-muted-foreground leading-relaxed text-sm whitespace-pre-wrap">
                        {profileData.bio || "No professional bio added yet. Write one to attract more clients."}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Award className="w-5 h-5 mr-2 text-primary" />
                        <span>Specializations & Practices</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <div className="space-y-4">
                        <p className="text-xs text-muted-foreground">Select all target specialities that represent your legal practice:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {allSpecialities.map((spec) => {
                            const isChecked = selectedSpecIds.includes(spec.id);
                            return (
                              <label
                                key={spec.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border text-sm cursor-pointer transition-all ${
                                  isChecked 
                                    ? "bg-primary/5 border-primary text-primary font-bold shadow-sm" 
                                    : "bg-background border-border text-muted-foreground hover:bg-muted/50"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleSpecialityToggle(spec.id)}
                                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span className="truncate">{spec.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {profileData.specialities && profileData.specialities.length > 0 ? (
                          profileData.specialities.map((spec: any, idx: number) => (
                            <Badge key={idx} variant="outline" className="px-3 py-1 bg-primary/5 text-primary border-primary/20 hover:bg-primary/10">
                              {spec.name || spec}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No specializations selected yet. Edit profile to choose yours!</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SPECIALIZATIONS TAB */}
              <TabsContent value="specializations" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-primary animate-pulse" />
                        <span>Practice Specializations Form</span>
                      </div>
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                        {selectedSpecIds.length} Selected
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 text-sm text-foreground flex flex-col gap-1.5 leading-relaxed">
                      <span className="font-bold text-primary">Interactive Specialization Practice Form</span>
                      <span className="text-muted-foreground text-xs">Manage the legal practice areas and domains that appear on your public marketplace profile. Potential clients will filter and search for you based on these certified fields.</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
                      {allSpecialities.map((spec) => {
                        const isChecked = selectedSpecIds.includes(spec.id);
                        return (
                          <div
                            key={spec.id}
                            onClick={() => handleSpecialityToggle(spec.id)}
                            className={`flex items-start gap-3.5 p-4 rounded-xl border text-sm cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] select-none ${
                              isChecked 
                                ? "bg-primary/5 border-primary shadow-sm text-foreground" 
                                : "bg-card border-border hover:bg-muted/40 text-muted-foreground"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              readOnly
                              className="mt-0.5 h-4.5 w-4.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                            />
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <span className={`font-semibold tracking-tight transition-colors ${isChecked ? 'text-primary' : 'text-foreground'}`}>
                                {spec.name}
                              </span>
                              <span className="text-[11px] leading-tight text-muted-foreground/90 font-medium truncate">
                                {spec.description || 'Certified legal domain field'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border/50">
                      <Button 
                        onClick={async () => {
                          try {
                            setIsLoading(true);
                            await api.updateSpecialities(selectedSpecIds);
                            await fetchProfile();
                            toast({
                              title: "Success",
                              description: "Specializations form updated successfully.",
                            });
                          } catch (err: any) {
                            toast({
                              title: "Error",
                              description: err.message || "Failed to update specializations.",
                              variant: "destructive"
                            });
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                        className="bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20 min-w-[150px]"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Update Form
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* EXPERIENCE TAB */}
              <TabsContent value="experience" className="space-y-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Award className="w-5 h-5 mr-2 text-primary" />
                      Professional Experience
                    </CardTitle>
                    <Button onClick={() => openExpDialog()} size="sm" className="bg-primary text-white hover:bg-primary/90">
                      <Plus className="h-4 w-4 mr-1" /> Add Experience
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {profileData.experiences && profileData.experiences.length > 0 ? (
                      <div className="relative border-l border-muted pl-4 space-y-6">
                        {profileData.experiences.map((exp: any) => (
                          <div key={exp.id} className="relative group">
                            {/* Marker */}
                            <div className="absolute -left-[21px] top-1.5 w-3.5 h-3.5 bg-primary rounded-full border-2 border-background" />
                            
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <h4 className="font-bold text-foreground">{exp.role}</h4>
                                <p className="text-sm text-muted-foreground font-medium">{exp.firmCompany}</p>
                                <p className="text-xs text-primary font-semibold flex items-center gap-1.5 mt-0.5">
                                  <Calendar className="h-3 w-3" />
                                  <span>
                                    {new Date(exp.startDate).toLocaleDateString(undefined, {month: 'short', year: 'numeric'})} - 
                                    {exp.isCurrent ? ' Present' : (exp.endDate ? ` ${new Date(exp.endDate).toLocaleDateString(undefined, {month: 'short', year: 'numeric'})}` : '')}
                                  </span>
                                </p>
                                
                                {exp.shortBio && (
                                  <p className="text-sm text-muted-foreground/90 mt-2 bg-muted/20 p-2 rounded-lg leading-relaxed whitespace-pre-wrap">
                                    {exp.shortBio}
                                  </p>
                                )}

                                {exp.proofUrl && (
                                  <a 
                                    href={exp.proofUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-primary font-bold mt-2 hover:underline"
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                    <span>View Employment Proof Document</span>
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>

                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button onClick={() => openExpDialog(exp)} size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button onClick={() => deleteExperience(exp.id)} size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 bg-muted/10 rounded-xl border border-dashed">
                        <Award className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                        <h4 className="font-semibold text-sm">No experience added yet</h4>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">Add your past roles, law firms, and legal positions to build trust with clients.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* EDUCATION TAB */}
              <TabsContent value="education" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BookOpen className="w-5 h-5 mr-2 text-primary" />
                      Education & Credentials
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="education">University / Institute</Label>
                        {isEditing ? (
                          <Input
                            id="education"
                            value={profileData.education}
                            onChange={(e) => handleInputChange('education', e.target.value)}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">{profileData.education || 'N/A'}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="barCouncil">Bar Association</Label>
                        {isEditing ? (
                          <Input
                            id="barCouncil"
                            value={profileData.barCouncil}
                            onChange={(e) => handleInputChange('barCouncil', e.target.value)}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">{profileData.barCouncil || 'N/A'}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="license">License Number</Label>
                        {isEditing ? (
                          <Input
                            id="license"
                            value={profileData.license}
                            onChange={(e) => handleInputChange('license', e.target.value)}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">{profileData.license || 'N/A'}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="experience">Years of Experience</Label>
                        {isEditing ? (
                          <Input
                            id="experience"
                            value={profileData.experience}
                            onChange={(e) => handleInputChange('experience', e.target.value)}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">{profileData.experience} Years</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* DEGREES LIST */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center text-base">
                      <GraduationCap className="w-5 h-5 mr-2 text-primary" />
                      Degrees & Certifications
                    </CardTitle>
                    <Button onClick={() => openEduDialog()} size="sm" className="bg-primary text-white hover:bg-primary/90">
                      <Plus className="h-4 w-4 mr-1" /> Add Qualification
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {profileData.educations && profileData.educations.length > 0 ? (
                      <div className="grid md:grid-cols-2 gap-4">
                        {profileData.educations.map((edu: any) => (
                          <div key={edu.id} className="p-4 rounded-xl border bg-card relative group hover:shadow-md transition-all">
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <h4 className="font-bold text-foreground text-sm">{edu.degreeName}</h4>
                                <p className="text-xs text-muted-foreground font-semibold">{edu.instituteName}</p>
                                <p className="text-xs text-primary font-bold mt-1 bg-primary/5 px-2 py-0.5 rounded-full inline-block">
                                  Grade/Score: {edu.grades || 'N/A'}
                                </p>

                                {edu.degreeImageUrl && (
                                  <a 
                                    href={edu.degreeImageUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-[11px] text-primary font-bold mt-3 hover:underline"
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                    <span>View Degree Certificate</span>
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>

                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2">
                                <Button onClick={() => openEduDialog(edu)} size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground">
                                  <Edit3 className="h-3.5 w-3.5" />
                                </Button>
                                <Button onClick={() => deleteEducation(edu.id)} size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-muted/10 rounded-xl border border-dashed">
                        <GraduationCap className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                        <h4 className="font-semibold text-sm">No degrees uploaded yet</h4>
                        <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">Upload verified copies of your certifications to raise your verification score.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SETTINGS TAB */}
              <TabsContent value="settings" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Profile Visibility</Label>
                        <p className="text-sm text-muted-foreground">Make your profile visible to potential clients on the marketplace</p>
                      </div>
                      <Switch
                        checked={profileData.isProfileVisible}
                        onCheckedChange={() => handleToggleSetting('isProfileVisible', profileData.isProfileVisible)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-border/50 pt-4">
                      <div className="space-y-0.5">
                        <Label>Available for New Cases</Label>
                        <p className="text-sm text-muted-foreground">Indicate if you are currently accepting new case inquiries</p>
                      </div>
                      <Switch
                        checked={profileData.isAvailableForNewCases}
                        onCheckedChange={() => handleToggleSetting('isAvailableForNewCases', profileData.isAvailableForNewCases)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-border/50 pt-4">
                      <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive instant email updates for new messages and case updates</p>
                      </div>
                      <Switch
                        checked={profileData.receiveEmailNotifications}
                        onCheckedChange={() => handleToggleSetting('receiveEmailNotifications', profileData.receiveEmailNotifications)}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* --- EXPERIENCE DIALOG --- */}
      <Dialog open={isExpOpen} onOpenChange={setIsExpOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingExp ? 'Edit Experience' : 'Add Experience'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Role / Job Title</Label>
              <Input
                placeholder="e.g. Senior Partner, Corporate Associate"
                value={expForm.role}
                onChange={(e) => setExpForm(prev => ({ ...prev, role: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Law Firm / Corporate Employer</Label>
              <Input
                placeholder="e.g. Malik & Malik Associates"
                value={expForm.firmCompany}
                onChange={(e) => setExpForm(prev => ({ ...prev, firmCompany: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Start Date</Label>
                <Input
                  type="date"
                  value={expForm.startDate}
                  onChange={(e) => setExpForm(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>End Date</Label>
                <Input
                  type="date"
                  disabled={expForm.isCurrent}
                  value={expForm.isCurrent ? '' : expForm.endDate}
                  onChange={(e) => setExpForm(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isCurrent"
                checked={expForm.isCurrent}
                onChange={(e) => setExpForm(prev => ({ ...prev, isCurrent: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="isCurrent" className="cursor-pointer">Currently employed here</Label>
            </div>

            <div className="space-y-1">
              <Label>Description / Responsibilities</Label>
              <Textarea
                placeholder="Describe your legal focus, primary client work, key achievements..."
                value={expForm.shortBio}
                onChange={(e) => setExpForm(prev => ({ ...prev, shortBio: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Employment Proof (Verification Document)</Label>
              {expForm.proofUrl ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-100 text-xs">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span>File uploaded successfully!</span>
                  </span>
                  <a href={expForm.proofUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ) : (
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleDocumentUpload(e, 'exp')}
                  className="text-xs"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExpOpen(false)}>Cancel</Button>
            <Button onClick={saveExperience}>Save Experience</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- EDUCATION DIALOG --- */}
      <Dialog open={isEduOpen} onOpenChange={setIsEduOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEdu ? 'Edit Qualification' : 'Add Qualification'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Degree / Certification Title</Label>
              <Input
                placeholder="e.g. LL.M, LL.B (Hons), Bar Professional Training Course"
                value={eduForm.degreeName}
                onChange={(e) => setEduForm(prev => ({ ...prev, degreeName: e.target.value }))}
              />
            </div>
            
            <div className="space-y-1">
              <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">University / Institution Name</Label>
              <Input
                placeholder="e.g. Quaid-i-Azam University, University of London"
                value={eduForm.instituteName}
                onChange={(e) => setEduForm(prev => ({ ...prev, instituteName: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label>Grade / Score / Division</Label>
              <Input
                placeholder="e.g. 3.8 CGPA, First Class, Grade A"
                value={eduForm.grades}
                onChange={(e) => setEduForm(prev => ({ ...prev, grades: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Certificate / Degree Proof (Verification Image)</Label>
              {eduForm.degreeImageUrl ? (
                <div className="flex items-center justify-between p-2.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-100 text-xs">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span>Certificate uploaded!</span>
                  </span>
                  <a href={eduForm.degreeImageUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              ) : (
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleDocumentUpload(e, 'edu')}
                  className="text-xs"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEduOpen(false)}>Cancel</Button>
            <Button onClick={saveEducation}>Save Qualification</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LawyerProfilePage;