import { useState, useRef, useEffect } from 'react';
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
  CheckCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'file';
  status: 'sent' | 'delivered' | 'read';
}

interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
  isLawyer: boolean;
  status: 'available' | 'busy' | 'offline';
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    name: 'Adv. Muhammad Hassan',
    lastMessage: 'I\'ve reviewed your contract. Let\'s discuss the terms.',
    lastMessageTime: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    unreadCount: 2,
    isOnline: true,
    isLawyer: true,
    status: 'available'
  },
  {
    id: '2',
    name: 'Adv. Fatima Sheikh',
    lastMessage: 'Thank you for providing the documents. I\'ll get back to you soon.',
    lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    unreadCount: 0,
    isOnline: true,
    isLawyer: true,
    status: 'available'
  },
  {
    id: '3',
    name: 'Adv. Ahmed Ali Khan',
    lastMessage: 'We can schedule a consultation for tomorrow.',
    lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    unreadCount: 1,
    isOnline: false,
    isLawyer: true,
    status: 'offline'
  }
];

const mockMessages: Record<string, Message[]> = {
  '1': [
    {
      id: '1',
      senderId: 'user',
      content: 'Hello, I need help with a business contract review.',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      type: 'text',
      status: 'read'
    },
    {
      id: '2',
      senderId: '1',
      content: 'Hello! I\'d be happy to help you with the contract review. Could you please share the contract document?',
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      type: 'text',
      status: 'read'
    },
    {
      id: '3',
      senderId: 'user',
      content: 'Sure, I\'ll upload the document now.',
      timestamp: new Date(Date.now() - 20 * 60 * 1000),
      type: 'text',
      status: 'read'
    },
    {
      id: '4',
      senderId: '1',
      content: 'Perfect! I\'ve received and reviewed your contract. There are a few clauses that need attention. The payment terms in section 3 seem unfavorable to your business.',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      type: 'text',
      status: 'read'
    },
    {
      id: '5',
      senderId: '1',
      content: 'I\'ve reviewed your contract. Let\'s discuss the terms.',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      type: 'text',
      status: 'delivered'
    }
  ],
  '2': [
    {
      id: '1',
      senderId: 'user',
      content: 'I need help with a family law matter.',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      type: 'text',
      status: 'read'
    },
    {
      id: '2',
      senderId: '2',
      content: 'I understand this can be a difficult time. I\'m here to help. Could you tell me more about your situation?',
      timestamp: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
      type: 'text',
      status: 'read'
    },
    {
      id: '3',
      senderId: 'user',
      content: 'Here are the documents you requested.',
      timestamp: new Date(Date.now() - 2.2 * 60 * 60 * 1000),
      type: 'text',
      status: 'read'
    },
    {
      id: '4',
      senderId: '2',
      content: 'Thank you for providing the documents. I\'ll get back to you soon.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      type: 'text',
      status: 'read'
    }
  ]
};

export default function MessagingPage() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>('1');
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation]);

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    // In real app, this would send to backend
    console.log('Sending message:', newMessage);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = mockConversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConv = mockConversations.find(c => c.id === selectedConversation);
  const messages = selectedConversation ? mockMessages[selectedConversation] || [] : [];

  return (
    <div className="h-[calc(100vh-4rem)] bg-background flex">
      {/* Conversations Sidebar */}
      <div className={cn(
        "w-full sm:w-80 lg:w-96 border-r bg-card flex flex-col",
        showMobileChat && "hidden sm:flex"
      )}>
        {/* Header */}
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold mb-3">Messages</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No conversations found
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => {
                  setSelectedConversation(conversation.id);
                  setShowMobileChat(true);
                }}
                className={cn(
                  "p-4 border-b cursor-pointer hover:bg-accent transition-colors",
                  selectedConversation === conversation.id && "bg-accent"
                )}
              >
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={conversation.avatar} alt={conversation.name} />
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                        {conversation.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {conversation.isOnline && (
                      <div className={cn(
                        'absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background',
                        getStatusColor(conversation.status)
                      )} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-sm truncate">{conversation.name}</h3>
                        {conversation.isLawyer && (
                          <Badge variant="secondary" className="text-xs">Lawyer</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {getTimeAgo(conversation.lastMessageTime)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm text-muted-foreground truncate pr-2">
                        {conversation.lastMessage}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <Badge className="bg-primary text-primary-foreground text-xs min-w-[20px] h-5 flex items-center justify-center">
                          {conversation.unreadCount}
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
        "flex-1 flex flex-col",
        !showMobileChat && "hidden sm:flex"
      )}>
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b bg-card flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMobileChat(false)}
                  className="sm:hidden"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedConv.avatar} alt={selectedConv.name} />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      {selectedConv.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  {selectedConv.isOnline && (
                    <div className={cn(
                      'absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-background',
                      getStatusColor(selectedConv.status)
                    )} />
                  )}
                </div>
                
                <div>
                  <h3 className="font-semibold">{selectedConv.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedConv.isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.senderId === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div className={cn(
                    "max-w-[70%] sm:max-w-[60%]",
                    message.senderId === 'user' ? 'order-2' : 'order-1'
                  )}>
                    <div className={cn(
                      "p-3 rounded-lg",
                      message.senderId === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted'
                    )}>
                      <p className="text-sm">{message.content}</p>
                    </div>
                    
                    <div className={cn(
                      "flex items-center space-x-1 mt-1 text-xs text-muted-foreground",
                      message.senderId === 'user' ? 'justify-end' : 'justify-start'
                    )}>
                      <Clock className="h-3 w-3" />
                      <span>{getTimeAgo(message.timestamp)}</span>
                      {message.senderId === 'user' && (
                        <CheckCheck className={cn(
                          "h-3 w-3",
                          message.status === 'read' ? 'text-blue-500' : 'text-muted-foreground'
                        )} />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t bg-card">
              <div className="flex items-end space-x-2">
                <Button variant="ghost" size="sm">
                  <Paperclip className="h-4 w-4" />
                </Button>
                
                <div className="flex-1 relative">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-gradient-primary hover:shadow-md transition-all duration-200"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}