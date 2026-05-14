import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { 
  Newspaper, 
  Settings, 
  Search, 
  Clock, 
  User, 
  Bot,
  Mic,
  MicOff,
  Send,
  TrendingUp,
  Filter,
  BookOpen,
  Globe,
  Star,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data for news articles
const mockNews = [
  {
    id: 1,
    title: "Supreme Court Rules on Major Constitutional Amendment",
    summary: "The Supreme Court of Pakistan delivered a landmark judgment on constitutional interpretation affecting fundamental rights.",
    category: "Constitutional Law",
    source: "Dawn News",
    time: "2 hours ago",
    image: "/api/placeholder/400/200",
    trending: true
  },
  {
    id: 2,
    title: "New Cybercrime Laws Enacted by Parliament",
    summary: "Parliament passes comprehensive cybercrime legislation to address digital threats and online fraud.",
    category: "Criminal Law",
    source: "The News",
    time: "5 hours ago",
    image: "/api/placeholder/400/200",
    trending: false
  },
  {
    id: 3,
    title: "High Court Judgment on Property Rights",
    summary: "Lahore High Court sets new precedent in property dispute resolution affecting real estate sector.",
    category: "Property Law",
    source: "Express Tribune",
    time: "1 day ago",
    image: "/api/placeholder/400/200",
    trending: true
  }
];

const categories = [
  "Constitutional Law", "Criminal Law", "Civil Law", "Corporate Law", 
  "Property Law", "Family Law", "Tax Law", "Labor Law"
];

export default function NewsPage() {
  const [activeTab, setActiveTab] = useState('news');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Constitutional Law', 'Criminal Law']);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    {
      id: 1,
      type: 'bot',
      message: "Hello! I'm your News Assistant. Ask me about any legal news topic, recent court decisions, or legislative updates.",
      time: new Date().toLocaleTimeString()
    }
  ]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    
    const newMessage = {
      id: chatHistory.length + 1,
      type: 'user',
      message: chatMessage,
      time: new Date().toLocaleTimeString()
    };
    
    setChatHistory(prev => [...prev, newMessage]);
    setChatMessage('');
    
    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: chatHistory.length + 2,
        type: 'bot',
        message: `Based on your query about "${chatMessage}", here are the latest legal developments and news articles relevant to this topic. I found 3 recent court decisions and 2 legislative updates that might interest you.`,
        time: new Date().toLocaleTimeString()
      };
      setChatHistory(prev => [...prev, botResponse]);
    }, 1000);
  };

  const toggleVoice = () => {
    setIsListening(!isListening);
    // Voice recognition logic would go here
  };

  const filteredNews = mockNews.filter(article => 
    selectedInterests.includes(article.category) &&
    (searchQuery === '' || 
     article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     article.summary.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient-primary mb-2">Legal News Hub</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Stay updated with the latest legal developments and court decisions</p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showAdvancedFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-flex">
            <TabsTrigger value="news" className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4">
              <Newspaper className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">News</span>
            </TabsTrigger>
            <TabsTrigger value="bot" className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4">
              <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Bot</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* News Feed Tab */}
          <TabsContent value="news" className="space-y-4 sm:space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search legal news..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-glass border-white/20"
              />
            </div>

            {/* Advanced Filters */}
            {showAdvancedFilters && (
              <Card className="bg-glass border-white/20 p-4">
                <h3 className="font-semibold mb-4">Advanced Filters</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {categories.map(category => (
                    <Button
                      key={category}
                      variant={selectedInterests.includes(category) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleInterest(category)}
                      className="justify-start"
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </Card>
            )}

            {/* Active Interests */}
            <div className="flex flex-wrap gap-2">
              {selectedInterests.map(interest => (
                <Badge key={interest} variant="secondary" className="bg-primary/10 text-primary">
                  {interest}
                </Badge>
              ))}
            </div>

            {/* News Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredNews.map(article => (
                <Card key={article.id} className="group hover:shadow-xl transition-all duration-300 bg-glass border-white/20 cursor-pointer">
                  <div className="relative overflow-hidden rounded-t-lg">
                    <div className="h-48 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-primary/60" />
                    </div>
                    {article.trending && (
                      <Badge className="absolute top-3 right-3 bg-gradient-gold">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Trending
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <Badge variant="outline" className="mb-3">{article.category}</Badge>
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                      {article.summary}
                    </p>
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span className="flex items-center">
                        <Globe className="h-3 w-3 mr-1" />
                        {article.source}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {article.time}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* News Bot Tab */}
          <TabsContent value="bot" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Chat Interface */}
              <div className="lg:col-span-2">
                <Card className="h-[400px] sm:h-[500px] lg:h-[600px] flex flex-col bg-glass border-white/20">
                  <CardHeader className="border-b border-white/10">
                    <CardTitle className="flex items-center space-x-2">
                      <Bot className="h-5 w-5 text-primary" />
                      <span>Legal News Assistant</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 p-0 flex flex-col">
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {chatHistory.map(message => (
                          <div
                            key={message.id}
                            className={cn(
                              "flex",
                              message.type === 'user' ? 'justify-end' : 'justify-start'
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[80%] p-3 rounded-lg",
                                message.type === 'user'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              )}
                            >
                              <p className="text-sm">{message.message}</p>
                              <span className="text-xs opacity-70 mt-1 block">
                                {message.time}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <div className="p-4 border-t border-white/10">
                      <div className="flex space-x-2">
                        <Textarea
                          placeholder="Ask about legal news, court decisions, or legislative updates..."
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          className="flex-1 min-h-[50px] resize-none"
                          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        />
                        <div className="flex flex-col space-y-2">
                          <Button
                            size="sm"
                            variant={isListening ? "destructive" : "outline"}
                            onClick={toggleVoice}
                            className="h-10 w-10 p-0"
                          >
                            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                          </Button>
                          <Button size="sm" onClick={handleSendMessage} className="h-10 w-10 p-0">
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Topics */}
              <div className="space-y-4">
                <Card className="bg-glass border-white/20">
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Topics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      "Recent Supreme Court decisions",
                      "New legislation updates",
                      "High Court judgments",
                      "Constitutional amendments",
                      "Legal precedents",
                      "Bar Council updates"
                    ].map(topic => (
                      <Button
                        key={topic}
                        variant="ghost"
                        className="w-full justify-start text-left text-sm h-auto p-3"
                        onClick={() => setChatMessage(topic)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2 shrink-0" />
                        {topic}
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 sm:space-y-6">
            <Card className="bg-glass border-white/20">
              <CardHeader>
                <CardTitle>News Preferences</CardTitle>
                <p className="text-muted-foreground">
                  Customize your news feed by selecting your areas of interest
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Legal Categories</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {categories.map(category => (
                      <Button
                        key={category}
                        variant={selectedInterests.includes(category) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleInterest(category)}
                        className="justify-start"
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10">
                  <h3 className="font-semibold mb-4">Notification Settings</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Breaking news alerts</label>
                      <Button variant="outline" size="sm">Enable</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Daily digest email</label>
                      <Button variant="outline" size="sm">Enable</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Weekly summary</label>
                      <Button variant="outline" size="sm">Enable</Button>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Button className="bg-gradient-gold">
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}