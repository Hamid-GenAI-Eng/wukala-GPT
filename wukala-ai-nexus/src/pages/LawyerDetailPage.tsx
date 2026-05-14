import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Lawyer {
  id: string;
  name: string;
  specialization: string[];
  location: string;
  rating: number;
  reviewCount: number;
  experience: number;
  languages: string[];
  description: string;
  hourlyRate: number;
  availability: 'available' | 'busy' | 'offline';
  avatar?: string;
  verified: boolean;
  education: string[];
  certifications: string[];
  cases: number;
  successRate: number;
  email: string;
  phone: string;
  bio: string;
  services: string[];
  achievements: string[];
}

const mockLawyers: Lawyer[] = [
  {
    id: '1',
    name: 'Adv. Muhammad Hassan',
    specialization: ['Corporate Law', 'Business Law', 'Contract Law'],
    location: 'Lahore, Punjab',
    rating: 4.9,
    reviewCount: 127,
    experience: 12,
    languages: ['Urdu', 'English', 'Punjabi'],
    description: 'Experienced corporate lawyer with expertise in business formation, mergers, and contract negotiations.',
    hourlyRate: 5000,
    availability: 'available',
    verified: true,
    education: ['LLB from Punjab University Law College', 'LLM Corporate Law from University of London'],
    certifications: ['Pakistan Bar Council License', 'Corporate Law Specialist Certificate'],
    cases: 450,
    successRate: 94,
    email: 'hassan@lawfirm.pk',
    phone: '+92-301-1234567',
    bio: 'Muhammad Hassan is a distinguished corporate lawyer with over 12 years of experience in Pakistani corporate law. He has successfully represented major multinational companies in complex business transactions, mergers and acquisitions, and regulatory compliance matters. His expertise spans across company formation, contract negotiations, intellectual property rights, and cross-border transactions. Hassan is known for his strategic thinking and ability to navigate complex legal frameworks while ensuring business objectives are met.',
    services: [
      'Business Formation & Corporate Structure',
      'Mergers & Acquisitions',
      'Contract Drafting & Review',
      'Regulatory Compliance',
      'Intellectual Property Protection',
      'Cross-border Transactions',
      'Corporate Governance',
      'Employment Law Compliance'
    ],
    achievements: [
      'Successfully completed 50+ merger transactions worth over PKR 10 billion',
      'Recognized as "Corporate Lawyer of the Year" by Pakistan Legal Awards 2023',
      'Published articles in leading legal journals on corporate governance',
      'Regular speaker at business law conferences'
    ]
  },
  {
    id: '2',
    name: 'Adv. Fatima Sheikh',
    specialization: ['Family Law', 'Women Rights', 'Child Custody'],
    location: 'Karachi, Sindh',
    rating: 4.8,
    reviewCount: 89,
    experience: 8,
    languages: ['Urdu', 'English', 'Sindhi'],
    description: 'Dedicated family law attorney specializing in women\'s rights and child custody cases.',
    hourlyRate: 4000,
    availability: 'available',
    verified: true,
    education: ['LLB from Karachi University', 'Diploma in Human Rights Law'],
    certifications: ['Sindh Bar Council License', 'Women Rights Advocacy Certificate'],
    cases: 320,
    successRate: 91,
    email: 'fatima@familylaw.pk',
    phone: '+92-321-9876543',
    bio: 'Fatima Sheikh is a compassionate and dedicated family law attorney with a strong focus on protecting women\'s rights and children\'s welfare. With 8 years of experience, she has handled complex divorce proceedings, child custody disputes, domestic violence cases, and inheritance matters. Her approach combines legal expertise with emotional intelligence, ensuring clients receive both strong legal representation and the support they need during difficult times.',
    services: [
      'Divorce & Separation Proceedings',
      'Child Custody & Visitation Rights',
      'Domestic Violence Protection',
      'Women\'s Property Rights',
      'Inheritance & Succession Planning',
      'Marriage Contract Drafting',
      'Mediation & Family Counseling',
      'Adoption Procedures'
    ],
    achievements: [
      'Successfully secured custody for 95% of child welfare cases',
      'Established legal aid clinic for underprivileged women',
      'Advocate for legislative reforms in family law',
      'Published research on women\'s rights in Islamic law'
    ]
  }
];

const mockReviews = [
  {
    id: '1',
    clientName: 'Ahmad Ali',
    rating: 5,
    review: 'Excellent legal service. Very professional and knowledgeable. Helped me with my business incorporation seamlessly.',
    date: '2024-01-15',
    verified: true
  },
  {
    id: '2',
    clientName: 'Sarah Khan',
    rating: 5,
    review: 'Outstanding lawyer! Guided me through a complex contract negotiation with great expertise and patience.',
    date: '2024-01-10',
    verified: true
  },
  {
    id: '3',
    clientName: 'Business Client',
    rating: 4,
    review: 'Professional service and timely delivery. Highly recommended for corporate matters.',
    date: '2024-01-05',
    verified: false
  }
];

