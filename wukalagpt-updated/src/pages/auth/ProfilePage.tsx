import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Mail, Phone, MapPin, FileText, Video, Edit2, Trash2, Upload, Clock, CheckCircle, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { api, ApiError, LawyerApplication } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lawyerApplication, setLawyerApplication] = useState<LawyerApplication | null>(null);

  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    role: 'client' as 'client' | 'lawyer' | 'admin',
    status: 'pending' as 'pending' | 'verified' | 'rejected' | 'active',
    // Lawyer specific
    barCouncilNumber: '',
    degreeTitle: '',
    university: '',
    yearOfCompletion: '',
    chamberAddress: '',
    degreeDocument: '',
    introVideo: '',
    profileImage: ''
  });

  useEffect(() => {
    const elements = document.querySelectorAll('.profile-content');
    elements.forEach(element => {
      element.classList.add('animate-fade-in');
    });
  }, []);

  // Fetch profile data from backend
  useEffect(() => {
    const fetchProfile = async () => {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }

      setIsLoading(true);

      try {
        const profileData = await api.getProfile();

        setUserData(prev => ({
          ...prev,
          name: profileData.name,
          email: profileData.email,
          phone: profileData.phoneNo || '',
          city: profileData.city || '',
          role: profileData.role,
          status: profileData.status || 'pending',
          profileImage: profileData.profileImage || '',
        }));

        // If lawyer, fetch application/profile details
        if (profileData.role === 'lawyer') {
          try {
            const application = await api.getLawyerMe();
            setLawyerApplication(application);

            setUserData(prev => ({
              ...prev,
              barCouncilNumber: application.barCouncilNumber || application.BarCouncilNumber,
              degreeTitle: application.degreeTitle || application.DegreeTitle,
              university: application.university || application.University,
              yearOfCompletion: application.yearOfCompletion || application.YearOfCompletion,
              chamberAddress: application.chamberAddress || application.ChamberAddress,
              degreeDocument: application.degree || application.Degree || '',
              introVideo: application.introVideo || application.IntroVideo || '',
              status: application.status,
            }));
          } catch (error) {
            console.log('Could not fetch lawyer application:', error);
          }
        }
      } catch (error) {
        console.error('Profile fetch error:', error);

        if (error instanceof ApiError) {
          toast({
            title: 'Error',
            description: error.message || 'Failed to load profile',
            variant: 'destructive',
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [isAuthenticated, navigate, toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      await api.updateLawyerMe({
        name: userData.name,
        phoneNo: userData.phone,
        city: userData.city,
        ...(userData.role === 'lawyer' && {
          barCouncilNumber: userData.barCouncilNumber,
          degreeTitle: userData.degreeTitle,
          university: userData.university,
          yearOfCompletion: userData.yearOfCompletion,
          chamberAddress: userData.chamberAddress,
        }),
      });

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully',
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);

      if (error instanceof ApiError) {
        toast({
          title: 'Update Failed',
          description: error.message || 'Failed to update profile',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = () => {
    const statusVal = userData.status;
    if (statusVal === 'pending' || statusVal === 0) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending Verification</Badge>;
    }
    if (statusVal === 'verified' || statusVal === 'active' || statusVal === 1) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
    }
    if (statusVal === 'rejected' || statusVal === 2) {
      return <Badge variant="destructive">Rejected</Badge>;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="profile-content bg-card border border-border rounded-2xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20">
                  <AvatarImage src={userData.profileImage} />
                  <AvatarFallback className="text-xl font-bold bg-gradient-primary text-primary-foreground">
                    {userData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{userData.name}</h1>
                  <p className="text-sm sm:text-base text-muted-foreground capitalize">{userData.role}</p>
                  {getStatusBadge()}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant={isEditing ? "outline" : "default"}
                  onClick={() => setIsEditing(!isEditing)}
                  size="sm"
                  className="w-full sm:w-auto"
                  disabled={isSaving}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
                {isEditing && (
                  <Button onClick={handleSave} size="sm" className="w-full sm:w-auto" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                )}
              </div>
            </div>

            {(userData.status === 'pending' || userData.status === 0) && lawyerApplication && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-yellow-800 mb-2">Profile Under Review</h3>
                <p className="text-sm text-yellow-700">
                  Your profile is currently being reviewed by our verification team. This process typically takes 2-3 business days.
                  You'll receive an email notification once your profile is approved.
                </p>
                {lawyerApplication.reviewNotes && (
                  <div className="mt-3 p-3 bg-white rounded border border-yellow-200">
                    <p className="text-xs text-yellow-700 font-medium">Review Notes:</p>
                    <p className="text-sm text-yellow-600">{lawyerApplication.reviewNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile Content */}
          <div className="profile-content bg-card border border-border rounded-2xl shadow-xl">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto">
                <TabsTrigger value="personal" className="text-xs sm:text-sm">Personal Info</TabsTrigger>
                {userData.role === 'lawyer' && <TabsTrigger value="verification" className="text-xs sm:text-sm">Verification</TabsTrigger>}
                {userData.role === 'lawyer' && <TabsTrigger value="documents" className="text-xs sm:text-sm">Documents</TabsTrigger>}
              </TabsList>

              <TabsContent value="personal" className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4">Personal Information</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        name="name"
                        value={userData.name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        value={userData.email}
                        disabled
                        className="pl-10 bg-muted"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        name="phone"
                        value={userData.phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="city"
                        name="city"
                        value={userData.city}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profileImage">Profile Picture</Label>
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={userData.profileImage} />
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                        {userData.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Change Photo
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>

              {userData.role === 'lawyer' && (
                <TabsContent value="verification" className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4">Verification Information</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="barCouncilNumber">Bar Council Number</Label>
                      <Input
                        id="barCouncilNumber"
                        name="barCouncilNumber"
                        value={userData.barCouncilNumber}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="degreeTitle">Degree Title</Label>
                      <Input
                        id="degreeTitle"
                        name="degreeTitle"
                        value={userData.degreeTitle}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="university">University</Label>
                      <Input
                        id="university"
                        name="university"
                        value={userData.university}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="yearOfCompletion">Year of Completion</Label>
                      <Input
                        id="yearOfCompletion"
                        name="yearOfCompletion"
                        value={userData.yearOfCompletion}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chamberAddress">Chamber/Office Address</Label>
                    <Textarea
                      id="chamberAddress"
                      name="chamberAddress"
                      value={userData.chamberAddress}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      rows={3}
                    />
                  </div>
                </TabsContent>
              )}

              {userData.role === 'lawyer' && (
                <TabsContent value="documents" className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4">Uploaded Documents</h3>

                  <div className="space-y-6">
                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-8 h-8 text-primary" />
                          <div>
                            <p className="font-medium text-foreground">Degree Document</p>
                            <p className="text-sm text-muted-foreground">{userData.degreeDocument}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">View</Button>
                          {isEditing && <Button variant="outline" size="sm">Replace</Button>}
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Video className="w-8 h-8 text-primary" />
                          <div>
                            <p className="font-medium text-foreground">Introduction Video</p>
                            <p className="text-sm text-muted-foreground">{userData.introVideo}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Play</Button>
                          {isEditing && <Button variant="outline" size="sm">Replace</Button>}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>

            {/* Danger Zone */}
            <div className="border-t border-border p-4 sm:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button 
                  variant="outline" 
                  className="w-full sm:w-auto border-primary text-primary hover:bg-primary/5"
                  onClick={() => navigate('/change-password')}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Change Security Password
                </Button>
              </div>

              <h3 className="text-base sm:text-lg font-semibold text-destructive mb-4">Danger Zone</h3>
              <Button variant="destructive" className="w-full sm:w-auto" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
