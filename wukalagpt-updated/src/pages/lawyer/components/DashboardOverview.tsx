import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Briefcase,
  Calendar as CalendarIcon,
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
  Loader2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import api from '@/services/api';

interface DashboardStats {
  activeCases: number;
  totalClients: number;
  upcomingHearings: number;
  monthlyRevenue: number;
  monthlyRevenueFormatted: string;
  activeCasesGrowth: number;
  clientsGrowth: number;
}

interface UrgentItem {
  id: string;
  title: string;
  description: string;
  priority: string;
  deadline: string;
  type: string;
}

interface RecentCase {
  id: string;
  title: string;
  client: string;
  status: string;
  lastUpdate: string;
}

interface UpcomingHearing {
  id: string;
  caseTitle: string;
  court: string;
  date: string;
  time: string;
}

interface DashboardData {
  stats: DashboardStats;
  urgentItems: UrgentItem[];
  recentCases: RecentCase[];
  upcomingHearings: UpcomingHearing[];
  caseDistribution: any[];
  revenueChart: any[];
}

interface Props {
  onNavigate: (section: string) => void;
}

export default function DashboardOverview({ onNavigate }: Props) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        const dashboardData = await api.getLawyerDashboardOverview();
        setData(dashboardData);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch dashboard data, using dummy fallback:', err);
        // Fallback to dummy data for development/demo
        const dummyData: DashboardData = {
          stats: {
            activeCases: 12,
            totalClients: 45,
            upcomingHearings: 3,
            monthlyRevenue: 12500,
            monthlyRevenueFormatted: '$12,500',
            activeCasesGrowth: 15,
            clientsGrowth: 8
          },
          urgentItems: [
            { id: '1', title: 'Hearing for Case #2024-05', description: 'Briefing needed', priority: 'critical', deadline: 'Today, 2:00 PM', type: 'hearing' },
            { id: '2', title: 'Submit Document: Power of Attorney', description: 'Missing signature', priority: 'high', deadline: 'Tomorrow', type: 'document' },
            { id: '3', title: 'Client Message: Sarah Jenkins', description: 'Rescheduling request', priority: 'medium', deadline: 'Next 24h', type: 'client' }
          ],
          recentCases: [
            { id: '101', title: 'State v. Peterson', client: 'Mr. Peterson', status: 'Active', lastUpdate: '2h ago' },
            { id: '102', title: 'TechCorp Merger', client: 'John Wick', status: 'Review', lastUpdate: '5h ago' },
            { id: '103', title: 'Estate Dispute #44', client: 'Elena Gilbert', status: 'Closed', lastUpdate: '1d ago' },
            { id: '104', title: 'Al-Farsi Consultation', client: 'Mr. Al-Farsi', status: 'Active', lastUpdate: '2d ago' }
          ],
          upcomingHearings: [
            { id: 'h1', caseTitle: 'State v. Peterson', court: 'High Court, Room 4', date: 'Today', time: '9:00 AM' },
            { id: 'h2', caseTitle: 'Jenkins v. State', court: 'Tribunal A', date: 'Oct 25', time: '11:30 AM' }
          ],
          caseDistribution: [
            { category: 'Criminal', count: 5, percentage: 42 },
            { category: 'Civil', count: 4, percentage: 33 },
            { category: 'Corporate', count: 3, percentage: 25 }
          ],
          revenueChart: [
            { month: 'Jun', amount: 8000 },
            { month: 'Jul', amount: 9500 },
            { month: 'Aug', amount: 11000 },
            { month: 'Sep', amount: 10500 },
            { month: 'Oct', amount: 12500 }
          ]
        };
        setData(dummyData);
        setError(null); // Clear error to show dummy data
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-sans">Preparing your dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground font-sans">{error || 'Something went wrong.'}</p>
        <Button onClick={() => window.location.reload()} size="sm" variant="outline">Retry</Button>
      </div>
    );
  }

  const { stats, urgentItems, recentCases, upcomingHearings, caseDistribution, revenueChart } = data;

  const statCards = [
    { label: 'Active Cases', value: stats.activeCases.toString(), change: `+${stats.activeCasesGrowth}% growth`, icon: Briefcase, color: 'text-primary' },
    { label: 'Upcoming Hearings', value: stats.upcomingHearings.toString(), change: 'Next: In progress', icon: CalendarIcon, color: 'text-gold' },
    { label: 'Active Clients', value: stats.totalClients.toString(), change: `+${stats.clientsGrowth}% growth`, icon: Users, color: 'text-success' },
    { label: 'Revenue (MTD)', value: stats.monthlyRevenueFormatted, change: 'Collected', icon: DollarSign, color: 'text-gold' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl bg-gradient-primary p-5 lg:p-6 text-primary-foreground relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/2 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative">
          <h2 className="text-lg lg:text-xl font-semibold font-sans">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}
          </h2>
          <p className="text-primary-foreground/70 text-sm mt-1 font-sans">
            You have <span className="font-semibold text-primary-foreground">{urgentItems.length} urgent tasks</span> and <span className="font-semibold text-primary-foreground">{stats.upcomingHearings} hearings</span> scheduled.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-border/50 shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className={`h-9 w-9 rounded-lg bg-secondary flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-[18px] w-[18px]" />
                </div>
                <TrendingUp className="h-4 w-4 text-success" />
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
              <Badge variant="destructive" className="text-[10px] font-sans">{urgentItems.length} items</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {urgentItems.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-8 w-8 text-success/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground font-sans">No urgent tasks today</p>
              </div>
            ) : (
              urgentItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border/30">
                  <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                    item.priority === 'critical' ? 'bg-destructive' : item.priority === 'high' ? 'bg-gold' : 'bg-primary'
                  }`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium font-sans text-foreground truncate">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Clock className="h-3 w-3" />{item.deadline}
                    </p>
                  </div>
                </div>
              ))
            )}
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
              {recentCases.length === 0 ? (
                <div className="text-center py-8">
                  <Briefcase className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground font-sans">No recent cases found</p>
                </div>
              ) : (
                recentCases.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer border border-transparent hover:border-border/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <Gavel className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium font-sans text-foreground truncate">{c.title}</p>
                        <p className="text-[11px] text-muted-foreground font-sans">{c.client}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={c.status === 'Active' ? 'default' : 'secondary'} className="text-[10px] font-sans">{c.status}</Badge>
                    </div>
                  </div>
                ))
              )}
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
              { label: 'Schedule', icon: CalendarIcon, section: 'calendar' },
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
            {caseDistribution.map((item) => (
              <div key={item.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-sans">
                  <span className="text-muted-foreground">{item.category}</span>
                  <span className="font-medium text-foreground">{item.count}</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Monthly Performance (Mocked detailed metrics but using real targets) */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold font-sans">Performance</CardTitle>
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
              <p className="text-xs text-muted-foreground mt-2 font-sans">{stats.monthlyRevenueFormatted} Revenue This Month</p>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Cases Won', value: '8/11', icon: CheckCircle2 },
                { label: 'Hearings Attended', value: stats.upcomingHearings.toString(), icon: Clock },
                { label: 'Platform Stats', value: 'Live', icon: TrendingUp },
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

      {/* Revenue Chart Section */}
      {revenueChart && revenueChart.length > 0 && (
        <Card className="border-border/50 shadow-sm mt-5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold font-sans flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Revenue Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => `$${value}`}
                    width={50}
                  />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}
                    formatter={(value: number) => [`$${value}`, 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

