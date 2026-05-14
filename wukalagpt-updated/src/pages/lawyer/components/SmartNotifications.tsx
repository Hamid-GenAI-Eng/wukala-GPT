import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Bell,
  Calendar,
  FileText,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gavel,
  Users,
  X,
  Settings,
  Check,
  Eye,
  Trash2,
  Archive,
  ExternalLink,
  BellOff,
  Loader2,
  Scale,
  Mail,
  Smartphone,
  Volume2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';

// ── Types ──
interface Notification {
  id: string;
  title: string;
  desc: string;
  detail: string;
  type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  time: string;
  read: boolean;
  actionLabel?: string;
  actionType?: string;
  relatedCase?: string;
  source?: string;
}

interface NotificationPreference {
  type: string;
  label: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
  sound: boolean;
}

const typeColor: Record<string, string> = {
  urgent: 'bg-destructive/10 text-destructive',
  hearing: 'bg-gold/10 text-gold',
  payment: 'bg-success/10 text-success',
  document: 'bg-primary/10 text-primary',
  reminder: 'bg-gold/10 text-gold',
  client: 'bg-primary/10 text-primary',
  case: 'bg-muted-foreground/10 text-muted-foreground',
  team: 'bg-primary/10 text-primary',
};

const typeIcon: Record<string, any> = {
  urgent: AlertTriangle,
  hearing: Gavel,
  payment: DollarSign,
  document: FileText,
  reminder: Calendar,
  client: Users,
  case: Scale,
  team: Users,
};

const priorityBadge: Record<string, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-gold/20 text-gold',
  medium: 'bg-secondary text-muted-foreground',
  low: 'bg-secondary/50 text-muted-foreground/70',
};

