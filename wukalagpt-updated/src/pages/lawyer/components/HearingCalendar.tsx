import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  ChevronLeft,
  ChevronRight,
  Gavel,
  User,
  AlertTriangle,
  RotateCcw,
  Printer,
  Filter,
  Search,
  ArrowRight,
  X,
  Bell,
  FileText,
  ChevronDown,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────
type CourtType = 'district' | 'high' | 'supreme' | 'tribunal';
type HearingStatus = 'scheduled' | 'adjourned' | 'completed' | 'cancelled';
type CalendarView = 'month' | 'week' | 'day';

interface Hearing {
  id: number;
  caseTitle: string;
  caseNumber: string;
  court: string;
  courtType: CourtType;
  courtroom: string;
  judge: string;
  time: string;
  endTime: string;
  date: Date;
  type: string;
  status: HearingStatus;
  priority: 'critical' | 'high' | 'medium' | 'low';
  notes?: string;
  adjournmentReason?: string;
  nextDate?: Date;
  client: string;
}

// ── Court Color System ─────────────────────────────────────────────
const courtColors: Record<CourtType, { bg: string; text: string; dot: string; border: string; label: string }> = {
  district: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
    border: 'border-l-blue-500',
    label: 'District Court',
  },
  high: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    border: 'border-l-emerald-500',
    label: 'High Court',
  },
  supreme: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    text: 'text-red-700 dark:text-red-300',
    dot: 'bg-red-500',
    border: 'border-l-red-500',
    label: 'Supreme Court',
  },
  tribunal: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
    border: 'border-l-amber-500',
    label: 'Tribunal',
  },
};

const statusConfig: Record<HearingStatus, { bg: string; text: string; label: string }> = {
  scheduled: { bg: 'bg-primary/10', text: 'text-primary', label: 'Scheduled' },
  adjourned: { bg: 'bg-warning/10', text: 'text-warning', label: 'Adjourned' },
  completed: { bg: 'bg-success/10', text: 'text-success', label: 'Completed' },
  cancelled: { bg: 'bg-destructive/10', text: 'text-destructive', label: 'Cancelled' },
};

// ── Sample Data (auto-populated from cases) ────────────────────────
const today = new Date();
const makeDate = (offset: number, h = 10, m = 0) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  d.setHours(h, m, 0, 0);
  return d;
};

const initialHearings: Hearing[] = [
  { id: 1, caseTitle: 'Khan Industries v. FBR', caseNumber: '2024-CL-1847', court: 'Lahore High Court', courtType: 'high', courtroom: 'Court 3', time: '10:00 AM', endTime: '11:30 AM', date: makeDate(0, 10), type: 'Arguments', status: 'scheduled', priority: 'high', judge: 'Justice Malik Shahzad', client: 'Khan Industries (Pvt.) Ltd.' },
  { id: 2, caseTitle: 'State v. Ali Raza', caseNumber: '2024-CR-0392', court: 'Sessions Court, Islamabad', courtType: 'district', courtroom: 'Court 7', time: '10:30 AM', endTime: '12:00 PM', date: makeDate(0, 10, 30), type: 'Evidence', status: 'scheduled', priority: 'critical', judge: 'Judge Farooq Ahmed', client: 'Ali Raza' },
  { id: 3, caseTitle: 'Fatima Enterprises v. NBP', caseNumber: '2024-BK-0156', court: 'Banking Court, Lahore', courtType: 'tribunal', courtroom: 'Court 1', time: '2:00 PM', endTime: '3:30 PM', date: makeDate(1, 14), type: 'Hearing', status: 'scheduled', priority: 'medium', judge: 'Judge Rizwan Ul Haq', client: 'Fatima Enterprises' },
  { id: 4, caseTitle: 'Noor Enterprises Dispute', caseNumber: '2024-CV-0781', court: 'Civil Court, Karachi', courtType: 'district', courtroom: 'Court 12', time: '9:30 AM', endTime: '11:00 AM', date: makeDate(3, 9, 30), type: 'Discovery', status: 'scheduled', priority: 'medium', judge: 'Justice Aisha Siddiqui', client: 'Noor Enterprises' },
  { id: 5, caseTitle: 'Workers Union CBE', caseNumber: '2024-LB-0045', court: 'Labour Court, Faisalabad', courtType: 'tribunal', courtroom: 'Court 2', time: '11:00 AM', endTime: '12:30 PM', date: makeDate(5, 11), type: 'Mediation', status: 'scheduled', priority: 'low', judge: 'Judge Tariq Mehmood', client: 'CBE Workers Union' },
  { id: 6, caseTitle: 'Govt. of Punjab v. Ahmad Group', caseNumber: '2024-SC-0089', court: 'Supreme Court of Pakistan', courtType: 'supreme', courtroom: 'Court 1', time: '11:00 AM', endTime: '1:00 PM', date: makeDate(2, 11), type: 'Constitutional Petition', status: 'scheduled', priority: 'critical', judge: 'CJP Isa', client: 'Ahmad Group of Companies' },
  { id: 7, caseTitle: 'Rehman Property Dispute', caseNumber: '2024-CV-1102', court: 'Civil Court, Lahore', courtType: 'district', courtroom: 'Court 5', time: '2:00 PM', endTime: '3:00 PM', date: makeDate(0, 14), type: 'Arguments', status: 'adjourned', priority: 'medium', judge: 'Judge Saima Batool', client: 'Abdul Rehman', adjournmentReason: 'Judge on leave', nextDate: makeDate(7, 14) },
  { id: 8, caseTitle: 'Tax Appeal — Textile Mills', caseNumber: '2024-TX-0234', court: 'Appellate Tribunal, Lahore', courtType: 'tribunal', courtroom: 'Bench A', time: '10:00 AM', endTime: '11:30 AM', date: makeDate(1, 10), type: 'Tax Appeal', status: 'scheduled', priority: 'high', judge: 'Member Judicial — Naveed', client: 'Faisal Textile Mills' },
];

