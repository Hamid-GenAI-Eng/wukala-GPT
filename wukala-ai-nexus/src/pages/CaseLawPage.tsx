import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Bookmark, BookmarkCheck, Calendar, Scale, FileText, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CaseLaw {
  id: string;
  title: string;
  caseNumber: string;
  court: string;
  date: string;
  category: string;
  summary: string;
  fullText: string;
  tags: string[];
}

const mockCaseLaws: CaseLaw[] = [
  {
    id: "1",
    title: "State v. Johnson",
    caseNumber: "2023-CR-1234",
    court: "Supreme Court",
    date: "2023-08-15",
    category: "Criminal Law",
    summary: "Landmark ruling on the admissibility of digital evidence in criminal proceedings.",
    fullText: "In this case, the court established new standards for the authentication and admissibility of digital evidence. The ruling emphasizes the need for proper chain of custody documentation and expert testimony regarding digital forensic procedures. This decision has significant implications for law enforcement practices and defense strategies in cases involving electronic evidence.",
    tags: ["Digital Evidence", "Criminal Procedure", "Forensics"]
  },
  {
    id: "2",
    title: "Smith Corp v. Anderson LLC",
    caseNumber: "2023-CV-5678",
    court: "Court of Appeals",
    date: "2023-07-22",
    category: "Contract Law",
    summary: "Decision clarifying force majeure clauses in commercial contracts during pandemic.",
    fullText: "The court examined the interpretation of force majeure clauses in the context of COVID-19 pandemic disruptions. The ruling provides guidance on when extraordinary circumstances excuse contractual performance and the burden of proof required to invoke such clauses. This case has become essential reading for commercial litigation attorneys.",
    tags: ["Contract Law", "Force Majeure", "Commercial"]
  },
  {
    id: "3",
    title: "Davis v. Metropolitan City",
    caseNumber: "2023-CIV-9012",
    court: "District Court",
    date: "2023-09-10",
    category: "Civil Rights",
    summary: "Ruling on municipal liability for law enforcement misconduct.",
    fullText: "This decision addresses the standards for establishing municipal liability under Section 1983 for law enforcement misconduct. The court clarified the requirements for proving a custom or policy that led to constitutional violations. The ruling has important implications for civil rights litigation and police accountability.",
    tags: ["Civil Rights", "Municipal Liability", "Police Misconduct"]
  },
  {
    id: "4",
    title: "Thompson v. State Tax Board",
    caseNumber: "2023-TAX-3456",
    court: "Supreme Court",
    date: "2023-06-05",
    category: "Tax Law",
    summary: "Interpretation of nexus requirements for state taxation of online businesses.",
    fullText: "The court addressed when online businesses have sufficient nexus with a state to justify taxation. This ruling updates previous standards in light of modern e-commerce practices and provides clarity for businesses operating across multiple jurisdictions. The decision has significant implications for online retailers and state revenue departments.",
    tags: ["Tax Law", "E-commerce", "Nexus"]
  },
  {
    id: "5",
    title: "Martinez Family Trust v. IRS",
    caseNumber: "2023-EST-7890",
    court: "Tax Court",
    date: "2023-05-18",
    category: "Estate Law",
    summary: "Valuation methods for closely-held business interests in estate taxation.",
    fullText: "This case established guidelines for valuing closely-held business interests for estate tax purposes. The court discussed various valuation methodologies and the application of discounts for lack of marketability and minority interests. Essential reading for estate planning attorneys and tax professionals.",
    tags: ["Estate Law", "Valuation", "Tax"]
  },
  {
    id: "6",
    title: "Green Energy Inc. v. EPA",
    caseNumber: "2023-ENV-2345",
    court: "Federal Circuit",
    date: "2023-04-12",
    category: "Environmental Law",
    summary: "Challenge to new emissions regulations under the Clean Air Act.",
    fullText: "The court upheld new EPA emissions regulations, finding them within the agency's statutory authority under the Clean Air Act. The decision discusses the balance between environmental protection and economic considerations. This ruling impacts energy companies and environmental compliance strategies.",
    tags: ["Environmental Law", "Regulations", "Clean Air Act"]
  }
];

