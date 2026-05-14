import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Star,
  Download,
  Eye,
  Bookmark,
  Clock,
  User,
  Scale,
  FileText,
  Library,
  Grid,
  List,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data for legal books and documents
const mockBooks = [
  {
    id: 1,
    title: "Constitution of Pakistan 1973",
    subtitle: "Complete Text with Amendments",
    author: "Government of Pakistan",
    category: "Constitutional Law",
    type: "Constitution",
    pages: 156,
    year: 2023,
    language: "English/Urdu",
    description: "The complete constitution of Pakistan with all amendments up to 2023. Essential reading for understanding Pakistan's legal framework.",
    rating: 4.9,
    downloads: 15420,
    bookmarked: true,
    articles: [
      { id: 1, title: "Article 1: The Republic", page: 1 },
      { id: 2, title: "Article 8: Laws inconsistent with fundamental rights", page: 15 },
      { id: 3, title: "Article 25: Equality of citizens", page: 23 }
    ]
  },
  {
    id: 2,
    title: "Pakistan Penal Code",
    subtitle: "Act XLV of 1860",
    author: "Legislative Assembly",
    category: "Criminal Law",
    type: "Code",
    pages: 324,
    year: 2022,
    language: "English",
    description: "Complete Pakistan Penal Code with latest amendments and interpretations by superior courts.",
    rating: 4.7,
    downloads: 12350,
    bookmarked: false,
    articles: [
      { id: 1, title: "Section 302: Punishment for murder", page: 156 },
      { id: 2, title: "Section 420: Cheating", page: 198 },
      { id: 3, title: "Section 506: Criminal intimidation", page: 245 }
    ]
  },
  {
    id: 3,
    title: "Contract Act 1872",
    subtitle: "Law of Contracts in Pakistan",
    author: "British India Legislature",
    category: "Civil Law",
    type: "Act",
    pages: 89,
    year: 2021,
    language: "English",
    description: "Comprehensive guide to contract law in Pakistan, including modern interpretations and case law.",
    rating: 4.6,
    downloads: 8750,
    bookmarked: true,
    articles: [
      { id: 1, title: "Section 10: What agreements are contracts", page: 12 },
      { id: 2, title: "Section 73: Compensation for breach", page: 45 },
      { id: 3, title: "Section 124: Contract of indemnity", page: 67 }
    ]
  }
];

const categories = [
  "Constitutional Law", "Criminal Law", "Civil Law", "Corporate Law", 
  "Property Law", "Family Law", "Tax Law", "Labor Law", "Administrative Law"
];

const bookTypes = ["Constitution", "Code", "Act", "Rules", "Ordinance", "Case Law"];

