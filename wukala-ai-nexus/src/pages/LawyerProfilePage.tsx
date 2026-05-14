import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

const LawyerProfilePage = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || 'John Doe',
    email: user?.email || 'john.doe@example.com',
    phone: '+92 300 1234567',
    city: 'Lahore',
    bio: 'Experienced corporate lawyer with 10+ years in commercial law, mergers & acquisitions, and regulatory compliance.',
    specialization: 'Corporate Law',
    experience: '10 years',
    education: 'LLB from Punjab University Law College',
    barCouncil: 'Punjab Bar Council',
    license: 'PBC-2014-12345',
    hourlyRate: '15,000'
  });

  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>(user?.status as any || 'pending');

  useEffect(() => {
    if (!user?.email) return;
    try {
      const stored = localStorage.getItem('lawyer_applications');
      if (stored) {
        const apps = JSON.parse(stored) as Array<any>;
        const app = apps.find((a) => a.email === user.email);
        if (app && app.status) setStatus(app.status);
      }
    } catch {}
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setIsEditing(false);
    // Here you would typically save to backend
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
                    <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-gradient-primary rounded-full flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
                      {profileData.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    {isEditing && (
                      <Button
                        size="sm"
                        className="absolute bottom-0 right-1/2 translate-x-1/2 translate-y-2 w-8 h-8 rounded-full p-0"
                      >
                        <Camera className="w-4 h-4" />
                      </Button>
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
                  
                  {status === 'approved' ? (
                    <Badge variant="secondary" className="mb-4">
                      Verified Lawyer
                    </Badge>
                  ) : status === 'rejected' ? (
                    <Badge variant="destructive" className="mb-4">Rejected</Badge>
                  ) : (
                    <Badge variant="secondary" className="mb-4">Pending Verification</Badge>
                  )}
                  
                  <div className="flex items-center justify-center mb-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-4 h-4 fill-gold text-gold" />
                      ))}
                      <span className="ml-2 text-sm text-muted-foreground">4.9 (127 reviews)</span>
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
                  <span className="font-semibold">142</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Cases</span>
                  <span className="font-semibold">18</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Response Time</span>
                  <span className="font-semibold">2 hours</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Hourly Rate</span>
                  {isEditing ? (
                    <Input
                      value={profileData.hourlyRate}
                      onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                      className="w-20 text-right text-sm"
                      placeholder="Rate"
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
                      <Badge variant="outline">Corporate Law</Badge>
                      <Badge variant="outline">Contract Law</Badge>
                      <Badge variant="outline">Mergers & Acquisitions</Badge>
                      <Badge variant="outline">Regulatory Compliance</Badge>
                      <Badge variant="outline">Commercial Litigation</Badge>
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
                    <div className="border-l-2 border-primary pl-4">
                      <h4 className="font-semibold">Senior Partner</h4>
                      <p className="text-sm text-muted-foreground">Khan & Associates Law Firm</p>
                      <p className="text-xs text-muted-foreground">2020 - Present</p>
                      <p className="text-sm mt-2">Leading corporate law division with focus on M&A transactions and regulatory matters.</p>
                    </div>
                    
                    <div className="border-l-2 border-primary pl-4">
                      <h4 className="font-semibold">Associate Lawyer</h4>
                      <p className="text-sm text-muted-foreground">Legal Solutions LLP</p>
                      <p className="text-xs text-muted-foreground">2016 - 2020</p>
                      <p className="text-sm mt-2">Specialized in commercial contracts and litigation matters.</p>
                    </div>
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
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Profile Visibility</Label>
                        <p className="text-sm text-muted-foreground">Make your profile visible to potential clients</p>
                      </div>
                      <Button variant="outline" size="sm">Public</Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Available for New Cases</Label>
                        <p className="text-sm text-muted-foreground">Accept new case inquiries</p>
                      </div>
                      <Button variant="outline" size="sm">Available</Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive email updates for new inquiries</p>
                      </div>
                      <Button variant="outline" size="sm">Enabled</Button>
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