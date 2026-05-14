import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import OnboardingTour from '@/components/OnboardingTour';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { api, AiChatSession, AiChatMessage } from '@/services/api';
import { 
  Send, 
  Mic, 
  MicOff, 
  Paperclip, 
  Search,
  MessageSquare,
  Bot,
  User,
  FileText,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Volume2,
  PanelLeftClose,
  PanelLeft,
  X,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Local UI Message representation
interface UIMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: Date;
}

export default function ChatPage() {
  const { showOnboarding, completeOnboarding } = useOnboarding();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // API State
  const [sessions, setSessions] = useState<AiChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([
    {
      id: 'system-1',
      content: 'Hello! I\'m your AI legal assistant. I can help you with legal questions, document analysis, and connecting you with qualified lawyers. How can I assist you today?',
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Default sidebar closed on mobile, open on desktop
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Swipe gesture state
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Set sidebar state based on screen size on mount
  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Load Sessions
  const loadSessions = async () => {
    try {
      setIsLoadingSessions(true);
      const data = await api.getAiChatSessions();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      toast({ title: 'Error', description: 'Failed to load chat history.', variant: 'destructive' });
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // Load Messages when active session changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeSessionId) {
        setMessages([
          {
            id: 'system-1',
            content: 'Hello! I\'m your AI legal assistant. I can help you with legal questions, document analysis, and connecting you with qualified lawyers. How can I assist you today?',
            sender: 'ai',
            timestamp: new Date(),
          }
        ]);
        return;
      }

      try {
        setIsLoadingMessages(true);
        const data = await api.getAiChatMessages(activeSessionId);
        const uiMessages: UIMessage[] = data.map(m => ({
          id: m.id,
          content: m.content,
          sender: m.role.toLowerCase() as 'user' | 'ai' | 'system',
          timestamp: new Date(m.createdAt),
        }));
        setMessages(uiMessages);
      } catch (error) {
        console.error('Failed to load messages:', error);
        toast({ title: 'Error', description: 'Failed to load messages.', variant: 'destructive' });
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [activeSessionId, toast]);

  // Swipe gesture handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    const swipeThreshold = 50;
    const swipeDistance = touchEndX.current - touchStartX.current;

    // Swipe right to open sidebar (from left edge)
    if (swipeDistance > swipeThreshold && touchStartX.current < 50 && !isSidebarOpen) {
      setIsSidebarOpen(true);
    }
    // Swipe left to close sidebar
    if (swipeDistance < -swipeThreshold && isSidebarOpen && isMobile) {
      setIsSidebarOpen(false);
    }

    // Reset
    touchStartX.current = 0;
    touchEndX.current = 0;
  }, [isSidebarOpen, isMobile]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    const tempId = Date.now().toString();

    const newMessage: UIMessage = {
      id: tempId,
      content: userText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      let currentSessionId = activeSessionId;

      // Auto-create session on first message
      if (!currentSessionId) {
        const title = userText.length > 30 ? userText.substring(0, 30) + '...' : userText;
        const newSession = await api.createAiChatSession(title);
        currentSessionId = newSession.id;
        setActiveSessionId(newSession.id);
        
        // Refresh sidebar to show new session
        loadSessions();
      }

      const response = await api.sendAiChatMessage({
        message: userText,
        isDeepResearch: false,
        sessionId: currentSessionId,
      });

      const aiResponse: UIMessage = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Message Failed',
        description: 'There was an error communicating with the AI. Please try again.',
        variant: 'destructive',
      });
      // Optionally remove the optimistically added user message
    } finally {
      setIsTyping(false);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    try {
      await api.deleteAiChatSession(sessionId);
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
      }
      toast({ title: 'Success', description: 'Session deleted.' });
      loadSessions();
    } catch (error) {
      toast({ title: 'Error', description: 'Could not delete session.', variant: 'destructive' });
    }
  };

  const startNewChat = () => {
    setActiveSessionId(null);
    if (isMobile) setIsSidebarOpen(false);
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: "Message has been copied successfully.",
    });
  };

  const handleGoodResponse = (messageId: string) => {
    toast({ title: "Feedback recorded", description: "Thank you for your positive feedback!" });
  };

  const handleBadResponse = (messageId: string) => {
    toast({ title: "Feedback recorded", description: "We'll work on improving our responses." });
  };

  const handleVoicePlayback = (content: string) => {
    toast({ title: "Voice playback", description: "Text-to-speech feature coming soon!" });
  };

  const renderMessageContent = (content: string) => {
    // Check if content contains mermaid diagram
    const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
    const parts = content.split(mermaidRegex);
    
    if (parts.length === 1) {
      return <p className="text-xs lg:text-sm leading-relaxed break-words whitespace-pre-wrap">{content}</p>;
    }

    return (
      <div className="space-y-4">
        {parts.map((part, index) => {
          if (index % 2 === 0) {
            // Regular text
            return part.trim() ? (
              <p key={index} className="text-xs lg:text-sm leading-relaxed break-words whitespace-pre-wrap">
                {part.trim()}
              </p>
            ) : null;
          } else {
            // Mermaid diagram
            return (
              <div key={index} className="my-4 p-4 bg-background/50 rounded-lg border border-border overflow-x-auto">
                <pre className="text-xs mermaid">{part.trim()}</pre>
              </div>
            );
          }
        })}
      </div>
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleVoiceRecord = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordingTime(0);
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setRecordingInterval(interval);
    } else {
      setIsRecording(false);
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
      setRecordingTime(0);
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
      script.onload = () => {
        (window as any).mermaid?.initialize({ startOnLoad: true, theme: 'neutral' });
      };
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => {
      if ((window as any).mermaid) {
        (window as any).mermaid.run();
      }
    }, 100);
  }, [messages]);

  return (
    <>
      {showOnboarding && <OnboardingTour onComplete={completeOnboarding} />}
      <div 
        className="flex h-[calc(100vh-4rem-4rem)] lg:h-[calc(100vh-4rem)] bg-background relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Mobile Overlay */}
        {isSidebarOpen && isMobile && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Chat History */}
        <div 
          ref={sidebarRef}
          className={cn(
            "border-r border-border bg-background flex-col transition-all duration-300 ease-in-out z-40",
            isMobile 
              ? cn(
                  "fixed left-0 top-0 h-full w-[280px] transform",
                  isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                )
              : cn(
                  "relative",
                  isSidebarOpen ? "flex w-72 lg:w-80" : "hidden"
                )
          )}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Chat History</h2>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={startNewChat}>
                  <MessageSquare className="h-4 w-4" />
                </Button>
                {isMobile && (
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-8 w-8 p-0"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="px-4 pb-4">
              {isLoadingSessions ? (
                <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : filteredSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No chat history found.</p>
              ) : (
                filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      "group p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors mb-2",
                      activeSessionId === session.id && "bg-accent"
                    )}
                    onClick={() => {
                      setActiveSessionId(session.id);
                      if (isMobile) setIsSidebarOpen(false);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {session.title}
                        </h3>
                        <div className="flex items-center mt-2 text-xs text-muted-foreground">
                          <span>{formatDate(session.lastMessageAt)}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="p-3 lg:p-4 border-b border-border bg-card/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="h-8 w-8 p-0"
              >
                {isSidebarOpen ? (
                  <PanelLeftClose className="h-4 w-4" />
                ) : (
                  <PanelLeft className="h-4 w-4" />
                )}
              </Button>
              <div className="flex h-8 w-8 lg:h-10 lg:w-10 items-center justify-center rounded-full bg-gradient-primary">
                <Bot className="h-4 w-4 lg:h-5 lg:w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-base lg:text-lg font-semibold">Legal AI Assistant</h1>
                <p className="text-xs lg:text-sm text-muted-foreground">
                  Powered by Mizan AI
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="text-xs lg:text-sm" onClick={startNewChat}>
                New Chat
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-2 lg:p-4">
          <div className="space-y-4 max-w-4xl mx-auto">
            {isLoadingMessages ? (
               <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex items-start space-x-2 lg:space-x-3 animate-fade-in',
                    message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  )}
                >
                  <div className={cn(
                    'flex h-6 w-6 lg:h-8 lg:w-8 items-center justify-center rounded-full flex-shrink-0',
                    message.sender === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  )}>
                    {message.sender === 'user' ? (
                      <User className="h-3 w-3 lg:h-4 lg:w-4" />
                    ) : (
                      <Bot className="h-3 w-3 lg:h-4 lg:w-4" />
                    )}
                  </div>
                  
                  <div className={cn(
                    'flex-1 max-w-[85%] lg:max-w-2xl',
                    message.sender === 'user' ? 'flex justify-end' : ''
                  )}>
                    <div className={cn(
                      'p-2 lg:p-3 rounded-2xl',
                      message.sender === 'user' 
                        ? 'chat-bubble-user bg-primary text-primary-foreground' 
                        : 'chat-bubble-ai bg-muted text-foreground'
                    )}>
                      {renderMessageContent(message.content)}
                      <p className={cn(
                        'text-[10px] lg:text-xs mt-1 lg:mt-2 opacity-70',
                        message.sender === 'user' ? 'text-primary-foreground' : 'text-muted-foreground'
                      )}>
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                    
                    {/* Action buttons for AI messages */}
                    {message.sender === 'ai' && (
                      <div className="flex items-center gap-1 mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGoodResponse(message.id)}
                          className="h-7 w-7 p-0 hover:text-green-600"
                          title="Good response"
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBadResponse(message.id)}
                          className="h-7 w-7 p-0 hover:text-red-600"
                          title="Bad response"
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyMessage(message.content)}
                          className="h-7 w-7 p-0"
                          title="Copy response"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVoicePlayback(message.content)}
                          className="h-7 w-7 p-0"
                          title="Listen to response"
                        >
                          <Volume2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start space-x-2 lg:space-x-3 animate-fade-in">
                <div className="flex h-6 w-6 lg:h-8 lg:w-8 items-center justify-center rounded-full bg-muted">
                  <Bot className="h-3 w-3 lg:h-4 lg:w-4" />
                </div>
                <div className="flex-1 max-w-[85%] lg:max-w-lg">
                  <div className="chat-bubble-ai bg-muted p-3 rounded-2xl">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-2 lg:p-4 border-t border-border bg-card/50">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-2">
              <div className="flex-1 relative">
                <Input
                  placeholder="Ask your legal question..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isTyping}
                  className="pr-16 lg:pr-20 min-h-[40px] lg:min-h-[44px] resize-none text-sm"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleFileUpload}
                    className="h-6 w-6 lg:h-8 lg:w-8 p-0"
                  >
                    <Paperclip className="h-3 w-3 lg:h-4 lg:w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleVoiceRecord}
                    className={cn(
                      'h-6 w-6 lg:h-8 lg:w-8 p-0',
                      isRecording ? 'text-destructive animate-pulse' : ''
                    )}
                  >
                    {isRecording ? (
                      <MicOff className="h-3 w-3 lg:h-4 lg:w-4" />
                    ) : (
                      <Mic className="h-3 w-3 lg:h-4 lg:w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <Button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                className="h-10 lg:h-11 px-4 lg:px-6 bg-gradient-primary hover:shadow-md transition-all duration-200"
              >
                <Send className="h-3 w-3 lg:h-4 lg:w-4" />
              </Button>
            </div>
            
            {/* Recording Timer */}
            {isRecording && (
              <div className="flex items-center justify-center mt-2">
                <div className="flex items-center space-x-2 text-sm text-destructive animate-pulse">
                  <div className="w-2 h-2 bg-destructive rounded-full"></div>
                  <span>Recording: {formatRecordingTime(recordingTime)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.jpg,.png"
        className="hidden"
        onChange={(e) => {
          console.log('Files selected:', e.target.files);
        }}
      />
    </div>
    </>
  );
}