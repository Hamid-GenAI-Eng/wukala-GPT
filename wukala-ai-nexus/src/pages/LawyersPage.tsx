import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  MessageSquare, 
  User,
  GraduationCap,
  Languages,
  Clock,
  Award
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
    description: 'Experienced corporate lawyer with expertise in business formation, mergers, and contract negotiations. Served major multinational companies.',
    hourlyRate: 5000,
    availability: 'available',
    verified: true
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
    description: 'Dedicated family law attorney specializing in women\'s rights and child custody cases. Known for compassionate and effective representation.',
    hourlyRate: 4000,
    availability: 'available',
    verified: true
  },
  {
    id: '3',
    name: 'Adv. Ahmed Ali Khan',
    specialization: ['Criminal Law', 'Civil Rights', 'Constitutional Law'],
    location: 'Islamabad, ICT',
    rating: 4.7,
    reviewCount: 156,
    experience: 15,
    languages: ['Urdu', 'English'],
    description: 'Senior criminal law expert with extensive experience in high-profile cases. Former public prosecutor with deep understanding of Pakistani legal system.',
    hourlyRate: 6000,
    availability: 'busy',
    verified: true
  },
  {
    id: '4',
    name: 'Adv. Sarah Malik',
    specialization: ['Property Law', 'Real Estate', 'Land Disputes'],
    location: 'Lahore, Punjab',
    rating: 4.6,
    reviewCount: 73,
    experience: 6,
    languages: ['Urdu', 'English'],
    description: 'Property law specialist helping clients with real estate transactions, land disputes, and property documentation.',
    hourlyRate: 3500,
    availability: 'available',
    verified: false
  },
  {
    id: '5',
    name: 'Adv. Usman Tariq',
    specialization: ['Labor Law', 'Employment Law', 'Industrial Relations'],
    location: 'Faisalabad, Punjab',
    rating: 4.5,
    reviewCount: 45,
    experience: 9,
    languages: ['Urdu', 'English', 'Punjabi'],
    description: 'Labor law expert representing both employers and employees in workplace disputes, contract negotiations, and compliance matters.',
    hourlyRate: 3000,
    availability: 'offline',
    verified: true
  }
];

const specializations = [
  'All Specializations',
  'Corporate Law',
  'Family Law',
  'Criminal Law',
  'Property Law',
  'Labor Law',
  'Civil Rights',
  'Business Law',
  'Constitutional Law'
];

const locations = [
  'All Locations',
  'Lahore, Punjab',
  'Karachi, Sindh',
  'Islamabad, ICT',
  'Faisalabad, Punjab',
  'Rawalpindi, Punjab',
  'Peshawar, KPK'
];

export default function LawyersPage() {
  const navigate = useNavigate();
  const [lawyers] = useState<Lawyer[]>(mockLawyers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('All Specializations');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'rate'>('rating');

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getAvailabilityText = (availability: string) => {
    switch (availability) {
      case 'available':
        return 'Available Now';
      case 'busy':
        return 'Busy';
      case 'offline':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const filteredLawyers = lawyers
    .filter(lawyer => {
      const matchesSearch = lawyer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lawyer.specialization.some(spec => spec.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesSpecialization = selectedSpecialization === 'All Specializations' ||
        lawyer.specialization.includes(selectedSpecialization);
      const matchesLocation = selectedLocation === 'All Locations' ||
        lawyer.location === selectedLocation;
      
      return matchesSearch && matchesSpecialization && matchesLocation;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'experience':
          return b.experience - a.experience;
        case 'rate':
          return a.hourlyRate - b.hourlyRate;
        default:
          return 0;
      }
    });

  const handleChatWithLawyer = (lawyer: Lawyer) => {
    // In a real app, this would open a chat interface
    console.log('Starting chat with:', lawyer.name);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold font-serif mb-2">Find Legal Experts</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Connect with qualified lawyers across Pakistan for expert legal assistance.
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6 sm:mb-8">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search lawyers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Specialization Filter */}
              <select
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                {specializations.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>

              {/* Location Filter */}
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'rating' | 'experience' | 'rate')}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="rating">Sort by Rating</option>
                <option value="experience">Sort by Experience</option>
                <option value="rate">Sort by Rate (Low to High)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Showing {filteredLawyers.length} lawyer{filteredLawyers.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Lawyers Grid */}
        {filteredLawyers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No lawyers found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or filters.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {filteredLawyers.map((lawyer) => (
              <Card 
                key={lawyer.id} 
                className="group hover:shadow-lg transition-all duration-200 animate-fade-in cursor-pointer"
                onClick={() => navigate(`/lawyer/${lawyer.id}`)}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    {/* Avatar */}
                    <div className="relative">
                      <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                        <AvatarImage src={lawyer.avatar} alt={lawyer.name} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                          {lawyer.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Availability Indicator */}
                      <div className="absolute -bottom-1 -right-1">
                        <div className={cn(
                          'w-5 h-5 rounded-full border-2 border-background',
                          getAvailabilityColor(lawyer.availability)
                        )} />
                      </div>
                    </div>

                    {/* Lawyer Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-base sm:text-lg font-semibold">{lawyer.name}</h3>
                            {lawyer.verified && (
                              <div title="Verified Lawyer">
                                <Award className="h-4 w-4 text-gold" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-medium ml-1">{lawyer.rating}</span>
                              <span className="text-sm text-muted-foreground ml-1">
                                ({lawyer.reviewCount} reviews)
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {lawyer.location}
                            </div>
                            <div className="flex items-center">
                              <GraduationCap className="h-3 w-3 mr-1" />
                              {lawyer.experience} years
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {getAvailabilityText(lawyer.availability)}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-base sm:text-lg font-semibold text-primary">
                            Rs. {lawyer.hourlyRate.toLocaleString()}/hr
                          </div>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/messages');
                            }}
                            disabled={lawyer.availability === 'offline'}
                            className="mt-2 bg-gradient-primary hover:shadow-md transition-all duration-200"
                            size="sm"
                          >
                            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">Chat Now</span>
                            <span className="sm:hidden">Chat</span>
                          </Button>
                        </div>
                      </div>

                      {/* Specializations */}
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-1">
                          {lawyer.specialization.map((spec) => (
                            <Badge
                              key={spec}
                              variant="secondary"
                              className="text-xs"
                            >
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Languages */}
                      <div className="mt-2">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Languages className="h-3 w-3 mr-1" />
                          <span>{lawyer.languages.join(', ')}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                        {lawyer.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}