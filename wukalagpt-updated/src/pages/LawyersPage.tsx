import { useState, useEffect } from 'react';
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
  Award,
  Loader2,
  Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, PublicLawyerProfile, SpecialityResponse } from '@/services/api';
import { toast } from 'sonner';

export default function LawyersPage() {
  const navigate = useNavigate();
  const [lawyers, setLawyers] = useState<PublicLawyerProfile[]>([]);
  const [specialities, setSpecialities] = useState<SpecialityResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialityId, setSelectedSpecialityId] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'rate'>('rating');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [allLawyers, specs] = await Promise.all([
        api.searchLawyers({}), // Fetch all verified lawyers instead of just featured
        api.getSpecialities()
      ]);
      setLawyers(allLawyers);
      setSpecialities(specs);
    } catch (error: any) {
      toast.error("Failed to load lawyers. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const results = await api.searchLawyers({
        query: searchQuery || undefined,
        city: selectedCity === 'all' ? undefined : selectedCity,
        specialityId: selectedSpecialityId === 'all' ? undefined : selectedSpecialityId
      });
      setLawyers(results);
    } catch (error: any) {
      toast.error("Search failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Extract unique cities from featured lawyers or common ones
  const PakistaniCities = [
    'Lahore', 'Karachi', 'Islamabad', 'Faisalabad', 'Rawalpindi', 'Peshawar', 'Quetta', 'Multan', 'Sialkot'
  ];

  const toggleSave = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.saveProfile(id);
      setLawyers(prev => prev.map(l => l.id === id ? { ...l, isSaved: !l.isSaved } : l));
      toast.success("Saved status updated");
    } catch (error: any) {
      toast.error("Failed to update saved status");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-2">
            <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 px-3 py-1">
              Top Rated Legal Experts
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Find Your Legal Partner</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Search through Pakistan's most qualified legal professionals. Connect with experts in Corporate, Family, Criminal and Civil law.
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <Card className="mb-10 border-border bg-card shadow-lg shadow-primary/5">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>

              <select
                value={selectedSpecialityId}
                onChange={(e) => setSelectedSpecialityId(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="all">All Specialities</option>
                {specialities.map(spec => (
                  <option key={spec.id} value={spec.id}>{spec.name}</option>
                ))}
              </select>

              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              >
                <option value="all">All Cities</option>
                {PakistaniCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>

              <Button onClick={handleSearch} className="w-full bg-gradient-primary hover:shadow-lg transition-all">
                <Search className="h-4 w-4 mr-2" />
                Find Lawyers
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-sm text-muted-foreground">
            {isLoading ? (
              <span className="flex items-center gap-2 italic">
                <Loader2 className="h-3 w-3 animate-spin" /> Fetching legal experts...
              </span>
            ) : (
              <span>Found <span className="font-bold text-foreground">{lawyers.length}</span> verified professionals</span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Sort by:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border-none bg-transparent font-bold text-primary focus:ring-0 cursor-pointer"
            >
              <option value="rating">Top Rated</option>
              <option value="experience">Most Experienced</option>
              <option value="rate">Price: Low to High</option>
            </select>
          </div>
        </div>

        {/* Lawyers Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="animate-pulse border-border/50">
                <div className="p-6 flex gap-4">
                  <div className="w-16 h-16 bg-muted rounded-full" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-1/4" />
                    <div className="h-3 bg-muted rounded w-full" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : lawyers.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed border-muted">
            <div className="p-4 bg-background inline-block rounded-full shadow-sm mb-4">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">No results found</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-2 text-sm">
              Try adjusting your filters or search query to find more legal experts.
            </p>
            <p className="text-[11px] text-muted-foreground/60 italic max-w-xs mx-auto">
              Note: Only verified professionals with completed profiles (Image, Bio, Specialities) are listed here to ensure service quality.
            </p>
            <Button variant="link" onClick={() => {
              setSearchQuery('');
              setSelectedCity('all');
              setSelectedSpecialityId('all');
              fetchInitialData();
            }} className="mt-4">
              Reset all filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {lawyers.map((lawyer) => (
              <Card 
                key={lawyer.id} 
                className="group relative hover:shadow-2xl transition-all duration-300 border-border bg-card overflow-hidden cursor-pointer"
                onClick={() => navigate(`/lawyer/${lawyer.id}`)}
              >
                {/* Save Toggle Overlay */}
                <button 
                  onClick={(e) => toggleSave(e, lawyer.id)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border shadow-sm hover:scale-110 transition-transform active:scale-95"
                >
                  <Heart className={cn("h-5 w-5", lawyer.isSaved ? "fill-destructive text-destructive" : "text-muted-foreground")} />
                </button>

                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-16 w-16 md:h-20 md:w-20 border-2 border-primary/10 transition-transform group-hover:scale-105">
                        <AvatarImage src={lawyer.profileImage} alt={lawyer.fullName} />
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xl md:text-2xl font-bold">
                          {lawyer.fullName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 p-1 bg-background rounded-full border border-border">
                        <div className="w-3 h-3 rounded-full bg-success" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg md:text-xl font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {lawyer.fullName}
                        </h3>
                        {lawyer.isVerified && <Award className="h-5 w-5 text-gold fill-gold/10" />}
                      </div>

                      <div className="flex items-center gap-1 text-sm mb-3">
                        <Star className="h-4 w-4 text-warning fill-warning" />
                        <span className="font-bold">{lawyer.rating || 'N/A'}</span>
                        <span className="text-muted-foreground">({lawyer.reviewCount || 0} reviews)</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4 text-xs md:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          <span className="truncate">{lawyer.city}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <GraduationCap className="h-3.5 w-3.5 text-primary" />
                          <span>{lawyer.experienceYears || 0} Years Exp.</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {lawyer.specialities.slice(0, 3).map((spec) => (
                          <Badge key={spec.id} variant="secondary" className="px-2 py-0 text-[10px] uppercase font-bold tracking-wider bg-primary/5 text-primary border-primary/10">
                            {spec.name}
                          </Badge>
                        ))}
                        {lawyer.specialities.length > 3 && (
                          <Badge variant="outline" className="text-[10px]">+{lawyer.specialities.length - 3} more</Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/50">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-tighter">Consultation Fee</span>
                          <span className="text-lg font-bold text-primary">Rs. {(lawyer.hourlyRate || 3000).toLocaleString()} <small className="text-xs text-muted-foreground font-normal">/hr</small></span>
                        </div>
                        <Button 
                          onClick={(e) => { e.stopPropagation(); navigate(`/messages?lawyerId=${lawyer.id}`); }}
                          size="sm" 
                          className="bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Chat
                        </Button>
                      </div>
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