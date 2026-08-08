import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  Loader2,
  Square,
  Sparkles,
  Scale,
  ShieldAlert,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

// Local UI Message representation
interface UIMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: Date;
}

interface DocumentData {
  source: string;
  citation: string;
  content: string;
}

export default function ChatPage() {
  const { showOnboarding, completeOnboarding } = useOnboarding();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [selectedDoc, setSelectedDoc] = useState<DocumentData | null>(null);
  
  // Case Intelligence State
  const [chatMode, setChatMode] = useState<'standard' | 'case_intelligence'>('standard');
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [orchestrationStep, setOrchestrationStep] = useState(0);
  const [showCanvas, setShowCanvas] = useState(false);
  const [caseIntelligenceData, setCaseIntelligenceData] = useState<any>(null);
  
  // API State
  const [sessions, setSessions] = useState<AiChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UIMessage[]>([]);
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

  // Multimodal state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

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
        setMessages([]);
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    const newFiles = Array.from(e.target.files);
    let imagesCount = selectedFiles.filter(f => f.type.startsWith('image/')).length;
    let docsCount = selectedFiles.filter(f => !f.type.startsWith('image/')).length;
    
    const validFiles: File[] = [];
    
    for (const file of newFiles) {
      if (file.type.startsWith('image/')) {
        if (imagesCount < 5) {
          validFiles.push(file);
          imagesCount++;
        } else {
          toast({ title: 'Limit Reached', description: 'Maximum 5 images allowed.', variant: 'destructive' });
        }
      } else {
        if (docsCount < 3) {
          validFiles.push(file);
          docsCount++;
        } else {
          toast({ title: 'Limit Reached', description: 'Maximum 3 documents allowed.', variant: 'destructive' });
        }
      }
    }
    
    setSelectedFiles(prev => [...prev, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startVoiceRecord = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'voice_message.webm', { type: 'audio/webm' });
        
        // Stop tracks after recording finishes
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        
        await handleSendMultimodal("", [audioFile], true);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (err) {
      toast({ title: 'Error', description: 'Could not access microphone.', variant: 'destructive' });
    }
  };

  const stopVoiceRecord = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // Removed track.stop() here so onstop is guaranteed to fire
    }
  };

  const handleVoiceRecord = () => {
    if (isRecording) {
      stopVoiceRecord();
    } else {
      startVoiceRecord();
    }
  };

  const handleSendMultimodal = async (text: string, files: File[], isVoice: boolean = false) => {
    if (!text.trim() && files.length === 0) return;

    if (chatMode === 'case_intelligence' || chatMode === 'urdu_fir') {
      setIsOrchestrating(true);
      setOrchestrationStep(0);
      setInputValue('');
      
      let base64Image = undefined;
      if (chatMode === 'urdu_fir' && files.length > 0 && files[0].type.startsWith('image/')) {
        try {
          base64Image = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(files[0]);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
          });
        } catch (e) {
          toast({ title: 'Error', description: 'Failed to read the image file.', variant: 'destructive' });
          setIsOrchestrating(false);
          return;
        }
      }

      setSelectedFiles([]);
      
      try {
        // Step 0 UI trigger
        setOrchestrationStep(0);
        
        let targetSessionId = activeSessionId || Date.now().toString();
        
        // This makes the real API call
        const apiPromise = api.analyzeCaseIntelligence({ 
          session_id: targetSessionId, 
          raw_facts: text,
          mode: chatMode,
          image_base64: base64Image
        });
        
        // We'll advance the UI step purely for UX visual feel if it takes time
        const step1Timer = setTimeout(() => setOrchestrationStep(1), 1500);
        const step2Timer = setTimeout(() => setOrchestrationStep(2), 3000);
        
        const response = await apiPromise;
        
        clearTimeout(step1Timer);
        clearTimeout(step2Timer);
        
        // Ensure we hit the final step before showing canvas
        setOrchestrationStep(3);
        
        setTimeout(() => {
          setIsOrchestrating(false);
          setCaseIntelligenceData(response);
          setShowCanvas(true);
        }, 500);
      } catch (error) {
        console.error("Case Intelligence API Error:", error);
        toast({ title: 'Error', description: 'Failed to analyze case. Ensure Mizan AI is running.', variant: 'destructive' });
        setIsOrchestrating(false);
      }
      return;
    }

    let targetSessionId = activeSessionId;
    if (!targetSessionId) {
      try {
        const title = isVoice ? "Voice Message" : (text ? (text.length > 30 ? text.substring(0, 30) + '...' : text) : "Multimodal Chat");
        const session = await api.createAiChatSession(title);
        targetSessionId = session.id;
        setActiveSessionId(session.id);
        loadSessions(); // refresh sidebar
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to create session', variant: 'destructive' });
        return;
      }
    }

    const newUserMessage: UIMessage = {
      id: Date.now().toString(),
      content: isVoice ? "🎤 *Sent a voice message*" : (text + (files.length > 0 ? `\n\n*[Attached ${files.length} files]*` : "")),
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsTyping(true);

    try {
      const response = await api.sendAiChatMessageMultimodal(text, false, targetSessionId, files);
      
      const newAiMessage: UIMessage = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newAiMessage]);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && selectedFiles.length === 0) return;
    const textToSend = inputValue;
    const filesToSend = [...selectedFiles];
    
    setInputValue('');
    setSelectedFiles([]);
    
    await handleSendMultimodal(textToSend, filesToSend);
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

  const handleVoicePlayback = async (messageId: string, content: string) => {
    if (playingMessageId === messageId && audioPlaybackRef.current) {
      audioPlaybackRef.current.pause();
      setPlayingMessageId(null);
      return;
    }

    if (audioPlaybackRef.current) {
      audioPlaybackRef.current.pause();
      setPlayingMessageId(null);
    }

    try {
      setPlayingMessageId(messageId);
      toast({ title: "Loading Voice", description: "Generating human-like voice response..." });
      
      const audioBlob = await api.generateTts(content);
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audioPlaybackRef.current = audio;
      audio.play();
      audio.onended = () => {
        setPlayingMessageId(null);
        URL.revokeObjectURL(audioUrl);
      };
    } catch (error) {
      console.error('TTS Error:', error);
      setPlayingMessageId(null);
      toast({ title: "Error", description: "Failed to generate text-to-speech audio.", variant: "destructive" });
    }
  };

  const renderMessageContent = (rawContent: string) => {
    let content = rawContent;
    let docs: DocumentData[] = [];
    
    // Extract <mizan_docs> tags using regex
    const docsMatch = content.match(/<mizan_docs>([\s\S]*?)<\/mizan_docs>/);
    if (docsMatch && docsMatch[1]) {
      try {
        docs = JSON.parse(docsMatch[1]);
        // Remove the tags and JSON from the visible content
        content = content.replace(/<mizan_docs>[\s\S]*?<\/mizan_docs>/, '').trim();
      } catch (e) {
        console.error('Failed to parse Mizan docs', e);
      }
    }

    return (
      <div className="flex flex-col gap-4">
        <div dir="auto" className="prose prose-sm lg:prose-base dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                if (!inline && match && match[1] === 'mermaid') {
                  return (
                    <div className="my-4 p-4 bg-background/50 rounded-lg border border-border overflow-x-auto">
                      <pre className="text-xs mermaid">{String(children).replace(/\n$/, '')}</pre>
                    </div>
                  );
                }
                return (
                  <code className={cn(className, "bg-background/50 px-1 py-0.5 rounded")} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
        
        {/* Render Document Citations */}
        {docs.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2 pt-3 border-t border-border/50">
            <span className="text-xs font-semibold flex items-center text-muted-foreground mr-2">
              <FileText className="h-3 w-3 mr-1" />
              Sources:
            </span>
            {docs.map((doc, idx) => (
              <Badge 
                key={idx} 
                variant="secondary" 
                className="cursor-pointer hover:bg-primary/20 transition-colors text-xs py-1"
                onClick={() => setSelectedDoc(doc)}
              >
                {doc.citation || doc.source || `Document ${idx + 1}`}
              </Badge>
            ))}
          </div>
        )}
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

  const formatLegalDocument = (text: string | undefined) => {
    if (!text) return '';
    
    // 1. Remove the raw database metadata tag (e.g. [Unknown Court - Citation not found])
    let cleaned = text.replace(/^\[.*?\]\s*/, '');
    
    // 2. Remove raw page artifacts
    cleaned = cleaned.replace(/Page \d+\s*(of \d+)?/gi, '');

    // 3. Format Footnotes & Annotations (Blockquotes)
    cleaned = cleaned.replace(/(\s|^)(\d+\s*(?:Added|Subs\.|Ins\.|Rep\.|Amended)\s+by\s+)/gi, '\n\n> 📝 **$2**');
    cleaned = cleaned.replace(/(\s|^)(\d+\s*(?:Subs\.|Ins\.)\s+ibid)/gi, '\n\n> 📝 **$2**');

    // 4. Format Chapters (H2)
    cleaned = cleaned.replace(/(\s|^)(CHAPTER [IVXLCDM]+)/g, '\n\n---\n\n## $2\n\n');
    
    // 5. Format Section Titles (e.g., "164. Punishment... .") as H3
    // Matches Number, dot, space, Capital letter, then text up to the first period.
    cleaned = cleaned.replace(/(?:\s|^)(\d+[A-Z]?\.\s+[A-Z][^.]+?\.)/g, '\n\n### $1\n\n');
    
    // 6. Format Illustrations & Explanations
    cleaned = cleaned.replace(/(\s|^)(Illustrations?|Explanations?)\s/gi, '\n\n**$2:**\n\n');
    
    // 7. Format Sub-sections and List Items: (a), (b), (1), (2)
    cleaned = cleaned.replace(/(\s|^)(\(\d+\)|\([a-z]\))\s/gi, '\n\n**$2** ');
    
    // 8. Cleanup excessive newlines
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

    return cleaned.trim();
  };

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
      <div className={cn("flex flex-col min-w-0 transition-all duration-500 ease-in-out", showCanvas ? "w-full lg:w-[400px] border-r border-border hidden lg:flex bg-muted/20" : "flex-1")}>
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
                          onClick={() => handleVoicePlayback(message.id, message.content)}
                          className="h-7 w-7 p-0"
                          title="Listen to response"
                        >
                          {playingMessageId === message.id ? (
                            <Square className="h-3 w-3 fill-current text-primary" />
                          ) : (
                            <Volume2 className="h-3 w-3" />
                          )}
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
            {/* Mode Toggle */}
            <div className="mb-2 flex items-center justify-between">
              <Select value={chatMode} onValueChange={(v: any) => setChatMode(v)}>
                <SelectTrigger className="w-[200px] h-8 text-xs bg-background shadow-sm border-primary/20">
                  <div className="flex items-center gap-2">
                    {chatMode === 'case_intelligence' ? <Sparkles className="h-3 w-3 text-primary" /> : 
                     chatMode === 'urdu_fir' ? <FileText className="h-3 w-3 text-primary" /> :
                     <MessageSquare className="h-3 w-3 text-muted-foreground" />}
                    <span>
                      {chatMode === 'case_intelligence' ? 'Case Intelligence' : 
                       chatMode === 'urdu_fir' ? 'Urdu FIR (Cross-Lingual)' : 
                       'Standard Chat'}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-3 w-3" />
                      <span>Standard Chat</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="case_intelligence">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-3 w-3 text-primary" />
                      <span className="font-medium text-primary">Case Intelligence</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="urdu_fir">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3 w-3 text-primary" />
                      <span className="font-medium text-primary">Urdu FIR (Cross-Lingual)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Orchestration Indicator */}
            <AnimatePresence>
              {isOrchestrating && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="mb-4 overflow-hidden"
                >
                  <div className="p-4 border border-primary/20 bg-primary/5 rounded-xl max-w-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm font-medium text-primary">AI Co-Counsel Analyzing...</span>
                    </div>
                    <div className="space-y-2 pl-7">
                      {[
                        { step: 0, icon: FileText, text: "Extracting Facts..." },
                        { step: 1, icon: Search, text: "Querying Precedent Graph..." },
                        { step: 2, icon: ShieldAlert, text: "Devil's Advocate Red-Teaming..." }
                      ].map((s, i) => (
                        <div key={i} className={cn(
                          "flex items-center gap-2 text-xs transition-all duration-300",
                          orchestrationStep === s.step ? "text-foreground font-medium" :
                          orchestrationStep > s.step ? "text-green-600" : "text-muted-foreground opacity-50"
                        )}>
                          {orchestrationStep > s.step ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : <s.icon className="h-3 w-3" />}
                          {s.text}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2 p-2 bg-muted/30 rounded-lg">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-1 bg-background border px-2 py-1 rounded-md text-xs">
                    <span className="truncate max-w-[120px]">{file.name}</span>
                    <button onClick={() => removeFile(index)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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

            <p className="text-center text-[10px] lg:text-xs text-muted-foreground mt-4 font-medium opacity-70">
              Mizan AI can make Mistakes. Please Double check.
            </p>
          </div>
        </div>
      </div>

      {/* Litigation Canvas Area (Only visible when showCanvas is true) */}
      {showCanvas && caseIntelligenceData && (
        <div className="flex-1 flex min-w-0 bg-muted/10 animate-in slide-in-from-right-8 duration-500 z-10">
          {/* Left Pane: AI Strategy Output */}
          <div className="w-1/2 border-r border-border flex flex-col h-full bg-background shadow-xl">
            <div className="p-4 border-b border-border bg-card flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Scale className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">Litigation Canvas</h2>
                  <p className="text-xs text-muted-foreground">AI Generated Strategy Memo</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowCanvas(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-8">
                {/* Fact Timeline */}
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4" /> Timeline of Material Facts
                  </h3>
                  <div className="space-y-4 border-l-2 border-primary/20 ml-2 pl-4">
                    {caseIntelligenceData.timeline.map((item: any, idx: number) => (
                      <div key={idx} className="relative">
                        <div className={cn("absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-background", item.status === 'issue' ? 'bg-destructive' : 'bg-primary')} />
                        <span className="text-xs font-medium text-muted-foreground">{item.date}</span>
                        <p className="text-sm font-medium mt-1">{item.event}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <Separator />

                {/* Strategies */}
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                    <Scale className="h-4 w-4" /> Litigation Strategies
                  </h3>
                  <div className="grid gap-4">
                    {caseIntelligenceData.strategies.map((strat: any, idx: number) => (
                      <div 
                        key={idx} 
                        className="p-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer" 
                        onClick={() => {
                          if (strat.precedents && strat.precedents.length > 0) {
                            setSelectedDoc({
                              source: strat.precedents[0].name, 
                              citation: strat.precedents[0].citation, 
                              content: "## " + strat.precedents[0].name + "\n\n" + (strat.precedents[0].content || "No extract available in the database for this citation.")
                            });
                          }
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <h4 className="font-semibold text-primary">Strategy {idx + 1}: {strat.title}</h4>
                          <ChevronRight className="h-4 w-4 text-primary opacity-50" />
                        </div>
                        <p className="text-sm mt-2 text-muted-foreground">{strat.desc}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {strat.precedents && strat.precedents.map((p: any, i: number) => (
                            <Badge 
                              key={i} 
                              variant="outline" 
                              className="bg-background cursor-pointer hover:border-primary z-20"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDoc({
                                  source: p.name,
                                  citation: p.citation,
                                  content: "## " + p.name + "\n\n" + (p.content || "No extract available in the database for this citation.")
                                });
                              }}
                            >
                              {p.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <Separator />

                {/* Devil's Advocate */}
                <section>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-destructive mb-4 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" /> Devil's Advocate Red-Teaming
                  </h3>
                  <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 space-y-2">
                    <p className="text-xs font-medium text-destructive mb-3">Opposing counsel will likely exploit the following weaknesses:</p>
                    {caseIntelligenceData.weaknesses.map((weakness: string, idx: number) => (
                      <div key={idx} className="flex gap-2 text-sm">
                        <span className="text-destructive font-bold">•</span>
                        <span>{weakness}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </ScrollArea>
          </div>

          {/* Right Pane: Document Viewer Placeholder */}
          <div className="w-1/2 flex flex-col h-full bg-muted/30">
            {selectedDoc ? (
              <>
                <div className="p-4 border-b border-border bg-card/80 backdrop-blur">
                  <h2 className="font-serif text-lg font-semibold text-primary">{selectedDoc.source}</h2>
                  <p className="text-xs text-muted-foreground">Citation: {selectedDoc.citation}</p>
                </div>
                <ScrollArea className="flex-1 p-6">
                  <div className="prose prose-sm dark:prose-invert font-serif">
                    <ReactMarkdown>{selectedDoc.content}</ReactMarkdown>
                  </div>
                </ScrollArea>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                <FileText className="h-12 w-12 mb-4 opacity-20" />
                <p className="font-medium">Document Viewer</p>
                <p className="text-sm opacity-70 mt-2 max-w-sm">Click on any citation or precedent in the AI strategy to view the source document here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp,.m4a,.mp3,.wav,.webm"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Document Reader Modal */}
      <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent aria-describedby={undefined} className="max-w-3xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif text-primary">
              {selectedDoc?.source}
            </DialogTitle>
            <p className="text-sm text-muted-foreground font-medium">
              Citation: {selectedDoc?.citation || 'N/A'}
            </p>
          </DialogHeader>
          <ScrollArea className="flex-1 mt-4 p-6 border rounded-lg bg-card shadow-inner">
            <div dir="auto" className="prose prose-sm lg:prose-base dark:prose-invert max-w-none prose-p:leading-relaxed prose-li:my-1 font-serif">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {formatLegalDocument(selectedDoc?.content)}
              </ReactMarkdown>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}