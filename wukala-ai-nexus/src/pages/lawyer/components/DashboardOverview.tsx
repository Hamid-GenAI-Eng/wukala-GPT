import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Briefcase,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  ArrowRight,
  FileText,
  Gavel,
  Scale,
  CheckCircle2,
} from 'lucide-react';

interface Props {
  onNavigate: (section: string) => void;
}

const stats = [
  { label: 'Active Cases', value: '47', change: '+3 this week', icon: Briefcase, trend: 'up', color: 'text-primary' },
  { label: 'Upcoming Hearings', value: '12', change: 'Next: Tomorrow', icon: Calendar, trend: 'neutral', color: 'text-gold' },
  { label: 'Active Clients', value: '83', change: '+5 this month', icon: Users, trend: 'up', color: 'text-success' },
  { label: 'Revenue (MTD)', value: '₨ 4.2M', change: '+18% vs last', icon: DollarSign, trend: 'up', color: 'text-gold' },
];

const urgentItems = [
  { title: 'Filing deadline: Ahmed vs. State Bank', time: 'Due in 2 hours', type: 'critical' },
  { title: 'Client meeting: Fatima Enterprises', time: 'Today, 3:00 PM', type: 'warning' },
  { title: 'Court appearance: Civil Suit #2847', time: 'Tomorrow, 10:00 AM', type: 'info' },
];

const recentCases = [
  { name: 'Khan Industries v. FBR', court: 'Lahore High Court', status: 'Active', type: 'Tax' },
  { name: 'State v. Ali Raza', court: 'Sessions Court', status: 'Hearing', type: 'Criminal' },
  { name: 'Noor Enterprises Partnership', court: 'Civil Court', status: 'Discovery', type: 'Civil' },
  { name: 'Islamabad Realty Dispute', court: 'Supreme Court', status: 'Pending', type: 'Property' },
];

export default function DashboardOverview({ onNavigate }: Props) {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl bg-gradient-primary p-5 lg:p-6 text-primary-foreground relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/2 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative">
          <h2 className="text-lg lg:text-xl font-semibold font-sans">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}</h2>
          <p className="text-primary-foreground/70 text-sm mt-1 font-sans">You have <span className="font-semibold text-primary-foreground">3 urgent tasks</span> and <span className="font-semibold text-primary-foreground">2 hearings</span> today.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`h-9 w-9 rounded-lg bg-secondary flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-[18px] w-[18px]" />
                </div>
                {stat.trend === 'up' && <TrendingUp className="h-4 w-4 text-success" />}
              </div>
              <p className="text-xl lg:text-2xl font-bold font-sans text-foreground tracking-tight">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1 font-sans">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-4 lg:gap-5">
        {/* Urgent Items */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold font-sans flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                Urgent Attention
              </CardTitle>
              <Badge variant="destructive" className="text-[10px] font-sans">3 items</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {urgentItems.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border/30">
                <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                  item.type === 'critical' ? 'bg-destructive' : item.type === 'warning' ? 'bg-gold' : 'bg-primary'
                }`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium font-sans text-foreground truncate">{item.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Clock className="h-3 w-3" />{item.time}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Cases */}
        <Card className="lg:col-span-3 border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold font-sans flex items-center gap-2">
                <Scale className="h-4 w-4 text-primary" />
                Recent Cases
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs font-sans h-7" onClick={() => onNavigate('cases')}>
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentCases.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer border border-transparent hover:border-border/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <Gavel className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium font-sans text-foreground truncate">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground font-sans">{c.court}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-[10px] font-sans">{c.type}</Badge>
                    <Badge variant={c.status === 'Active' ? 'default' : 'secondary'} className="text-[10px] font-sans">{c.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Performance */}
      <div className="grid lg:grid-cols-3 gap-4 lg:gap-5">
        {/* Quick Actions */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold font-sans">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {[
              { label: 'New Case', icon: Briefcase, section: 'cases' },
              { label: 'Schedule', icon: Calendar, section: 'calendar' },
              { label: 'Add Client', icon: Users, section: 'clients' },
              { label: 'Draft Doc', icon: FileText, section: 'documents' },
            ].map((action) => (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto py-3 flex flex-col items-center gap-1.5 text-xs font-sans border-border/50 hover:bg-secondary/50"
                onClick={() => onNavigate(action.section)}
              >
                <action.icon className="h-4 w-4 text-muted-foreground" />
                {action.label}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Case Distribution */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold font-sans">Case Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { type: 'Civil', count: 18, total: 47, color: 'bg-primary' },
              { type: 'Criminal', count: 12, total: 47, color: 'bg-destructive' },
              { type: 'Corporate', count: 9, total: 47, color: 'bg-gold' },
              { type: 'Tax & Revenue', count: 8, total: 47, color: 'bg-success' },
            ].map((item) => (
              <div key={item.type} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="text-muted-foreground">{item.type}</span>
                  <span className="font-medium text-foreground">{item.count}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all duration-500`}
                    style={{ width: `${(item.count / item.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Monthly Target */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold font-sans">Monthly Target</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center">
                <svg className="h-24 w-24 -rotate-90">
                  <circle cx="48" cy="48" r="40" strokeWidth="6" className="fill-none stroke-secondary" />
                  <circle cx="48" cy="48" r="40" strokeWidth="6" strokeLinecap="round" className="fill-none stroke-primary" strokeDasharray={`${0.72 * 251} 251`} />
                </svg>
                <span className="absolute text-lg font-bold font-sans text-foreground">72%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-sans">₨ 4.2M / ₨ 5.8M Target</p>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Cases Won', value: '8/11', icon: CheckCircle2 },
                { label: 'Hours Billed', value: '142h', icon: Clock },
                { label: 'Client Retention', value: '94%', icon: TrendingUp },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between text-xs font-sans py-1.5">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <m.icon className="h-3 w-3" />{m.label}
                  </span>
                  <span className="font-semibold text-foreground">{m.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