// ── Utilities ──────────────────────────────────────────────────────
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getMonthDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = first.getDay();
  const totalDays = last.getDate();
  const prevMonthLast = new Date(year, month, 0).getDate();

  const days: { date: Date; isCurrentMonth: boolean }[] = [];
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month - 1, prevMonthLast - i), isCurrentMonth: false });
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  }
  return days;
}

function getWeekDays(date: Date) {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay() + 1); // Monday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatDateShort(d: Date) {
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM

// ── Main Component ─────────────────────────────────────────────────
export default function HearingCalendar() {
  const [hearings, setHearings] = useState<Hearing[]>(initialHearings);
  const [view, setView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedHearing, setSelectedHearing] = useState<Hearing | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAdjournDialog, setShowAdjournDialog] = useState(false);
  const [adjournTarget, setAdjournTarget] = useState<Hearing | null>(null);
  const [adjournReason, setAdjournReason] = useState('');
  const [adjournNextDate, setAdjournNextDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [courtFilter, setCourtFilter] = useState<CourtType | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // ── Conflicts ──────────────────────────────────────────────────
  const conflicts = useMemo(() => {
    const active = hearings.filter(h => h.status === 'scheduled');
    const found: { a: Hearing; b: Hearing }[] = [];
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        if (isSameDay(active[i].date, active[j].date) && active[i].time === active[j].time) {
          found.push({ a: active[i], b: active[j] });
        }
      }
    }
    return found;
  }, [hearings]);

  // ── Filtered hearings ──────────────────────────────────────────
  const filteredHearings = useMemo(() => {
    return hearings.filter(h => {
      if (courtFilter !== 'all' && h.courtType !== courtFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return h.caseTitle.toLowerCase().includes(q) || h.caseNumber.toLowerCase().includes(q) || h.court.toLowerCase().includes(q) || h.judge.toLowerCase().includes(q);
      }
      return true;
    });
  }, [hearings, courtFilter, searchQuery]);

  // ── Navigation ─────────────────────────────────────────────────
  const navigate = (dir: -1 | 1) => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() + dir);
    else if (view === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  const goToday = () => setCurrentDate(new Date());

  const headerLabel = () => {
    if (view === 'month') return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (view === 'week') {
      const week = getWeekDays(currentDate);
      return `${formatDateShort(week[0])} – ${formatDateShort(week[6])}, ${week[0].getFullYear()}`;
    }
    return currentDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  // ── Adjournment ────────────────────────────────────────────────
  const handleAdjourn = () => {
    if (!adjournTarget || !adjournReason) return;
    setHearings(prev => prev.map(h => {
      if (h.id === adjournTarget.id) {
        return { ...h, status: 'adjourned' as HearingStatus, adjournmentReason: adjournReason, nextDate: adjournNextDate ? new Date(adjournNextDate) : undefined };
      }
      return h;
    }));
    if (adjournNextDate) {
      const nd = new Date(adjournNextDate);
      const newHearing: Hearing = {
        ...adjournTarget,
        id: Date.now(),
        date: nd,
        status: 'scheduled',
        adjournmentReason: undefined,
        nextDate: undefined,
        notes: `Adjourned from ${adjournTarget.date.toLocaleDateString()}. Reason: ${adjournReason}`,
      };
      setHearings(prev => [...prev, newHearing]);
    }
    setShowAdjournDialog(false);
    setAdjournTarget(null);
    setAdjournReason('');
    setAdjournNextDate('');
  };

  // ── Get hearings for a date ────────────────────────────────────
  const getHearingsForDate = (date: Date) => filteredHearings.filter(h => isSameDay(h.date, date));

  // ── Stats ──────────────────────────────────────────────────────
  const todayHearings = hearings.filter(h => isSameDay(h.date, today) && h.status === 'scheduled');
  const weekHearings = hearings.filter(h => {
    const diff = (h.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff < 7 && h.status === 'scheduled';
  });

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold font-sans text-foreground">Hearing & Court Calendar</h2>
            <p className="text-xs text-muted-foreground font-sans mt-0.5">Auto-populated from your case files</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="text-xs font-sans h-8 gap-1.5" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-3 w-3" /> Filters
            </Button>
            <Button variant="outline" size="sm" className="text-xs font-sans h-8 gap-1.5">
              <Printer className="h-3 w-3" /> Print Week
            </Button>
            <Button size="sm" className="bg-gradient-primary font-sans text-xs gap-1.5 h-8" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-3.5 w-3.5" /> Add Hearing
            </Button>
          </div>
        </div>

        {/* ── Stat Chips ───────────────────────────────── */}
        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-sans font-medium text-foreground">{todayHearings.length} Today</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5">
            <CalendarIcon className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-sans font-medium text-foreground">{weekHearings.length} This Week</span>
          </div>
          {conflicts.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5">
              <AlertTriangle className="h-3 w-3 text-destructive" />
              <span className="text-xs font-sans font-medium text-destructive">{conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* ── Filters Panel ────────────────────────────── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <Card className="border-border/50">
                <CardContent className="p-3 space-y-3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Search case, court, judge..." className="pl-8 h-8 text-xs font-sans" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 font-sans">Court Type</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {(['all', 'district', 'high', 'supreme', 'tribunal'] as const).map(ct => (
                        <button
                          key={ct}
                          onClick={() => setCourtFilter(ct)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-sans font-medium transition-colors ${
                            courtFilter === ct
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                          }`}
                        >
                          {ct === 'all' && '● '}
                          {ct !== 'all' && <span className={`inline-block h-1.5 w-1.5 rounded-full ${courtColors[ct].dot} mr-1`} />}
                          {ct === 'all' ? 'All Courts' : courtColors[ct].label}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Conflict Alert ───────────────────────────── */}
        <AnimatePresence>
          {conflicts.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold font-sans text-destructive">Scheduling Conflict Detected</p>
                      {conflicts.map((c, i) => (
                        <p key={i} className="text-[11px] font-sans text-muted-foreground mt-1">
                          <span className="font-medium text-foreground">{c.a.caseTitle}</span> and <span className="font-medium text-foreground">{c.b.caseTitle}</span> overlap at {c.a.time} on {c.a.date.toLocaleDateString()}
                        </p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── View Switcher & Navigation ─────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-sm font-semibold font-sans text-foreground min-w-[180px] text-center">{headerLabel()}</h3>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="text-[11px] font-sans h-7 ml-1" onClick={goToday}>Today</Button>
        </div>
        <div className="flex bg-secondary/50 rounded-lg p-0.5">
          {(['month', 'week', 'day'] as const).map(v => (
            <Button key={v} variant={view === v ? 'default' : 'ghost'} size="sm" className="text-xs font-sans h-7 px-3 capitalize" onClick={() => setView(v)}>
              {v}
            </Button>
          ))}
        </div>
      </div>

      {/* ── Court Color Legend ──────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        {Object.entries(courtColors).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`h-2.5 w-2.5 rounded-full ${val.dot}`} />
            <span className="text-[10px] font-sans text-muted-foreground">{val.label}</span>
          </div>
        ))}
      </div>

      {/* ── Month View ─────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {view === 'month' && (
          <motion.div key="month" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {/* Day headers */}
                <div className="grid grid-cols-7 border-b border-border">
                  {DAYS.map(d => (
                    <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-2.5 font-sans border-r border-border last:border-r-0">{d}</div>
                  ))}
                </div>
                {/* Day cells */}
                <div className="grid grid-cols-7">
                  {getMonthDays(currentDate.getFullYear(), currentDate.getMonth()).map((day, i) => {
                    const dayHearings = getHearingsForDate(day.date);
                    const isToday = isSameDay(day.date, today);
                    return (
                      <div
                        key={i}
                        className={`min-h-[72px] sm:min-h-[90px] border-r border-b border-border last:border-r-0 p-1 cursor-pointer transition-colors hover:bg-secondary/30 ${
                          !day.isCurrentMonth ? 'bg-muted/30' : ''
                        }`}
                        onClick={() => { setCurrentDate(day.date); setView('day'); }}
                      >
                        <div className={`text-[11px] font-sans font-medium mb-0.5 h-5 w-5 flex items-center justify-center rounded-full ${
                          isToday ? 'bg-primary text-primary-foreground' : !day.isCurrentMonth ? 'text-muted-foreground/40' : 'text-foreground'
                        }`}>
                          {day.date.getDate()}
                        </div>
                        <div className="space-y-0.5">
                          {dayHearings.slice(0, 2).map(h => (
                            <div
                              key={h.id}
                              className={`text-[9px] sm:text-[10px] font-sans px-1 py-0.5 rounded truncate ${courtColors[h.courtType].bg} ${courtColors[h.courtType].text} ${
                                h.status === 'adjourned' ? 'line-through opacity-60' : ''
                              }`}
                              onClick={e => { e.stopPropagation(); setSelectedHearing(h); }}
                            >
                              {h.time.replace(' AM', 'a').replace(' PM', 'p')} {h.caseTitle.split(' v.')[0]}
                            </div>
                          ))}
                          {dayHearings.length > 2 && (
                            <div className="text-[9px] font-sans text-muted-foreground font-medium px-1">+{dayHearings.length - 2} more</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Week View ────────────────────────────────── */}
        {view === 'week' && (
          <motion.div key="week" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardContent className="p-0 overflow-x-auto">
                <div className="min-w-[640px]">
                  {/* Day headers */}
                  <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
                    <div className="border-r border-border" />
                    {getWeekDays(currentDate).map((d, i) => {
                      const isToday = isSameDay(d, today);
                      return (
                        <div key={i} className={`text-center py-2.5 border-r border-border last:border-r-0 ${isToday ? 'bg-primary/5' : ''}`}>
                          <div className="text-[10px] font-sans text-muted-foreground">{DAYS[d.getDay()]}</div>
                          <div className={`text-sm font-sans font-semibold mt-0.5 h-7 w-7 mx-auto flex items-center justify-center rounded-full ${
                            isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'
                          }`}>
                            {d.getDate()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* Time grid */}
                  {HOURS.map(hour => (
                    <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border last:border-b-0">
                      <div className="text-[10px] font-sans text-muted-foreground pr-2 pt-1 text-right border-r border-border">
                        {hour > 12 ? hour - 12 : hour}{hour >= 12 ? 'PM' : 'AM'}
                      </div>
                      {getWeekDays(currentDate).map((d, i) => {
                        const dayHearings = getHearingsForDate(d).filter(h => {
                          const hHour = h.date.getHours();
                          return hHour === hour;
                        });
                        const isToday = isSameDay(d, today);
                        return (
                          <div key={i} className={`min-h-[48px] border-r border-border last:border-r-0 p-0.5 ${isToday ? 'bg-primary/[0.02]' : ''}`}>
                            {dayHearings.map(h => (
                              <div
                                key={h.id}
                                className={`text-[10px] font-sans px-1.5 py-1 rounded border-l-2 cursor-pointer transition-shadow hover:shadow-md ${courtColors[h.courtType].bg} ${courtColors[h.courtType].text} ${courtColors[h.courtType].border} ${
                                  h.status === 'adjourned' ? 'opacity-50' : ''
                                }`}
                                onClick={() => setSelectedHearing(h)}
                              >
                                <div className="font-medium truncate">{h.caseTitle}</div>
                                <div className="opacity-70 truncate">{h.time} · {h.courtroom}</div>
                              </div>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Day View ─────────────────────────────────── */}
        {view === 'day' && (
          <motion.div key="day" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            {(() => {
              const dayHearings = getHearingsForDate(currentDate).sort((a, b) => a.date.getTime() - b.date.getTime());
              if (dayHearings.length === 0) {
                return (
                  <Card className="border-border/50">
                    <CardContent className="p-8 text-center">
                      <CalendarIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm font-sans text-muted-foreground">No hearings scheduled for this day</p>
                      <Button size="sm" className="mt-3 text-xs font-sans" onClick={() => setShowAddDialog(true)}>
                        <Plus className="h-3 w-3 mr-1" /> Schedule Hearing
                      </Button>
                    </CardContent>
                  </Card>
                );
              }
              return dayHearings.map(h => (
                <Card
                  key={h.id}
                  className={`border-l-4 ${courtColors[h.courtType].border} border-border/50 shadow-sm hover:shadow-md transition-all cursor-pointer ${
                    h.status === 'adjourned' ? 'opacity-60' : ''
                  }`}
                  onClick={() => setSelectedHearing(h)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Time column */}
                      <div className="text-center shrink-0 w-16">
                        <p className="text-sm font-semibold font-sans text-foreground">{h.time}</p>
                        <p className="text-[10px] font-sans text-muted-foreground">to {h.endTime}</p>
                      </div>
                      <Separator orientation="vertical" className="h-12" />
                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm font-semibold font-sans text-foreground truncate">{h.caseTitle}</p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge className={`${statusConfig[h.status].bg} ${statusConfig[h.status].text} text-[10px] font-sans border-0`}>
                              {statusConfig[h.status].label}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] font-sans">{h.type}</Badge>
                          </div>
                        </div>
                        <p className="text-[11px] font-sans text-muted-foreground mb-2">{h.caseNumber} · {h.client}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground font-sans">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{h.court} — {h.courtroom}</span>
                          <span className="flex items-center gap-1"><Gavel className="h-3 w-3" />{h.judge}</span>
                        </div>
                        {h.status === 'adjourned' && h.adjournmentReason && (
                          <div className="mt-2 flex items-start gap-1.5 text-[11px] font-sans text-warning">
                            <RotateCcw className="h-3 w-3 mt-0.5 shrink-0" />
                            <span>Adjourned: {h.adjournmentReason}{h.nextDate && ` · Next: ${h.nextDate.toLocaleDateString()}`}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ));
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Upcoming Hearings List (always visible below calendar) ── */}
      <div className="space-y-3 mt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold font-sans text-muted-foreground uppercase tracking-wider">Upcoming Hearings</h3>
          <span className="text-[10px] font-sans text-muted-foreground">{filteredHearings.filter(h => h.status === 'scheduled' && h.date >= today).length} scheduled</span>
        </div>
        {['Today', 'Tomorrow', 'This Week', 'Later'].map(group => {
          const groupHearings = filteredHearings.filter(h => {
            if (h.status !== 'scheduled') return false;
            const diff = Math.floor((h.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (group === 'Today') return isSameDay(h.date, today);
            if (group === 'Tomorrow') return diff === 1 || (diff === 0 && !isSameDay(h.date, today) && h.date > today);
            if (group === 'This Week') return diff >= 2 && diff < 7;
            return diff >= 7;
          }).sort((a, b) => a.date.getTime() - b.date.getTime());

          if (groupHearings.length === 0) return null;
          return (
            <div key={group}>
              <p className="text-[10px] font-bold font-sans text-muted-foreground uppercase tracking-widest mb-1.5 pl-1">{group}</p>
              <div className="space-y-1.5">
                {groupHearings.map(h => (
                  <div
                    key={h.id}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border border-border/50 bg-card hover:bg-secondary/30 cursor-pointer transition-colors border-l-[3px] ${courtColors[h.courtType].border}`}
                    onClick={() => setSelectedHearing(h)}
                  >
                    <div className="shrink-0 text-center w-12">
                      <p className="text-[11px] font-semibold font-sans text-foreground">{h.time}</p>
                      <p className="text-[9px] font-sans text-muted-foreground">{!isSameDay(h.date, today) ? formatDateShort(h.date) : ''}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold font-sans text-foreground truncate">{h.caseTitle}</p>
                      <p className="text-[10px] font-sans text-muted-foreground truncate">{h.court} · {h.judge}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {h.priority === 'critical' && <AlertTriangle className="h-3 w-3 text-destructive" />}
                      <Badge variant="outline" className="text-[9px] font-sans">{h.type}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Hearing Detail Dialog ──────────────────────── */}
      <Dialog open={!!selectedHearing} onOpenChange={open => !open && setSelectedHearing(null)}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
          {selectedHearing && (
            <>
              <div className={`${courtColors[selectedHearing.courtType].bg} px-5 py-4`}>
                <DialogHeader>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`h-2 w-2 rounded-full ${courtColors[selectedHearing.courtType].dot}`} />
                    <span className={`text-[10px] font-sans font-semibold uppercase tracking-wider ${courtColors[selectedHearing.courtType].text}`}>
                      {courtColors[selectedHearing.courtType].label}
                    </span>
                    <Badge className={`${statusConfig[selectedHearing.status].bg} ${statusConfig[selectedHearing.status].text} text-[10px] font-sans border-0 ml-auto`}>
                      {statusConfig[selectedHearing.status].label}
                    </Badge>
                  </div>
                  <DialogTitle className="text-base font-sans font-bold text-foreground">{selectedHearing.caseTitle}</DialogTitle>
                </DialogHeader>
              </div>
              <div className="px-5 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: FileText, label: 'Case #', value: selectedHearing.caseNumber },
                    { icon: User, label: 'Client', value: selectedHearing.client },
                    { icon: Clock, label: 'Time', value: `${selectedHearing.time} – ${selectedHearing.endTime}` },
                    { icon: CalendarIcon, label: 'Date', value: selectedHearing.date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) },
                    { icon: MapPin, label: 'Court', value: `${selectedHearing.court} — ${selectedHearing.courtroom}` },
                    { icon: Gavel, label: 'Judge', value: selectedHearing.judge },
                  ].map(item => (
                    <div key={item.label} className="space-y-0.5">
                      <p className="text-[10px] font-sans text-muted-foreground flex items-center gap-1"><item.icon className="h-3 w-3" />{item.label}</p>
                      <p className="text-xs font-sans font-medium text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>
                {selectedHearing.status === 'adjourned' && selectedHearing.adjournmentReason && (
                  <div className="rounded-lg bg-warning/10 border border-warning/20 p-3">
                    <p className="text-[10px] font-sans font-semibold text-warning uppercase tracking-wider mb-1">Adjournment Details</p>
                    <p className="text-xs font-sans text-foreground">{selectedHearing.adjournmentReason}</p>
                    {selectedHearing.nextDate && (
                      <p className="text-[11px] font-sans text-muted-foreground mt-1">Next date: <span className="font-medium text-foreground">{selectedHearing.nextDate.toLocaleDateString()}</span></p>
                    )}
                  </div>
                )}
                {selectedHearing.notes && (
                  <div className="rounded-lg bg-secondary/50 p-3">
                    <p className="text-[10px] font-sans font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                    <p className="text-xs font-sans text-foreground">{selectedHearing.notes}</p>
                  </div>
                )}
              </div>
              <div className="border-t border-border px-5 py-3 flex items-center gap-2">
                {selectedHearing.status === 'scheduled' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-sans gap-1.5 text-warning border-warning/30 hover:bg-warning/10"
                    onClick={() => { setAdjournTarget(selectedHearing); setShowAdjournDialog(true); setSelectedHearing(null); }}
                  >
                    <RotateCcw className="h-3 w-3" /> Mark Adjourned
                  </Button>
                )}
                <Button variant="outline" size="sm" className="text-xs font-sans gap-1.5">
                  <Bell className="h-3 w-3" /> Set Reminder
                </Button>
                <Button variant="outline" size="sm" className="text-xs font-sans gap-1.5 ml-auto" onClick={() => setSelectedHearing(null)}>
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Adjournment Dialog ─────────────────────────── */}
      <Dialog open={showAdjournDialog} onOpenChange={setShowAdjournDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-base font-sans">Log Adjournment</DialogTitle>
          </DialogHeader>
          {adjournTarget && (
            <div className="space-y-4">
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-xs font-sans font-semibold text-foreground">{adjournTarget.caseTitle}</p>
                <p className="text-[11px] font-sans text-muted-foreground">{adjournTarget.court} · {adjournTarget.date.toLocaleDateString()}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-sans">Reason for Adjournment *</Label>
                <Select value={adjournReason} onValueChange={setAdjournReason}>
                  <SelectTrigger className="text-xs font-sans h-9">
                    <SelectValue placeholder="Select reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    {['Judge on leave', 'Lawyer not available', 'Client absent', 'Court holiday', 'Case not reached', 'Mutual consent', 'Other'].map(r => (
                      <SelectItem key={r} value={r} className="text-xs font-sans">{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-sans">Next Hearing Date</Label>
                <Input type="date" className="text-xs font-sans h-9" value={adjournNextDate} onChange={e => setAdjournNextDate(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="text-xs font-sans" onClick={() => setShowAdjournDialog(false)}>Cancel</Button>
            <Button size="sm" className="text-xs font-sans bg-gradient-primary gap-1.5" onClick={handleAdjourn} disabled={!adjournReason}>
              <RotateCcw className="h-3 w-3" /> Confirm Adjournment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Hearing Dialog ─────────────────────────── */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-base font-sans">Schedule New Hearing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-sans">Link to Case *</Label>
                <Select>
                  <SelectTrigger className="text-xs font-sans h-9"><SelectValue placeholder="Select case file..." /></SelectTrigger>
                  <SelectContent>
                    {initialHearings.map(h => (
                      <SelectItem key={h.id} value={h.caseNumber} className="text-xs font-sans">{h.caseTitle} ({h.caseNumber})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Hearing Date *</Label>
                <Input type="date" className="text-xs font-sans h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Time *</Label>
                <Input type="time" className="text-xs font-sans h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Court *</Label>
                <Select>
                  <SelectTrigger className="text-xs font-sans h-9"><SelectValue placeholder="Select court..." /></SelectTrigger>
                  <SelectContent>
                    {['Lahore High Court', 'Sessions Court, Islamabad', 'Supreme Court of Pakistan', 'Civil Court, Lahore', 'Banking Court, Lahore', 'Labour Court, Faisalabad'].map(c => (
                      <SelectItem key={c} value={c} className="text-xs font-sans">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Court Type *</Label>
                <Select>
                  <SelectTrigger className="text-xs font-sans h-9"><SelectValue placeholder="Select type..." /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(courtColors).map(([k, v]) => (
                      <SelectItem key={k} value={k} className="text-xs font-sans">
                        <span className="flex items-center gap-1.5"><span className={`h-2 w-2 rounded-full ${v.dot}`} />{v.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Courtroom</Label>
                <Input placeholder="e.g. Court 3" className="text-xs font-sans h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Judge</Label>
                <Input placeholder="Judge name" className="text-xs font-sans h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Hearing Type</Label>
                <Select>
                  <SelectTrigger className="text-xs font-sans h-9"><SelectValue placeholder="Type..." /></SelectTrigger>
                  <SelectContent>
                    {['Arguments', 'Evidence', 'Hearing', 'Discovery', 'Mediation', 'Constitutional Petition', 'Tax Appeal', 'Bail', 'Judgment'].map(t => (
                      <SelectItem key={t} value={t} className="text-xs font-sans">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-sans">Priority</Label>
                <Select>
                  <SelectTrigger className="text-xs font-sans h-9"><SelectValue placeholder="Priority..." /></SelectTrigger>
                  <SelectContent>
                    {['critical', 'high', 'medium', 'low'].map(p => (
                      <SelectItem key={p} value={p} className="text-xs font-sans capitalize">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label className="text-xs font-sans">Notes</Label>
                <Textarea placeholder="Any special instructions or preparation notes..." className="text-xs font-sans min-h-[60px]" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" className="text-xs font-sans" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button size="sm" className="text-xs font-sans bg-gradient-primary gap-1.5" onClick={() => setShowAddDialog(false)}>
              <Plus className="h-3 w-3" /> Schedule Hearing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