export default function CaseLawPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourt, setSelectedCourt] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [bookmarkedCases, setBookmarkedCases] = useState<string[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseLaw | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Load bookmarks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("bookmarkedCases");
    if (saved) {
      setBookmarkedCases(JSON.parse(saved));
    }
  }, []);

  // Save bookmarks to localStorage
  const toggleBookmark = (caseId: string) => {
    const newBookmarks = bookmarkedCases.includes(caseId)
      ? bookmarkedCases.filter(id => id !== caseId)
      : [...bookmarkedCases, caseId];
    
    setBookmarkedCases(newBookmarks);
    localStorage.setItem("bookmarkedCases", JSON.stringify(newBookmarks));
  };

  const filteredCases = mockCaseLaws.filter(caseLaw => {
    const matchesSearch = 
      caseLaw.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseLaw.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseLaw.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseLaw.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCourt = selectedCourt === "all" || caseLaw.court === selectedCourt;
    const matchesCategory = selectedCategory === "all" || caseLaw.category === selectedCategory;
    
    return matchesSearch && matchesCourt && matchesCategory;
  });

  const bookmarkedCaseLaws = mockCaseLaws.filter(caseLaw => 
    bookmarkedCases.includes(caseLaw.id)
  );

  const openCaseDetail = (caseLaw: CaseLaw) => {
    setSelectedCase(caseLaw);
    setIsDialogOpen(true);
  };

  const CaseCard = ({ caseLaw }: { caseLaw: CaseLaw }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg mb-1 sm:mb-2 break-words">
              {caseLaw.title}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {caseLaw.caseNumber}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => toggleBookmark(caseLaw.id)}
            className="shrink-0 self-start"
          >
            {bookmarkedCases.includes(caseLaw.id) ? (
              <BookmarkCheck className="h-4 w-4 sm:h-5 sm:w-5 fill-primary text-primary" />
            ) : (
              <Bookmark className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            <Scale className="h-3 w-3 mr-1" />
            {caseLaw.court}
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            {new Date(caseLaw.date).toLocaleDateString()}
          </Badge>
          <Badge className="text-xs">{caseLaw.category}</Badge>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2">
          {caseLaw.summary}
        </p>
        
        <div className="flex flex-wrap gap-1.5">
          {caseLaw.tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        
        <Button 
          onClick={() => openCaseDetail(caseLaw)}
          className="w-full sm:w-auto"
          size="sm"
        >
          <FileText className="h-4 w-4 mr-2" />
          Read Full Case
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Case Law Library</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Search, read, and bookmark court judgments and legal precedents
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-3 sm:space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by case name, number, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 sm:h-11"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Select value={selectedCourt} onValueChange={setSelectedCourt}>
              <SelectTrigger className="h-10">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Courts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courts</SelectItem>
                <SelectItem value="Supreme Court">Supreme Court</SelectItem>
                <SelectItem value="Court of Appeals">Court of Appeals</SelectItem>
                <SelectItem value="District Court">District Court</SelectItem>
                <SelectItem value="Tax Court">Tax Court</SelectItem>
                <SelectItem value="Federal Circuit">Federal Circuit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-10">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Criminal Law">Criminal Law</SelectItem>
                <SelectItem value="Contract Law">Contract Law</SelectItem>
                <SelectItem value="Civil Rights">Civil Rights</SelectItem>
                <SelectItem value="Tax Law">Tax Law</SelectItem>
                <SelectItem value="Estate Law">Estate Law</SelectItem>
                <SelectItem value="Environmental Law">Environmental Law</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabs for All Cases and Bookmarked */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="all" className="text-sm sm:text-base">
            All Cases ({filteredCases.length})
          </TabsTrigger>
          <TabsTrigger value="bookmarked" className="text-sm sm:text-base">
            <Bookmark className="h-4 w-4 mr-1.5" />
            Bookmarked ({bookmarkedCaseLaws.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {filteredCases.length === 0 ? (
            <Card className="p-8 sm:p-12 text-center">
              <Scale className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-base sm:text-lg text-muted-foreground">
                No cases found matching your criteria
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredCases.map(caseLaw => (
                <CaseCard key={caseLaw.id} caseLaw={caseLaw} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookmarked">
          {bookmarkedCaseLaws.length === 0 ? (
            <Card className="p-8 sm:p-12 text-center">
              <BookmarkCheck className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-base sm:text-lg text-muted-foreground mb-2">
                No bookmarked cases yet
              </p>
              <p className="text-sm text-muted-foreground">
                Bookmark cases to save them for quick access later
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {bookmarkedCaseLaws.map(caseLaw => (
                <CaseCard key={caseLaw.id} caseLaw={caseLaw} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Case Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0">
          {selectedCase && (
            <>
              <DialogHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-lg sm:text-xl md:text-2xl mb-2 break-words">
                      {selectedCase.title}
                    </DialogTitle>
                    <DialogDescription className="text-sm">
                      {selectedCase.caseNumber}
                    </DialogDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleBookmark(selectedCase.id)}
                    className="shrink-0"
                  >
                    {bookmarkedCases.includes(selectedCase.id) ? (
                      <BookmarkCheck className="h-5 w-5 fill-primary text-primary" />
                    ) : (
                      <Bookmark className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </DialogHeader>
              
              <ScrollArea className="h-[60vh] px-4 sm:px-6">
                <div className="space-y-4 pb-6">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs sm:text-sm">
                      <Scale className="h-3 w-3 mr-1" />
                      {selectedCase.court}
                    </Badge>
                    <Badge variant="outline" className="text-xs sm:text-sm">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(selectedCase.date).toLocaleDateString()}
                    </Badge>
                    <Badge className="text-xs sm:text-sm">{selectedCase.category}</Badge>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg mb-2">Summary</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      {selectedCase.summary}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg mb-2">Full Decision</h3>
                    <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                      {selectedCase.fullText}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-base sm:text-lg mb-2">Keywords</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedCase.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs sm:text-sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
