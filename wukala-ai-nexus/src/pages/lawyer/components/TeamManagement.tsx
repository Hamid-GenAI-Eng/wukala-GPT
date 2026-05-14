import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  MoreVertical,
  Mail,
  Phone,
  Briefcase,
  Clock,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  CheckCircle2,
  Circle,
  AlertCircle,
  ArrowRight,
  Calendar,
  Search,
  Activity,
  FileText,
  Eye,
  Upload,
  MessageSquare,
  X,
  Send,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// ── Types ──
interface TeamMember {
  id: number;
  name: string;
  role: 'Administrator' | 'Junior Lawyer' | 'Clerk';
  email: string;
  phone: string;
  activeCases: number;
  tasksCompleted: number;
  tasksPending: number;
  status: 'Available' | 'In Court' | 'Busy';
  specialization: string;
  joinedDate: string;
}

interface Task {
  id: number;
  title: string;
  assignedTo: string;
  assignedBy: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed';
  type: 'Research' | 'Drafting' | 'Case Prep' | 'Filing';
}

interface ActivityLog {
  id: number;
  member: string;
  action: string;
  target: string;
  timestamp: string;
  type: 'case' | 'document' | 'note' | 'billing' | 'login';
}

// ── Data ──
const teamMembers: TeamMember[] = [
  { id: 1, name: 'Adv. Sara Malik', role: 'Administrator', email: 'sara@lawfirm.pk', phone: '+92 300 111 2233', activeCases: 8, tasksCompleted: 45, tasksPending: 3, status: 'Available', specialization: 'Corporate Law', joinedDate: 'Jan 2022' },
  { id: 2, name: 'Adv. Hassan Raza', role: 'Junior Lawyer', email: 'hassan@lawfirm.pk', phone: '+92 321 444 5566', activeCases: 6, tasksCompleted: 32, tasksPending: 5, status: 'In Court', specialization: 'Criminal Law', joinedDate: 'Jun 2023' },
  { id: 3, name: 'Adv. Ayesha Khan', role: 'Junior Lawyer', email: 'ayesha@lawfirm.pk', phone: '+92 333 777 8899', activeCases: 4, tasksCompleted: 28, tasksPending: 2, status: 'Available', specialization: 'Civil Litigation', joinedDate: 'Mar 2023' },
  { id: 4, name: 'Zain Ahmed', role: 'Clerk', email: 'zain@lawfirm.pk', phone: '+92 312 222 3344', activeCases: 0, tasksCompleted: 67, tasksPending: 8, status: 'Busy', specialization: 'Court Filing & Scheduling', joinedDate: 'Sep 2022' },
  { id: 5, name: 'Hira Noor', role: 'Clerk', email: 'hira@lawfirm.pk', phone: '+92 345 555 6677', activeCases: 0, tasksCompleted: 54, tasksPending: 4, status: 'Available', specialization: 'Administration & Records', joinedDate: 'Nov 2022' },
];

const tasks: Task[] = [
  { id: 1, title: 'Research precedents for Khan Industries appeal', assignedTo: 'Adv. Hassan Raza', assignedBy: 'Adv. Sara Malik', dueDate: '2025-07-15', priority: 'High', status: 'In Progress', type: 'Research' },
  { id: 2, title: 'Draft bail application — State v. Ali Raza', assignedTo: 'Adv. Ayesha Khan', assignedBy: 'Adv. Sara Malik', dueDate: '2025-07-12', priority: 'High', status: 'Pending', type: 'Drafting' },
  { id: 3, title: 'File written statement in Civil Suit #2847', assignedTo: 'Zain Ahmed', assignedBy: 'Adv. Sara Malik', dueDate: '2025-07-18', priority: 'Medium', status: 'Pending', type: 'Filing' },
  { id: 4, title: 'Prepare case bundle for Supreme Court hearing', assignedTo: 'Adv. Hassan Raza', assignedBy: 'Adv. Sara Malik', dueDate: '2025-07-20', priority: 'High', status: 'In Progress', type: 'Case Prep' },
  { id: 5, title: 'Scan and upload property documents — Islamabad Realty', assignedTo: 'Hira Noor', assignedBy: 'Adv. Sara Malik', dueDate: '2025-07-14', priority: 'Low', status: 'Completed', type: 'Filing' },
  { id: 6, title: 'Research Section 498-A applicability in Lahore HC', assignedTo: 'Adv. Ayesha Khan', assignedBy: 'Adv. Sara Malik', dueDate: '2025-07-22', priority: 'Medium', status: 'In Progress', type: 'Research' },
];