export default function LawyerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const lawyer = mockLawyers.find(l => l.id === id);

  if (!lawyer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Lawyer Not Found</h2>
            <p className="text-muted-foreground mb-4">The lawyer profile you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/lawyers')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lawyers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getAvailabilityText = (availability: string) => {
    switch (availability) {
      case 'available': return 'Available Now';
      case 'busy': return 'Busy';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 sm:py-8 max-w-4xl mx-auto">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/lawyers')}
          className="mb-4 sm:mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Lawyers
        </Button>

        {/* Lawyer Header */}
        <Card className="mb-6 sm:mb-8">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
              {/* Avatar and Availability */}
              <div className="relative flex-shrink-0 mx-auto sm:mx-0">
                <Avatar className="h-24 w-24 sm:h-32 sm:w-32">
                  <AvatarImage src={lawyer.avatar} alt={lawyer.name} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg sm:text-2xl">
                    {lawyer.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2">
                  <div className={cn(
                    'w-6 h-6 sm:w-8 sm:h-8 rounded-full border-4 border-background',
                    getAvailabilityColor(lawyer.availability)
                  )} />
                </div>
              </div>

              {/* Basic Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center justify-center sm:justify-start space-x-2 mb-2">
                      <h1 className="text-xl sm:text-2xl font-bold">{lawyer.name}</h1>
                      {lawyer.verified && (
                        <div title="Verified Lawyer">
                          <Award className="h-5 w-5 sm:h-6 sm:w-6 text-gold" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-center sm:justify-start space-x-2 mb-3">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 fill-current" />
                        <span className="text-base sm:text-lg font-semibold ml-1">{lawyer.rating}</span>
                        <span className="text-sm sm:text-base text-muted-foreground ml-1">
                          ({lawyer.reviewCount} reviews)
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 mb-4 text-sm sm:text-base text-muted-foreground">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {lawyer.location}
                      </div>
                      <div className="flex items-center">
                        <GraduationCap className="h-4 w-4 mr-1" />
                        {lawyer.experience} years exp.
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {getAvailabilityText(lawyer.availability)}
                      </div>
                    </div>
                  </div>

                  <div className="text-center sm:text-right">
                    <div className="text-xl sm:text-2xl font-bold text-primary mb-3">
                      Rs. {lawyer.hourlyRate.toLocaleString()}/hr
                    </div>
                    <Button
                      onClick={() => navigate('/messages')}
                      disabled={lawyer.availability === 'offline'}
                      className="bg-gradient-primary hover:shadow-lg transition-all duration-200"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message Now
                    </Button>
                  </div>
                </div>

                {/* Specializations */}
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    {lawyer.specialization.map((spec) => (
                      <Badge key={spec} variant="secondary" className="text-xs sm:text-sm">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-2" />
              <div className="text-lg sm:text-2xl font-bold">{lawyer.cases}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Cases Handled</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-2" />
              <div className="text-lg sm:text-2xl font-bold">{lawyer.successRate}%</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Success Rate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-2" />
              <div className="text-lg sm:text-2xl font-bold">{lawyer.reviewCount}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Happy Clients</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary mx-auto mb-2" />
              <div className="text-lg sm:text-2xl font-bold">{lawyer.experience}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">Years Experience</div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Information Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="services" className="text-xs sm:text-sm">Services</TabsTrigger>
            <TabsTrigger value="qualifications" className="text-xs sm:text-sm">Education</TabsTrigger>
            <TabsTrigger value="reviews" className="text-xs sm:text-sm">Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">About {lawyer.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {lawyer.bio}
                </p>
                
                <Separator />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Languages className="h-4 w-4 mr-2" />
                      Languages
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {lawyer.languages.map(lang => (
                        <Badge key={lang} variant="outline" className="text-xs">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Mail className="h-4 w-4 mr-2" />
                      Contact Information
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center">
                        <Mail className="h-3 w-3 mr-2 text-muted-foreground" />
                        {lawyer.email}
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-3 w-3 mr-2 text-muted-foreground" />
                        {lawyer.phone}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Key Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {lawyer.achievements.map((achievement, index) => (
                    <li key={index} className="flex items-start text-sm sm:text-base">
                      <Star className="h-4 w-4 text-gold mr-2 mt-0.5 flex-shrink-0" />
                      {achievement}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Legal Services Offered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {lawyer.services.map((service, index) => (
                    <div key={index} className="p-3 sm:p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start">
                        <Shield className="h-5 w-5 text-primary mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-sm sm:text-base">{service}</h4>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="qualifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2" />
                  Education & Certifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Education</h4>
                  <ul className="space-y-2">
                    {lawyer.education.map((edu, index) => (
                      <li key={index} className="flex items-start text-sm sm:text-base">
                        <BookOpen className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                        {edu}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-semibold mb-3">Professional Certifications</h4>
                  <ul className="space-y-2">
                    {lawyer.certifications.map((cert, index) => (
                      <li key={index} className="flex items-start text-sm sm:text-base">
                        <Award className="h-4 w-4 text-gold mr-2 mt-0.5 flex-shrink-0" />
                        {cert}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <div className="space-y-4">
              {mockReviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {review.clientName.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm sm:text-base">{review.clientName}</span>
                            {review.verified && (
                              <Badge variant="secondary" className="text-xs">Verified</Badge>
                            )}
                          </div>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-4 w-4",
                                  i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {new Date(review.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground">{review.review}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}