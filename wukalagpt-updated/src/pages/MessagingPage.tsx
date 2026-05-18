import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Search, 
  Phone, 
  Video, 
  MoreVertical,
  Paperclip,
  Smile,
  ArrowLeft,
  Clock,
  CheckCheck,
  Loader2,
  MessageCircle,
  Mic,
  Trash2,
  Play,
  Pause,
  Volume2,
  Square,
  FileText,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api, Conversation, ChatMessage } from '@/services/api';
import { chatService } from '@/services/chatService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const formatSafeDistance = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  try {
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return '';
  }
};

const formatSafeDistanceNoSuffix = (dateString?: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  try {
    return formatDistanceToNow(date, { addSuffix: false });
  } catch {
    return '';
  }
};

const VoicePlayer = ({ url, isMine }: { url: string; isMine: boolean }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
    };
  }, [url]);

  const formatTime = (sec: number) => {
    if (isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={cn(
      "flex items-center gap-3 p-2.5 rounded-xl min-w-[210px] sm:min-w-[240px] bg-card/60 border backdrop-blur-sm shadow-sm select-none",
      isMine ? "border-primary/20 text-foreground" : "border-border text-foreground"
    )}>
      <audio ref={audioRef} src={url} preload="metadata" />
      <Button
        onClick={togglePlay}
        size="icon"
        variant="ghost"
        className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform active:scale-95",
          isMine ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-primary/10 text-primary hover:bg-primary/20"
        )}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
      </Button>

      <div className="flex-1 flex flex-col gap-1 min-w-0">
        <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden relative mt-1">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-100"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground/80 font-bold">
          <span>{formatTime(currentTime)}</span>
          <span className="flex items-center gap-1 uppercase font-extrabold text-[8px] tracking-wider">
            <Volume2 className="h-2.5 w-2.5" /> Voice
          </span>
          <span>{formatTime(duration || 0)}</span>
        </div>
      </div>
    </div>
  );
};