const activityLogs: ActivityLog[] = [
  { id: 1, member: 'Adv. Hassan Raza', action: 'Accessed case file', target: 'Khan Industries v. Tax Authority', timestamp: '10 min ago', type: 'case' },
  { id: 2, member: 'Hira Noor', action: 'Uploaded document', target: 'Property Survey Report.pdf', timestamp: '25 min ago', type: 'document' },
  { id: 3, member: 'Adv. Ayesha Khan', action: 'Added case note', target: 'State v. Ali Raza', timestamp: '1 hour ago', type: 'note' },
  { id: 4, member: 'Zain Ahmed', action: 'Filed court document', target: 'Civil Suit #2847 — Written Statement', timestamp: '2 hours ago', type: 'document' },
  { id: 5, member: 'Adv. Hassan Raza', action: 'Updated billing entry', target: 'Khan Industries — ₨ 150,000', timestamp: '3 hours ago', type: 'billing' },
  { id: 6, member: 'Adv. Ayesha Khan', action: 'Logged in', target: 'Mobile App', timestamp: '4 hours ago', type: 'login' },
  { id: 7, member: 'Hira Noor', action: 'Accessed case file', target: 'Ahmed Real Estate — Sale Deed', timestamp: '5 hours ago', type: 'case' },
];

const firmCalendar = [
  { time: '09:00 AM', lawyer: 'Adv. Sara Malik', hearing: 'Khan Industries v. Tax Authority', court: 'Lahore High Court', color: 'bg-success' },
  { time: '10:30 AM', lawyer: 'Adv. Hassan Raza', hearing: 'State v. Ali Raza', court: 'Sessions Court, Lahore', color: 'bg-primary' },
  { time: '11:00 AM', lawyer: 'Adv. Ayesha Khan', hearing: 'Fatima Bibi v. Akram', court: 'Family Court, Lahore', color: 'bg-gold' },
  { time: '02:00 PM', lawyer: 'Adv. Sara Malik', hearing: 'Ahmed Real Estate — Injunction', court: 'Civil Court, Lahore', color: 'bg-primary' },
  { time: '03:30 PM', lawyer: 'Adv. Hassan Raza', hearing: 'Islamabad Developers — NAB Reference', court: 'NAB Court, Lahore', color: 'bg-destructive' },
];

const statusColor: Record<string, string> = {
  Available: 'bg-success/10 text-success border-success/20',
  'In Court': 'bg-gold/10 text-gold border-gold/20',
  Busy: 'bg-destructive/10 text-destructive border-destructive/20',
};

const roleIcon: Record<string, React.ElementType> = {
  Administrator: ShieldCheck,
  'Junior Lawyer': Shield,
  Clerk: ShieldAlert,
};

const roleColor: Record<string, string> = {
  Administrator: 'bg-primary/10 text-primary border-primary/20',
  'Junior Lawyer': 'bg-gold/10 text-gold border-gold/20',
  Clerk: 'bg-secondary text-muted-foreground border-border/50',
};

const priorityColor: Record<string, string> = {
  High: 'bg-destructive/10 text-destructive border-destructive/20',
  Medium: 'bg-gold/10 text-gold border-gold/20',
  Low: 'bg-success/10 text-success border-success/20',
};

const taskStatusIcon: Record<string, React.ElementType> = {
  Pending: Circle,
  'In Progress': AlertCircle,
  Completed: CheckCircle2,
};

const activityIcon: Record<string, React.ElementType> = {
  case: Briefcase,
  document: FileText,
  note: MessageSquare,
  billing: Activity,
  login: Eye,
};

type TabKey = 'members' | 'tasks' | 'activity' | 'calendar';
const tabList: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'members', label: 'Team', icon: Shield },
  { key: 'tasks', label: 'Tasks', icon: CheckCircle2 },
  { key: 'activity', label: 'Activity Log', icon: Activity },
  { key: 'calendar', label: 'Firm Calendar', icon: Calendar },
];

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.25 } };

