import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
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
  Camera
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/services/api';
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
    experiences: [] as any[],
    educations: [] as any[],
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

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        await refreshUser();
        const data = await api.getLawyerMe();
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

  const handleSave = async () => {
    setIsEditing(false);
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
        isProfileVisible: profileData.isProfileVisible,
        isAvailableForNewCases: profileData.isAvailableForNewCases,
        receiveEmailNotifications: profileData.receiveEmailNotifications
      });
      await refreshUser();
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
        await refreshUser();
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
                    <Badge variant="secondary" className="mb-4 bg-emerald-100 text-emerald-800">
                      Verified Lawyer
                    </Badge>
                  ) : status === 2 ? (
                    <Badge variant="destructive" className="mb-4">Rejected</Badge>
                  ) : (
                    <Badge variant="secondary" className="mb-4 bg-amber-100 text-amber-800">Pending Verification</Badge>
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
                      <span className="text-sm">{profileData.email}</span>
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
                      <span className="text-sm">{profileData.phone}</span>
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
                      <span className="text-sm">{profileData.city}, Pakistan</span>
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
                    <span className="font-semibold">PKR {profileData.hourlyRate}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Detailed Information */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="about" className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1">
                <TabsTrigger value="about" className="text-xs sm:text-sm py-2">About</TabsTrigger>
                <TabsTrigger value="experience" className="text-xs sm:text-sm py-2">Experience</TabsTrigger>
                <TabsTrigger value="education" className="text-xs sm:text-sm py-2">Education</TabsTrigger>
                <TabsTrigger value="settings" className="text-xs sm:text-sm py-2">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Professional Bio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        value={profileData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        rows={4}
                        placeholder="Tell clients about your experience and expertise..."
                      />
                    ) : (
                      <p className="text-muted-foreground leading-relaxed">{profileData.bio}</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Specializations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {profileData.specialities && profileData.specialities.length > 0 ? (
                        profileData.specialities.map((spec: any, idx: number) => (
                          <Badge key={idx} variant="outline">{spec.name || spec}</Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No specializations added yet.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="experience" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Award className="w-5 h-5 mr-2" />
                      Professional Experience
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {profileData.experiences && profileData.experiences.length > 0 ? (
                      profileData.experiences.map((exp: any, idx: number) => (
                        <div key={idx} className="border-l-2 border-primary pl-4">
                          <h4 className="font-semibold">{exp.role}</h4>
                          <p className="text-sm text-muted-foreground">{exp.firmCompany}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(exp.startDate).getFullYear()} - {exp.isCurrent ? 'Present' : (exp.endDate ? new Date(exp.endDate).getFullYear() : '')}
                          </p>
                          {exp.shortBio && <p className="text-sm mt-2">{exp.shortBio}</p>}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No experience details added yet.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="education" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BookOpen className="w-5 h-5 mr-2" />
                      Education & Credentials
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="education">Education</Label>
                        {isEditing ? (
                          <Input
                            id="education"
                            value={profileData.education}
                            onChange={(e) => handleInputChange('education', e.target.value)}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">{profileData.education}</p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="barCouncil">Bar Council</Label>
                        {isEditing ? (
                          <Input
                            id="barCouncil"
                            value={profileData.barCouncil}
                            onChange={(e) => handleInputChange('barCouncil', e.target.value)}
                          />
                        ) : (
                          <p className="text-sm text-muted-foreground mt-1">{profileData.barCouncil}</p>
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
                          <p className="text-sm text-muted-foreground mt-1">{profileData.license}</p>
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
                          <p className="text-sm text-muted-foreground mt-1">{profileData.experience}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

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
    </div>
  );
};

export default LawyerProfilePage;