export default function MessagingPage() {
  const { user, token } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const targetLawyerId = searchParams.get('lawyerId');
  const isLawyer = user?.role?.toLowerCase() === 'lawyer';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial Data Load & SignalR Connection
  useEffect(() => {
    if (token) {
      chatService.startConnection(token);
      fetchConversations();
    }

    const unsubscribe = chatService.onMessageReceived((msg) => {
      // If message is from currently selected user, add to messages
      if (selectedConversation && (msg.senderId === selectedConversation.targetUserId || msg.receiverId === selectedConversation.targetUserId)) {
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
      }
      
      // Update conversations list regardless
      fetchConversations();
    });

    const unsubscribeStatus = chatService.onUserStatusChanged((userId, isOnline) => {
      setConversations(prev => prev.map(c => c.targetUserId === userId ? { ...c, isOnline } : c));
    });

    return () => {
      unsubscribe();
      unsubscribeStatus();
    };
  }, [token, selectedConversation]);

  // Handle direct navigation to a chat
  useEffect(() => {
    const initDirectChat = async () => {
      if (!targetLawyerId || isLoading) return;

      const existing = conversations.find(c => c.targetUserId === targetLawyerId);
      if (existing) {
        if (selectedConversation?.id !== existing.id) {
          setSelectedConversation(existing);
          fetchMessages(existing.id);
          setShowMobileChat(true);
        }
      } else {
        const tempId = `temp-${targetLawyerId}`;
        const hasTemp = conversations.some(c => c.id === tempId);
        
        if (!hasTemp) {
          try {
            const lawyer = await api.getPublicLawyer(targetLawyerId);
            if (lawyer) {
              const tempConv: Conversation = {
                id: tempId,
                targetUserId: targetLawyerId,
                targetUserName: lawyer.fullName,
                targetUserAvatar: lawyer.profileImage,
                lastMessage: 'Start a conversation',
                lastMessageTime: new Date().toISOString(),
                unreadCount: 0,
                isOnline: false,
                isLawyer: true,
              };
              setConversations(prev => [tempConv, ...prev]);
              setSelectedConversation(tempConv);
              setMessages([]);
              setShowMobileChat(true);
            }
          } catch (e) {
            console.error("Failed to load lawyer details for direct message", e);
          }
        }
      }
    };
    initDirectChat();
  }, [targetLawyerId, isLoading, conversations, selectedConversation]);

  const fetchConversations = async () => {
    try {
      const data = await api.getConversations();
      setConversations(data);
    } catch (error) {
      toast.error("Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const data = await api.getMessages(conversationId);
      setMessages(data);
      scrollToBottom();
    } catch (error) {
      toast.error("Failed to load messages");
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    fetchMessages(conv.id);
    setShowMobileChat(true);
    // Mark as read
    api.markAsRead(conv.id);
  };

  // Voice Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const timerRef = useRef<any>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        if (audioBlob.size < 1000) {
          toast.error("Audio recording was too short.");
          return;
        }

        setIsSending(true);
        const file = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('file', file);

        try {
          const response = await api.uploadChatAttachment(formData);
          if (response && response.url) {
            const messageContent = `🎤 Voice Message|${response.url}`;
            await submitMessage(messageContent);
            toast.success("Voice message sent successfully.");
          }
        } catch (err) {
          console.error("Failed to send voice message:", err);
          toast.error("Failed to send voice message.");
        } finally {
          setIsSending(false);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Voice recording access denied:", err);
      toast.error("Microphone access is required to record voice messages.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.ondataavailable = null;
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    setRecordingDuration(0);
    toast.info("Recording cancelled.");
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedConversation) return;

    setIsSending(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.uploadChatAttachment(formData);
      if (response && response.url) {
        const messageContent = `📄 Shared Document: ${file.name}|${response.url}`;
        await submitMessage(messageContent);
        toast.success("Document shared successfully.");
      }
    } catch (err) {
      console.error("Document upload failed:", err);
      toast.error("Failed to upload document.");
    } finally {
      setIsSending(false);
    }
  };

  const submitMessage = async (content: string) => {
    if (!content.trim() || !selectedConversation || !user) return;
    
    try {
      if (selectedConversation.id.startsWith('temp-')) {
        throw new Error("Temporary conversation");
      }
      const sentMsg = await chatService.sendMessage(selectedConversation.targetUserId, content);
      if (sentMsg) {
        setMessages(prev => {
          if (prev.some(m => m.id === sentMsg.id)) return prev;
          return [...prev, sentMsg];
        });
        scrollToBottom();
      }
      await fetchConversations();
    } catch (error) {
      try {
        const sentMsg = await api.sendMessage(selectedConversation.targetUserId, content);
        if (selectedConversation.id.startsWith('temp-')) {
          const updatedConvs = await api.getConversations();
          setConversations(updatedConvs);
          const realConv = updatedConvs.find(c => c.targetUserId === selectedConversation.targetUserId);
          if (realConv) {
            setSelectedConversation(realConv);
            fetchMessages(realConv.id);
          }
        } else {
          setMessages(prev => {
            if (prev.some(m => m.id === sentMsg.id)) return prev;
            return [...prev, sentMsg];
          });
          scrollToBottom();
        }
      } catch (httpError) {
        toast.error("Failed to send message");
      }
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setIsSending(true);
    const content = newMessage.trim();
    setNewMessage('');
    await submitMessage(content);
    setIsSending(false);
  };

  const renderMessageContent = (content: string, isMine: boolean) => {
    if (content.startsWith("📄 Shared Document:")) {
      const raw = content.replace("📄 Shared Document:", "").trim();
      const parts = raw.split("|");
      const fileName = parts[0] || "Shared Document";
      const fileUrl = parts[1] || "";

      return (
        <div className={cn(
          "flex items-center gap-3.5 p-3 rounded-xl border bg-card/60 backdrop-blur-sm min-w-[210px] md:min-w-[260px] hover:shadow-md transition-all duration-300 select-none text-foreground",
          isMine ? "border-primary/20" : "border-border"
        )}>
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <FileText className="h-4.5 w-4.5" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <span className="font-semibold text-xs truncate leading-tight">
              {fileName}
            </span>
            <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground/80">
              Shared Document File
            </span>
          </div>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 w-8 rounded-lg bg-primary hover:bg-primary/90 text-white flex items-center justify-center flex-shrink-0 transition-transform active:scale-95"
            title="Download Document"
          >
            <Download className="h-4 w-4" />
          </a>
        </div>
      );
    }

    if (content.startsWith("🎤 Voice Message|")) {
      const audioUrl = content.replace("🎤 Voice Message|", "").trim();
      return <VoicePlayer url={audioUrl} isMine={isMine} />;
    }

    return <p className="leading-relaxed whitespace-pre-wrap break-words">{content}</p>;
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.targetUserName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-4rem)] bg-background flex selection:bg-primary/20">
      {/* Conversations Sidebar */}
      <div className={cn(
        "w-full sm:w-80 lg:w-96 border-r bg-card/50 backdrop-blur-md flex flex-col transition-all duration-300",
        showMobileChat && "hidden sm:flex"
      )}>
        {/* Header */}
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center justify-between mb-4">
             <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
             <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
               {conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0)} New
             </Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50 border-border/50 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
             <div className="flex flex-col items-center justify-center h-40 gap-3 opacity-50">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-xs font-medium uppercase tracking-widest">Loading Chats...</span>
             </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-80 px-10 text-center text-muted-foreground gap-4">
               <div className="p-4 bg-muted/50 rounded-full">
                 <MessageCircle className="h-8 w-8 opacity-20" />
               </div>
               <p className="text-sm font-medium">No conversations found</p>
                {isLawyer ? (
                  <Button variant="outline" size="sm" onClick={() => navigate('/lawyer-dashboard')}>Go to Dashboard</Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => navigate('/lawyers')}>Find a Lawyer</Button>
                )}
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleSelectConversation(conv)}
                className={cn(
                  "p-4 border-b border-border/30 cursor-pointer hover:bg-primary/5 transition-all duration-200 relative group",
                  selectedConversation?.id === conv.id && "bg-primary/10 border-r-4 border-r-primary"
                )}
              >
                <div className="flex items-start space-x-4">
                  <div className="relative flex-shrink-0">
                    <Avatar className="h-14 w-14 border-2 border-background shadow-sm transition-transform group-hover:scale-105">
                      <AvatarImage src={conv.targetUserAvatar} alt={conv.targetUserName} />
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold">
                        {conv.targetUserName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      'absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-background shadow-sm',
                      conv.isOnline ? 'bg-success' : 'bg-muted-foreground/30'
                    )} />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm truncate text-foreground/90">{conv.targetUserName}</h3>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                        {formatSafeDistance(conv.lastMessageTime)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className={cn(
                        "text-xs truncate max-w-[180px]",
                        conv.unreadCount > 0 ? "text-foreground font-bold" : "text-muted-foreground"
                      )}>
                        {conv.lastMessage || "Start a conversation"}
                      </p>
                      {conv.unreadCount > 0 && (
                        <Badge className="bg-primary text-primary-foreground text-[10px] min-w-[18px] h-[18px] p-0 flex items-center justify-center animate-pulse">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col bg-card/30 lg:bg-transparent",
        !showMobileChat && "hidden sm:flex"
      )}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border/50 bg-card/80 backdrop-blur-md flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowMobileChat(false)}
                  className="sm:hidden -ml-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                
                <div className="relative">
                  <Avatar className="h-10 w-10 border border-border">
                    <AvatarImage src={selectedConversation.targetUserAvatar} alt={selectedConversation.targetUserName} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold">
                      {selectedConversation.targetUserName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background',
                    selectedConversation.isOnline ? 'bg-success' : 'bg-muted-foreground/30'
                  )} />
                </div>
                
                <div>
                  <h3 className="font-bold text-sm">{selectedConversation.targetUserName}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      selectedConversation.isOnline ? "bg-success" : "bg-muted-foreground/50"
                    )} />
                    <p className="text-[10px] uppercase tracking-tighter font-extrabold text-muted-foreground opacity-70">
                      {selectedConversation.isOnline ? 'Active Now' : 'Last seen recently'}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="icon" className="hover:bg-primary/5 text-primary">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="hover:bg-primary/5 text-primary">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col bg-[url('/bg-patterns/subtle-grid.svg')] bg-fixed">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-40">
                   <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <MessageCircle className="h-8 w-8" />
                   </div>
                   <p className="text-sm font-medium">No messages yet. Send your first message to {selectedConversation.targetUserName.split(' ')[0]}.</p>
                </div>
              ) : messages.map((message, idx) => {
                const isMine = message.senderId === user?.id;
                const showAvatar = idx === 0 || messages[idx-1].senderId !== message.senderId;

                return (
                  <div
                    key={message.id || idx}
                    className={cn(
                      "flex items-end gap-3 max-w-[85%] sm:max-w-[70%]",
                      isMine ? 'ml-auto flex-row-reverse' : 'mr-auto'
                    )}
                  >
                    {!isMine && (
                      <div className="w-8 h-8 flex-shrink-0">
                        {showAvatar && (
                          <Avatar className="w-8 h-8 border border-border">
                            <AvatarImage src={selectedConversation.targetUserAvatar} />
                            <AvatarFallback className="text-[10px]">
                               {selectedConversation.targetUserName[0]}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    )}
                    
                    <div className="flex flex-col">
                      {message.content.startsWith("📄 Shared Document:") || message.content.startsWith("🎤 Voice Message|") ? (
                        renderMessageContent(message.content, isMine)
                      ) : (
                        <div className={cn(
                          "p-3 px-4 rounded-2xl text-sm shadow-sm transition-all animate-in fade-in slide-in-from-bottom-1",
                          isMine 
                            ? 'bg-primary text-primary-foreground rounded-br-none' 
                            : 'bg-card border border-border/50 text-foreground rounded-bl-none'
                        )}>
                          <p className="leading-relaxed">{message.content}</p>
                        </div>
                      )}
                      
                      <div className={cn(
                        "flex items-center gap-1.5 mt-1 px-1",
                        isMine ? 'justify-end' : 'justify-start'
                      )}>
                        <span className="text-[10px] text-muted-foreground font-medium uppercase opacity-60">
                          {formatSafeDistanceNoSuffix(message.timestamp)}
                        </span>
                        {isMine && (
                          <CheckCheck className={cn(
                            "h-3 w-3",
                            message.isRead ? 'text-primary' : 'text-muted-foreground opacity-50'
                          )} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 pb-6 border-t border-border/50 bg-card/50 backdrop-blur-md">
              <div className="max-w-4xl mx-auto flex items-center space-x-3">
                {isRecording ? (
                  <div className="flex-1 flex items-center justify-between bg-destructive/5 border border-destructive/25 rounded-xl px-4 h-11 select-none animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-destructive rounded-full animate-ping" />
                      <span className="text-xs font-bold text-destructive uppercase tracking-widest flex items-center gap-1">
                        Recording Voice ({formatDuration(recordingDuration)})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={cancelRecording}
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 rounded-lg font-bold text-xs"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Cancel
                      </Button>
                      <Button
                        onClick={stopRecording}
                        variant="default"
                        size="sm"
                        className="bg-destructive hover:bg-destructive/95 text-white h-8 rounded-lg font-bold text-xs px-3 shadow-md shadow-destructive/15"
                      >
                        <Square className="h-3 w-3 mr-1.5" /> Stop & Send
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      id="chat-file-upload"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label htmlFor="chat-file-upload">
                      <Button
                        asChild
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 rounded-xl bg-background border border-border/50 text-muted-foreground hover:text-primary cursor-pointer transition-transform active:scale-95 flex items-center justify-center"
                      >
                        <span>
                          <Paperclip className="h-5 w-5" />
                        </span>
                      </Button>
                    </label>
                    
                    <div className="flex-1 relative">
                      <Input
                        placeholder="Describe your legal query..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="h-11 bg-background border-border/50 focus:ring-primary/20 rounded-xl pr-12"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9 text-muted-foreground hover:text-primary rounded-lg"
                      >
                        <Smile className="h-5 w-5" />
                      </Button>
                    </div>

                    <Button
                      onClick={startRecording}
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 rounded-xl bg-background border border-border/50 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-transform active:scale-95 flex items-center justify-center"
                      title="Record Voice Message"
                    >
                      <Mic className="h-5 w-5" />
                    </Button>
                    
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className="h-11 w-11 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all active:scale-95 flex items-center justify-center"
                    >
                      {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                  </>
                )}
              </div>
              <p className="text-[10px] text-center text-muted-foreground mt-3 uppercase tracking-tighter font-extrabold opacity-40">
                End-to-End Encryption Enabled • AI Legal Nexus Secure Chat
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-muted/10">
            <div className="text-center p-12 max-w-sm">
              <div className="w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-primary/10">
                <MessageCircle className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-3 tracking-tight">Select a Chat</h3>
              <p className="text-muted-foreground text-sm leading-relaxed mb-10">
                {isLawyer 
                  ? "Pick a conversation from the sidebar to communicate with your active clients in real-time."
                  : "Pick a conversation from the sidebar to start consulting with our verified legal experts in real-time."
                }
              </p>
              {isLawyer ? (
                <Button size="lg" className="bg-primary w-full shadow-lg shadow-primary/20 rounded-xl" onClick={() => navigate('/lawyer-dashboard')}>
                  Go to Dashboard
                </Button>
              ) : (
                <Button size="lg" className="bg-primary w-full shadow-lg shadow-primary/20 rounded-xl" onClick={() => navigate('/lawyers')}>
                  Browse Lawyers Directory
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}