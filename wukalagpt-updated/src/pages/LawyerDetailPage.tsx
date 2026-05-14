import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Star, 
  MessageSquare, 
  Phone,
  Mail,
  MapPin, 
  GraduationCap,
  Languages,
  Clock,
  Award,
  Calendar,
  DollarSign,
  Shield,
  BookOpen,
  Users,
  FileText,
  Heart,
  Loader2,
  CheckCircle,
  Globe,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, PublicLawyerProfile } from '@/services/api';
import { toast } from 'sonner';

export default function LawyerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lawyer, setLawyer] = useState<PublicLawyerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (id) {
      fetchLawyerDetail(id);
    }
  }, [id]);

  const fetchLawyerDetail = async (lawyerId: string) => {
    setIsLoading(true);
    try {
      const data = await api.getPublicLawyer(lawyerId);
      setLawyer(data);
    } catch (error: any) {
      toast.error("Failed to load lawyer details.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSave = async () => {
    if (!lawyer) return;
    setIsSaving(true);
    try {
      await api.saveProfile(lawyer.id);
      setLawyer({ ...lawyer, isSaved: !lawyer.isSaved });
      toast.success(lawyer.isSaved ? "Profile removed from favorites" : "Profile added to favorites");
    } catch (error: any) {
      toast.error("Action failed. Please login first.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground animate-pulse">Consulting legal records...</p>
      </div>
    );
  }

  if (!lawyer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-border shadow-2xl">
          <CardContent className="p-10 text-center">
            <div className="p-4 bg-muted/50 rounded-full inline-block mb-6">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Lawyer Not Found</h2>
            <p className="text-muted-foreground mb-8 text-sm">The expert profile you're looking for might have been moved or removed from our directory.</p>
            <Button onClick={() => navigate('/lawyers')} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to Directory
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />

      <div className="container relative px-4 py-8 max-w-5xl mx-auto">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/lawyers')}
            className="hover:bg-primary/5 text-primary-foreground/80 hover:text-primary transition-all group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Lawyers
          </Button>

          <div className="flex items-center gap-3">
            <Button 
              onClick={handleToggleSave}
              disabled={isSaving}
              variant="outline"
              className={cn(
                "rounded-full border-border shadow-sm transition-all active:scale-95",
                lawyer.isSaved ? "bg-destructive/5 text-destructive border-destructive/20 hover:bg-destructive/10" : "hover:bg-muted"
              )}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={cn("h-4 w-4", lawyer.isSaved && "fill-destructive")} />}
              <span className="ml-2 hidden sm:inline">{lawyer.isSaved ? "Saved" : "Save Profile"}</span>
            </Button>
            <Button className="bg-gradient-primary shadow-lg shadow-primary/20">
              Book Appointment
            </Button>
          </div>
        </div>

        {/* Lawyer Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2">
            <Card className="border-border bg-card/50 backdrop-blur-md overflow-hidden shadow-xl shadow-primary/5">
              <div className="h-24 bg-gradient-to-r from-primary/10 via-background to-primary/5 border-b border-border/50" />
              <CardContent className="px-8 pb-8 -mt-12">
                <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-8">
                  <div className="relative">
                    <Avatar className="h-32 w-32 border-4 border-background shadow-2xl">
                      <AvatarImage src={lawyer.profileImage} alt={lawyer.fullName} />
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground text-3xl font-bold">
                        {lawyer.fullName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute bottom-1 right-1 p-1 bg-background rounded-full border border-border">
                      <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center text-[8px] text-white">
                        <CheckCircle className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                      <h1 className="text-3xl font-extrabold tracking-tight">{lawyer.fullName}</h1>
                      {lawyer.isVerified && <Award className="h-7 w-7 text-gold fill-gold/5" />}
                    </div>
                    <p className="text-muted-foreground font-medium mb-3">{lawyer.degreeTitle} • {lawyer.university}</p>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                      <div className="flex items-center gap-1.5">
                        <Star className="h-5 w-5 text-warning fill-warning" />
                        <span className="font-bold text-lg">{lawyer.rating || 'N/A'}</span>
                        <span className="text-muted-foreground text-sm">({lawyer.reviewCount || 0} reviews)</span>
                      </div>
                      <div className="h-1.5 w-1.5 rounded-full bg-border md:block hidden" />
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="font-medium">{lawyer.city}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-2xl border border-border/50">
                  <div className="text-center md:border-r border-border/50">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Experience</p>
                    <p className="text-lg font-bold text-primary">{lawyer.experienceYears}+ <span className="text-xs font-normal">Yrs</span></p>
                  </div>
                  <div className="text-center md:border-r border-border/50">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Hourly Rate</p>
                    <p className="text-lg font-bold text-primary">Rs. {lawyer.hourlyRate?.toLocaleString()}</p>
                  </div>
                  <div className="text-center md:border-r border-border/50">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Success Rate</p>
                    <p className="text-lg font-bold text-primary">94%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Cases</p>
                    <p className="text-lg font-bold text-primary">450+</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border bg-card/80 backdrop-blur-sm shadow-xl flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Contact Information</CardTitle>
              <CardDescription>Professional office details</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-6 pt-2">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/5 rounded-lg">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase opacity-50">Office Address</p>
                    <p className="text-sm font-medium">1st Floor Legal Wing, Tower-X, {lawyer.city}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/5 rounded-lg">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase opacity-50">Direct Line</p>
                    <p className="text-sm font-medium">+92 300 000 0000</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/5 rounded-lg">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase opacity-50">Availability</p>
                    <Badge variant="secondary" className="bg-success/10 text-success border-success/20">Available Now</Badge>
                  </div>
                </div>
              </div>
              
              <Separator />

              <Button 
                onClick={() => navigate(`/messages?lawyerId=${lawyer.id}`)}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold tracking-tight rounded-xl"
              >
                Send Message
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Info Tabs */}
        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="bg-muted/50 p-1 w-full md:w-auto grid grid-cols-2 md:inline-flex border border-border/50">
            <TabsTrigger value="overview" className="px-8">Overview</TabsTrigger>
            <TabsTrigger value="professional" className="px-8">Professional History</TabsTrigger>
            <TabsTrigger value="reviews" className="px-8">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                       <FileText className="h-5 w-5 text-primary" />
                       About {lawyer.fullName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {lawyer.bio || "No professional biography provided yet. This legal expert is currently updating their public profile."}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-border">
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2 text-gold">
                        <Award className="h-5 w-5" />
                        Specializations & Experts
                     </CardTitle>
                   </CardHeader>
                   <CardContent>
                     <div className="flex flex-wrap gap-2">
                       {lawyer.specialities.map(spec => (
                         <div key={spec.id} className="flex flex-col p-4 bg-muted/20 border border-border/50 rounded-xl hover:bg-muted/40 transition-colors cursor-default">
                           <span className="font-bold text-sm tracking-tight">{spec.name}</span>
                           <span className="text-[10px] text-muted-foreground uppercase mt-1">Certified Practice</span>
                         </div>
                       ))}
                     </div>
                   </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border-border bg-primary/5 border-primary/10">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">Quick Certifications</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">PBC Registered Lawyer</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium">{lawyer.degreeTitle} Degree</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Languages className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium tracking-tight">Urdu • English • Punjabi</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="professional" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-foreground/90">
               {/* Experience Section */}
               <div className="space-y-6">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold">Experience Timeline</h3>
                 </div>
                 <div className="pl-4 border-l-2 border-border space-y-8">
                   {lawyer.experiences?.length ? lawyer.experiences.map((exp: any) => (
                     <div key={exp.id} className="relative">
                       <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-background border-4 border-primary" />
                       <div className="space-y-1">
                         <h4 className="font-bold">{exp.title}</h4>
                         <p className="text-sm text-primary font-medium">{exp.company}</p>
                         <p className="text-xs text-muted-foreground italic mb-2">
                           {new Date(exp.startDate).getFullYear()} - {exp.isCurrent ? 'Present' : exp.endDate ? new Date(exp.endDate).getFullYear() : 'N/A'}
                         </p>
                         <p className="text-sm text-muted-foreground leading-relaxed">{exp.description}</p>
                       </div>
                     </div>
                   )) : <p className="text-muted-foreground italic text-sm">Professional experience records pending verification.</p>}
                 </div>
               </div>

               {/* Education Section */}
               <div className="space-y-6">
                 <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <GraduationCap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold">Academic Background</h3>
                 </div>
                 <div className="pl-4 border-l-2 border-border space-y-8">
                   {lawyer.educations?.length ? lawyer.educations.map((edu: any) => (
                     <div key={edu.id} className="relative">
                       <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-background border-4 border-purple-500" />
                       <div className="space-y-1">
                         <h4 className="font-bold">{edu.degree}</h4>
                         <p className="text-sm text-purple-600 font-medium">{edu.institution}</p>
                         <p className="text-xs text-muted-foreground italic mb-2">
                           {new Date(edu.startDate).getFullYear()} - {edu.endDate ? new Date(edu.endDate).getFullYear() : 'N/A'}
                         </p>
                         <p className="text-sm text-muted-foreground leading-relaxed">{edu.description}</p>
                       </div>
                     </div>
                   )) : <>
                    <div className="relative">
                       <div className="absolute -left-[21px] top-1 w-4 h-4 rounded-full bg-background border-4 border-purple-500" />
                       <div className="space-y-1">
                         <h4 className="font-bold">{lawyer.degreeTitle}</h4>
                         <p className="text-sm text-purple-600 font-medium">{lawyer.university}</p>
                         <p className="text-xs text-muted-foreground italic mb-2">Primary Verification Source</p>
                       </div>
                    </div>
                   </>}
                 </div>
               </div>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
             <Card className="border-border">
               <CardContent className="p-12 text-center">
                 <div className="p-4 bg-muted/50 rounded-full inline-block mb-4">
                   <Star className="h-10 w-10 text-muted-foreground" />
                 </div>
                 <h3 className="text-xl font-bold mb-2">No Reviews Yet</h3>
                 <p className="text-muted-foreground max-w-sm mx-auto mb-6 italic">This lawyer has recently joined our platform. Be the first to consult and share your professional experience.</p>
                 <Button variant="outline">Consult This Expert</Button>
               </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}