export default function DictionaryPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [sortBy, setSortBy] = useState('title');
  const [sortOrder, setSortOrder] = useState('asc');

  const filteredBooks = mockBooks.filter(book => {
    const matchesSearch = searchQuery === '' || 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.articles.some(article => 
        article.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesCategory = selectedCategory === 'All' || book.category === selectedCategory;
    const matchesType = selectedType === 'All' || book.type === selectedType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    let aValue, bValue;
    switch (sortBy) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'year':
        aValue = a.year;
        bValue = b.year;
        break;
      case 'rating':
        aValue = a.rating;
        bValue = b.rating;
        break;
      default:
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient-primary mb-2">Legal Dictionary</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Comprehensive collection of legal books, acts, and documents</p>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Sidebar Filters - Collapsible on mobile */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6 order-2 lg:order-1">
            {/* Search */}
            <Card className="bg-glass border-white/20">
              <CardHeader>
                <CardTitle className="text-lg">Search</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search books, articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card className="bg-glass border-white/20">
              <CardHeader>
                <CardTitle className="text-lg">Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant={selectedCategory === 'All' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory('All')}
                  >
                    All Categories
                  </Button>
                  {categories.map(category => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? 'default' : 'ghost'}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Document Types */}
            <Card className="bg-glass border-white/20">
              <CardHeader>
                <CardTitle className="text-lg">Document Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button
                    variant={selectedType === 'All' ? 'default' : 'ghost'}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setSelectedType('All')}
                  >
                    All Types
                  </Button>
                  {bookTypes.map(type => (
                    <Button
                      key={type}
                      variant={selectedType === type ? 'default' : 'ghost'}
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setSelectedType(type)}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6 order-1 lg:order-2">
            {/* Sort Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs sm:text-sm text-muted-foreground">Sort:</span>
                <Button
                  variant={sortBy === 'title' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('title')}
                  className="text-xs sm:text-sm h-8"
                >
                  Title
                </Button>
                <Button
                  variant={sortBy === 'year' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('year')}
                  className="text-xs sm:text-sm h-8"
                >
                  Year
                </Button>
                <Button
                  variant={sortBy === 'rating' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('rating')}
                  className="text-xs sm:text-sm h-8"
                >
                  Rating
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="h-8 w-8 p-0"
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {sortedBooks.length} books found
              </span>
            </div>

            {/* Books Grid/List */}
            <div className={cn(
              viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6'
                : 'space-y-3 sm:space-y-4'
            )}>
              {sortedBooks.map(book => (
                <Card 
                  key={book.id} 
                  className={cn(
                    "group hover:shadow-xl transition-all duration-300 bg-glass border-white/20 cursor-pointer",
                    viewMode === 'list' && 'flex flex-row'
                  )}
                  onClick={() => setSelectedBook(book)}
                >
                  {viewMode === 'grid' ? (
                    <>
                      <div className="relative overflow-hidden rounded-t-lg">
                        <div className="h-32 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <BookOpen className="h-12 w-12 text-primary/60" />
                        </div>
                        <Badge className="absolute top-3 right-3 bg-primary/90">
                          {book.type}
                        </Badge>
                        {book.bookmarked && (
                          <Bookmark className="absolute top-3 left-3 h-5 w-5 text-yellow-500 fill-current" />
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="outline" className="text-xs">{book.category}</Badge>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Star className="h-3 w-3 mr-1 fill-current text-yellow-500" />
                            {book.rating}
                          </div>
                        </div>
                        <h3 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors line-clamp-2">
                          {book.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mb-2">{book.subtitle}</p>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{book.description}</p>
                        <div className="flex justify-between items-center text-xs text-muted-foreground mb-3">
                          <span className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {book.author}
                          </span>
                          <span className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {book.year}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" className="flex-1 text-xs">
                            <Eye className="h-3 w-3 mr-1" />
                            Read
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 text-xs">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </CardContent>
                    </>
                  ) : (
                    <div className="flex w-full">
                      <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center rounded-l-lg">
                        <BookOpen className="h-8 w-8 text-primary/60" />
                      </div>
                      <CardContent className="flex-1 p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="outline" className="text-xs">{book.category}</Badge>
                              <Badge className="text-xs bg-primary/90">{book.type}</Badge>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Star className="h-3 w-3 mr-1 fill-current text-yellow-500" />
                                {book.rating}
                              </div>
                            </div>
                            <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                              {book.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">{book.subtitle}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">{book.description}</p>
                          </div>
                          <div className="flex flex-col space-y-2 ml-4">
                            <Button size="sm" variant="outline">
                              <Eye className="h-3 w-3 mr-1" />
                              Read
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Book Detail Modal would go here */}
        {selectedBook && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-4xl w-full max-h-[80vh] bg-background">
              <CardHeader className="border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{selectedBook.title}</CardTitle>
                    <p className="text-muted-foreground">{selectedBook.subtitle}</p>
                  </div>
                  <Button variant="ghost" onClick={() => setSelectedBook(null)}>
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <h3 className="font-semibold mb-3">Description</h3>
                    <p className="text-muted-foreground mb-6">{selectedBook.description}</p>
                    
                    <h3 className="font-semibold mb-3">Table of Contents</h3>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {selectedBook.articles.map(article => (
                          <div key={article.id} className="flex justify-between items-center p-2 hover:bg-accent rounded">
                            <span className="text-sm">{article.title}</span>
                            <span className="text-xs text-muted-foreground">Page {article.page}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Book Details</h4>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div>Author: {selectedBook.author}</div>
                        <div>Pages: {selectedBook.pages}</div>
                        <div>Year: {selectedBook.year}</div>
                        <div>Language: {selectedBook.language}</div>
                        <div>Downloads: {selectedBook.downloads.toLocaleString()}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Button 
                        className="w-full bg-gradient-gold"
                        onClick={() => navigate(`/book/${selectedBook.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Read Online
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Bookmark className="h-4 w-4 mr-2" />
                        {selectedBook.bookmarked ? 'Remove Bookmark' : 'Add Bookmark'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}