export default function TeamManagement() {
  const [activeTab, setActiveTab] = useState<TabKey>('members');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [taskFilter, setTaskFilter] = useState<string>('all');

  const filteredTasks = taskFilter === 'all' ? tasks : tasks.filter(t => t.status === taskFilter);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold font-sans text-foreground">Team & Staff Management</h2>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">{teamMembers.length} members · Role-based access control</p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-gradient-primary font-sans text-xs gap-1.5 h-9">
              <UserPlus className="h-3.5 w-3.5" /> Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-sans text-foreground">Invite Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-xs font-sans text-muted-foreground">Email Address</label>
                <Input placeholder="colleague@lawfirm.pk" className="mt-1 text-sm font-sans" />
              </div>
              <div>
                <label className="text-xs font-sans text-muted-foreground mb-2 block">Assign Role</label>
                <div className="space-y-2">
                  {[
                    { role: 'Junior Lawyer', desc: 'Can view and update cases, hearings, documents. Cannot access billing.' },
                    { role: 'Clerk', desc: 'Can view hearing schedules and basic case data only. Read-only access.' },
                  ].map(r => (
                    <div key={r.role} className="p-3 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer">
                      <p className="text-sm font-semibold font-sans text-foreground">{r.role}</p>
                      <p className="text-[10px] text-muted-foreground font-sans mt-0.5">{r.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <Button className="w-full bg-gradient-primary font-sans text-sm gap-2">
                <Send className="h-4 w-4" /> Send Invitation
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Administrators', value: teamMembers.filter(m => m.role === 'Administrator').length, icon: ShieldCheck, color: 'text-primary' },
          { label: 'Junior Lawyers', value: teamMembers.filter(m => m.role === 'Junior Lawyer').length, icon: Shield, color: 'text-gold' },
          { label: 'Clerks', value: teamMembers.filter(m => m.role === 'Clerk').length, icon: ShieldAlert, color: 'text-muted-foreground' },
          { label: 'Pending Tasks', value: tasks.filter(t => t.status !== 'Completed').length, icon: Clock, color: 'text-destructive' },
        ].map(s => (
          <Card key={s.label} className="border-border/50 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-[10px] text-muted-foreground font-sans">{s.label}</span>
              </div>
              <p className="text-xl font-bold font-sans text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
        <TabsList className="bg-secondary/50 h-9 p-0.5 w-full justify-start overflow-x-auto">
          {tabList.map(t => (
            <TabsTrigger key={t.key} value={t.key} className="text-[11px] font-sans gap-1 px-2.5 data-[state=active]:bg-background">
              <t.icon className="h-3 w-3" /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <AnimatePresence mode="wait">
        {/* ═══ TEAM MEMBERS ═══ */}
        {activeTab === 'members' && (
          <motion.div key="members" {...fadeIn} className="space-y-3">
            {teamMembers.map(member => {
              const RoleIcon = roleIcon[member.role];
              return (
                <Card key={member.id} className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-11 w-11 border-2 border-border shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold font-sans">
                            {member.name.replace('Adv. ', '').split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold font-sans text-foreground">{member.name}</p>
                            <Badge variant="outline" className={`text-[9px] font-sans gap-0.5 ${roleColor[member.role]}`}>
                              <RoleIcon className="h-2.5 w-2.5" /> {member.role}
                            </Badge>
                            <Badge variant="outline" className={`text-[9px] font-sans ${statusColor[member.status]}`}>{member.status}</Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground font-sans">{member.specialization} · Joined {member.joinedDate}</p>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground font-sans">
                            <span className="flex items-center gap-0.5"><Mail className="h-3 w-3" /> {member.email}</span>
                            <span className="flex items-center gap-0.5"><Phone className="h-3 w-3" /> {member.phone}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-5 sm:gap-6">
                        {member.role !== 'Clerk' && (
                          <div className="text-center">
                            <p className="text-sm font-bold font-sans text-foreground">{member.activeCases}</p>
                            <p className="text-[10px] text-muted-foreground font-sans">Cases</p>
                          </div>
                        )}
                        <div className="text-center">
                          <p className="text-sm font-bold font-sans text-success">{member.tasksCompleted}</p>
                          <p className="text-[10px] text-muted-foreground font-sans">Done</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold font-sans text-gold">{member.tasksPending}</p>
                          <p className="text-[10px] text-muted-foreground font-sans">Pending</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>
        )}

        {/* ═══ TASK BOARD ═══ */}
        {activeTab === 'tasks' && (
          <motion.div key="tasks" {...fadeIn} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex bg-secondary/50 rounded-md p-0.5">
                {['all', 'Pending', 'In Progress', 'Completed'].map(f => (
                  <Button key={f} variant={taskFilter === f ? 'default' : 'ghost'} size="sm" className="h-7 text-[10px] px-2.5 font-sans" onClick={() => setTaskFilter(f)}>
                    {f === 'all' ? 'All' : f}
                  </Button>
                ))}
              </div>
              <Button size="sm" className="bg-gradient-primary font-sans text-xs gap-1.5 h-8">
                <Plus className="h-3 w-3" /> Assign Task
              </Button>
            </div>

            <div className="space-y-2">
              {filteredTasks.map(task => {
                const StatusIcon = taskStatusIcon[task.status];
                return (
                  <Card key={task.id} className="border-border/50 shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-3.5">
                      <div className="flex items-start gap-3">
                        <StatusIcon className={`h-4 w-4 mt-0.5 shrink-0 ${
                          task.status === 'Completed' ? 'text-success' : task.status === 'In Progress' ? 'text-gold' : 'text-muted-foreground'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold font-sans text-foreground ${task.status === 'Completed' ? 'line-through opacity-60' : ''}`}>{task.title}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className={`text-[9px] font-sans ${priorityColor[task.priority]}`}>{task.priority}</Badge>
                            <Badge variant="secondary" className="text-[9px] font-sans">{task.type}</Badge>
                            <span className="text-[10px] text-muted-foreground font-sans">→ {task.assignedTo}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground font-sans mt-1">
                            <Clock className="h-3 w-3 inline mr-0.5" /> Due: {new Date(task.dueDate).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ═══ ACTIVITY LOG ═══ */}
        {activeTab === 'activity' && (
          <motion.div key="activity" {...fadeIn} className="space-y-4">
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold font-sans text-foreground mb-3">Recent Activity — All Team Members</h3>
                <div className="space-y-0">
                  {activityLogs.map((log, i) => {
                    const Icon = activityIcon[log.type];
                    return (
                      <div key={log.id} className="flex items-start gap-3 py-3 border-b border-border/30 last:border-0">
                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-sans text-foreground">
                            <span className="font-semibold">{log.member}</span> {log.action}
                          </p>
                          <p className="text-[11px] text-primary font-sans font-medium mt-0.5">{log.target}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-sans shrink-0">{log.timestamp}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ═══ FIRM CALENDAR ═══ */}
        {activeTab === 'calendar' && (
          <motion.div key="calendar" {...fadeIn} className="space-y-4">
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold font-sans text-foreground">Today's Firm-Wide Schedule</h3>
                  <Badge variant="secondary" className="text-[10px] font-sans">{firmCalendar.length} hearings today</Badge>
                </div>
                <div className="space-y-2">
                  {firmCalendar.map((h, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors">
                      <div className={`h-10 w-1 rounded-full ${h.color} shrink-0`} />
                      <div className="text-center shrink-0 w-16">
                        <p className="text-xs font-bold font-sans text-foreground">{h.time}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold font-sans text-foreground truncate">{h.hearing}</p>
                        <p className="text-[10px] text-muted-foreground font-sans">{h.lawyer} · {h.court}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Court Legend */}
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-4">
                <h3 className="text-xs font-semibold font-sans text-foreground mb-2">Court Color Key</h3>
                <div className="flex flex-wrap gap-3">
                  {[
                    { court: 'High Court', color: 'bg-success' },
                    { court: 'District / Sessions', color: 'bg-primary' },
                    { court: 'Family Court', color: 'bg-gold' },
                    { court: 'NAB / Special', color: 'bg-destructive' },
                  ].map(c => (
                    <div key={c.court} className="flex items-center gap-1.5">
                      <div className={`h-2.5 w-2.5 rounded-full ${c.color}`} />
                      <span className="text-[10px] font-sans text-muted-foreground">{c.court}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