export default function SmartNotifications() {
  const [tab, setTab] = useState('all');
  const [items, setItems] = useState<Notification[]>([]);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    { type: 'urgent', label: 'Urgent Alerts', email: true, push: true, inApp: true, sound: true },
    { type: 'hearing', label: 'Hearings & Court', email: true, push: true, inApp: true, sound: true },
    { type: 'payment', label: 'Payments & Billing', email: true, push: false, inApp: true, sound: false },
    { type: 'document', label: 'Documents', email: false, push: false, inApp: true, sound: false },
    { type: 'reminder', label: 'Reminders', email: true, push: true, inApp: true, sound: true },
  ]);

  useEffect(() => {
    // Simulated data fetching
    const mockData: Notification[] = [
      {
        id: '1',
        title: 'Emergency Hearing Scheduled',
        desc: 'New hearing for Case #2904-BK has been scheduled for tomorrow at 9:00 AM.',
        detail: 'The judge has ordered an expedited hearing regarding the motion for stay. Please ensure all relevant documentation is uploaded to the portal by 6:00 PM today.',
        type: 'urgent',
        priority: 'critical',
        time: '10m ago',
        read: false,
        actionLabel: 'View Case',
        actionType: 'link',
        relatedCase: 'Case #2904-BK',
        source: 'Court System'
      },
      {
        id: '2',
        title: 'Document Signature Required',
        desc: 'Client Sarah Jenkins has uploaded a new document for your review.',
        detail: 'The client has signed the Power of Attorney form. You need to counter-sign and notarize it before submission to the tribunal.',
        type: 'document',
        priority: 'high',
        time: '1h ago',
        read: false,
        actionLabel: 'Review Document',
        actionType: 'link',
        relatedCase: 'Jenkins v. State',
        source: 'Client Portal'
      },
      {
        id: '3',
        title: 'Payment Received',
        desc: 'Settlement payment for Case #1102-PT has been processed.',
        detail: 'The wire transfer of $45,000.00 has been confirmed. The funds will be available in the escrow account within 2-3 business days.',
        type: 'payment',
        priority: 'medium',
        time: '4h ago',
        read: true,
        actionLabel: 'View Billing',
        relatedCase: 'Case #1102-PT',
        source: 'Finance Department'
      },
      {
        id: '4',
        title: 'New Client Message',
        desc: 'Mr. Al-Farsi sent a follow-up message regarding his consultation.',
        detail: 'The client is inquiring about the next steps after the initial meeting. He wants to know if you can take his case on a contingency basis.',
        type: 'client',
        priority: 'medium',
        time: '6h ago',
        read: false,
        actionLabel: 'Open Chat',
        source: 'Wukala Messaging'
      }
    ];
    setItems(mockData);
  }, []);

  const unreadCount = items.filter(n => !n.read).length;

  const filtered = items.filter(n => {
    if (tab === 'all') return true;
    if (tab === 'unread') return !n.read;
    if (tab === 'critical') return n.priority === 'critical' || n.priority === 'high';
    return n.type === tab;
  });

  const markRead = (id: string) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setItems(prev => prev.map(n => ({ ...n, read: true })));
  };

  const dismissNotif = (id: string) => {
    setItems(prev => prev.filter(n => n.id !== id));
    if (selectedNotif?.id === id) setSelectedNotif(null);
  };

  const togglePref = (type: string, key: keyof NotificationPreference) => {
    setPreferences(prev => prev.map(p => 
      p.type === type ? { ...p, [key]: !p[key] } : p
    ));
  };

  return (
    <div className="space-y-5">
      <AnimatePresence mode="wait">
        {selectedNotif ? (
          <NotificationDetail
            key="detail"
            notif={selectedNotif}
            onBack={() => setSelectedNotif(null)}
            onMarkRead={() => markRead(selectedNotif.id)}
            onDismiss={() => dismissNotif(selectedNotif.id)}
          />
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold font-sans text-foreground">Smart Notifications</h2>
                <p className="text-xs text-muted-foreground font-sans mt-0.5">
                  {unreadCount} unread · {items.length} total
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllRead}
                  className="font-sans text-xs h-8 border-border/50 gap-1.5"
                  disabled={unreadCount === 0}
                >
                  <CheckCircle2 className="h-3 w-3" /> Mark all read
                </Button>
                <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="font-sans text-xs h-8 border-border/50 gap-1.5">
                      <Settings className="h-3 w-3" /> Settings
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="font-sans text-base">Notification Preferences</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-1 mt-3">
                      {/* Header Row */}
                      <div className="grid grid-cols-5 gap-2 px-3 py-2 text-[10px] text-muted-foreground font-sans font-medium">
                        <span className="col-span-1">Type</span>
                        <span className="text-center"><Mail className="h-3 w-3 mx-auto" /></span>
                        <span className="text-center"><Smartphone className="h-3 w-3 mx-auto" /></span>
                        <span className="text-center"><Bell className="h-3 w-3 mx-auto" /></span>
                        <span className="text-center"><Volume2 className="h-3 w-3 mx-auto" /></span>
                      </div>
                      {preferences.map(p => (
                        <div key={p.type} className="grid grid-cols-5 gap-2 items-center px-3 py-2.5 rounded-lg hover:bg-secondary/30 transition-colors">
                          <span className="text-xs font-sans font-medium text-foreground col-span-1">{p.label}</span>
                          <div className="flex justify-center">
                            <Switch checked={p.email} onCheckedChange={() => togglePref(p.type, 'email')} className="scale-75" />
                          </div>
                          <div className="flex justify-center">
                            <Switch checked={p.push} onCheckedChange={() => togglePref(p.type, 'push')} className="scale-75" />
                          </div>
                          <div className="flex justify-center">
                            <Switch checked={p.inApp} onCheckedChange={() => togglePref(p.type, 'inApp')} className="scale-75" />
                          </div>
                          <div className="flex justify-center">
                            <Switch checked={p.sound} onCheckedChange={() => togglePref(p.type, 'sound')} className="scale-75" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Priority Summary */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Critical', count: items.filter(n => n.priority === 'critical').length, color: 'bg-destructive/10 text-destructive border-destructive/20' },
                { label: 'High', count: items.filter(n => n.priority === 'high').length, color: 'bg-gold/10 text-gold border-gold/20' },
                { label: 'Medium', count: items.filter(n => n.priority === 'medium').length, color: 'bg-primary/10 text-primary border-primary/20' },
                { label: 'Low', count: items.filter(n => n.priority === 'low').length, color: 'bg-secondary text-muted-foreground border-border/20' },
              ].map(s => (
                <div key={s.label} className={`rounded-lg border p-2.5 text-center ${s.color}`}>
                  <p className="text-lg font-bold font-sans">{s.count}</p>
                  <p className="text-[9px] font-sans font-medium">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Filter Tabs */}
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="bg-secondary/50 h-9 flex-wrap">
                <TabsTrigger value="all" className="text-xs font-sans h-7">All</TabsTrigger>
                <TabsTrigger value="unread" className="text-xs font-sans h-7">Unread</TabsTrigger>
                <TabsTrigger value="critical" className="text-xs font-sans h-7">Priority</TabsTrigger>
                <TabsTrigger value="urgent" className="text-xs font-sans h-7">Urgent</TabsTrigger>
                <TabsTrigger value="hearing" className="text-xs font-sans h-7">Hearings</TabsTrigger>
                <TabsTrigger value="payment" className="text-xs font-sans h-7">Payments</TabsTrigger>
                <TabsTrigger value="case" className="text-xs font-sans h-7">Cases</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Notification List */}
            <div className="space-y-2">
              {filtered.length === 0 ? (
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="p-8 text-center">
                    <BellOff className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground font-sans">No notifications in this category</p>
                  </CardContent>
                </Card>
              ) : (
                filtered.map(n => {
                  const Icon = typeIcon[n.type] || Bell;
                  return (
                    <motion.div
                      key={n.id}
                      layout
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <Card
                        className={`border-border/50 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${!n.read ? 'border-l-2 border-l-primary bg-primary/[0.02]' : ''}`}
                        onClick={() => { setSelectedNotif(n); markRead(n.id); }}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${typeColor[n.type]}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <p className={`text-sm font-sans truncate ${!n.read ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}>{n.title}</p>
                                  <Badge className={`text-[8px] font-sans px-1.5 py-0 h-4 shrink-0 ${priorityBadge[n.priority]}`}>
                                    {n.priority}
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground font-sans line-clamp-1">{n.desc}</p>
                                {n.source && (
                                  <p className="text-[9px] text-muted-foreground/60 font-sans mt-1">via {n.source}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] text-muted-foreground font-sans whitespace-nowrap">{n.time}</span>
                                {!n.read && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                              </div>
                            </div>
                            {/* Quick Actions */}
                            <div className="flex items-center gap-1.5 mt-2">
                              {n.actionLabel && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-[10px] h-6 px-2 font-sans border-border/40 gap-1"
                                  onClick={e => { e.stopPropagation(); setSelectedNotif(n); markRead(n.id); }}
                                >
                                  <ExternalLink className="h-2.5 w-2.5" /> {n.actionLabel}
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[10px] h-6 px-2 font-sans text-muted-foreground gap-1"
                                onClick={e => { e.stopPropagation(); dismissNotif(n.id); }}
                              >
                                <X className="h-2.5 w-2.5" /> Dismiss
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Notification Detail View ──
function NotificationDetail({
  notif,
  onBack,
  onMarkRead,
  onDismiss,
}: {
  notif: Notification;
  onBack: () => void;
  onMarkRead: () => void;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <Button variant="ghost" size="sm" onClick={onBack} className="text-xs font-sans gap-1 text-muted-foreground h-7 px-2">
        ← Back to notifications
      </Button>

      <Card className="border-border/50 shadow-sm">
        <CardContent className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            {(() => {
              const Icon = typeIcon[notif.type] || Bell;
              return (
                <div className={`h-11 w-11 rounded-lg flex items-center justify-center shrink-0 ${typeColor[notif.type]}`}>
                  <Icon className="h-5 w-5" />
                </div>
              );
            })()}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold font-sans text-foreground">{notif.title}</h3>
                <Badge className={`text-[9px] font-sans px-1.5 py-0 h-4 ${priorityBadge[notif.priority]}`}>
                  {notif.priority}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-sans">{notif.desc}</p>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Time', value: notif.time },
              { label: 'Source', value: notif.source || '—' },
              { label: 'Priority', value: notif.priority.charAt(0).toUpperCase() + notif.priority.slice(1) },
              ...(notif.relatedCase ? [{ label: 'Related Case', value: notif.relatedCase }] : []),
            ].map(m => (
              <div key={m.label} className="p-2.5 rounded-lg bg-secondary/30 border border-border/20">
                <p className="text-[9px] text-muted-foreground font-sans mb-0.5">{m.label}</p>
                <p className="text-xs font-medium font-sans text-foreground">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Detail */}
          <div className="p-4 rounded-lg bg-secondary/20 border border-border/20">
            <p className="text-[10px] text-muted-foreground font-sans uppercase tracking-wider mb-2">Full Details</p>
            <p className="text-xs text-foreground/90 font-sans leading-relaxed">{notif.detail}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-border/30">
            {notif.actionLabel && (
              <Button size="sm" className="font-sans text-xs h-8 gap-1.5">
                <ExternalLink className="h-3 w-3" /> {notif.actionLabel}
              </Button>
            )}
            {!notif.read && (
              <Button variant="outline" size="sm" onClick={onMarkRead} className="font-sans text-xs h-8 gap-1.5 border-border/50">
                <Check className="h-3 w-3" /> Mark as Read
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onDismiss} className="font-sans text-xs h-8 gap-1.5 border-border/50 text-destructive hover:text-destructive">
              <Trash2 className="h-3 w-3" /> Dismiss
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
