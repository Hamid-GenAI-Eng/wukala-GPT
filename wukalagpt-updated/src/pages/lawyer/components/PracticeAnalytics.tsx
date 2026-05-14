import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
  Briefcase,
  Clock,
  Scale,
  Target,
  Award,
  Calendar,
  Users,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  Filter,
  Flame,
  UserPlus,
  Repeat,
  MapPin,
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ──
interface KPI {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ElementType;
  detail: string;
}

// ── Data ──
const kpiCards: KPI[] = [
  { label: 'Active Cases', value: '34', change: '+6', trend: 'up', icon: Briefcase, detail: 'vs 28 last month' },
  { label: 'Win Rate', value: '78%', change: '+4%', trend: 'up', icon: Award, detail: 'Won 32 of 41 decided' },
  { label: 'Avg. Case Duration', value: '8.2 mo', change: '-1.3', trend: 'up', icon: Clock, detail: 'Down from 9.5 months' },
  { label: 'Monthly Revenue', value: '₨ 4.2M', change: '+18%', trend: 'up', icon: DollarSign, detail: 'vs ₨ 3.6M last month' },
  { label: 'Collection Rate', value: '82%', change: '-3%', trend: 'down', icon: Target, detail: '₨ 3.4M of ₨ 4.2M collected' },
  { label: 'New Clients', value: '7', change: '+2', trend: 'up', icon: UserPlus, detail: '5 referrals, 2 organic' },
];

const revenueData = [
  { month: 'Jul', revenue: 280, expenses: 120 },
  { month: 'Aug', revenue: 320, expenses: 140 },
  { month: 'Sep', revenue: 310, expenses: 130 },
  { month: 'Oct', revenue: 380, expenses: 150 },
  { month: 'Nov', revenue: 350, expenses: 145 },
  { month: 'Dec', revenue: 420, expenses: 160 },
  { month: 'Jan', revenue: 390, expenses: 155 },
  { month: 'Feb', revenue: 450, expenses: 170 },
  { month: 'Mar', revenue: 480, expenses: 175 },
  { month: 'Apr', revenue: 520, expenses: 180 },
  { month: 'May', revenue: 490, expenses: 165 },
  { month: 'Jun', revenue: 560, expenses: 190 },
];

const caseOutcomes = [
  { label: 'Won', value: 32, pct: 78, color: 'bg-success' },
  { label: 'Lost', value: 5, pct: 12, color: 'bg-destructive' },
  { label: 'Settled', value: 4, pct: 10, color: 'bg-gold' },
];

const courtAnalytics = [
  { court: 'District Court, Lahore', hearings: 48, cases: 14, winRate: '82%', color: 'bg-primary' },
  { court: 'Lahore High Court', hearings: 22, cases: 8, winRate: '75%', color: 'bg-success' },
  { court: 'Supreme Court', hearings: 6, cases: 3, winRate: '67%', color: 'bg-destructive' },
  { court: 'Banking Court', hearings: 12, cases: 5, winRate: '80%', color: 'bg-gold' },
  { court: 'NAB Court', hearings: 8, cases: 4, winRate: '50%', color: 'bg-primary-muted' },
];

const winRateByType = [
  { type: 'Civil Litigation', won: 14, total: 17, rate: '82%' },
  { type: 'Criminal Defense', won: 8, total: 11, rate: '73%' },
  { type: 'Corporate/Commercial', won: 6, total: 7, rate: '86%' },
  { type: 'Family Law', won: 4, total: 6, rate: '67%' },
];

const clientInsights = [
  { name: 'Khan Industries Pvt Ltd', cases: 5, totalBilled: '₨ 1.8M', status: 'Active', retention: '3 years' },
  { name: 'Ahmed Real Estate Group', cases: 3, totalBilled: '₨ 1.2M', status: 'Active', retention: '2 years' },
  { name: 'Fatima Bibi', cases: 2, totalBilled: '₨ 450K', status: 'Active', retention: '1 year' },
  { name: 'Islamabad Developers', cases: 4, totalBilled: '₨ 980K', status: 'Active', retention: '18 months' },
  { name: 'National Foods Ltd', cases: 1, totalBilled: '₨ 320K', status: 'New', retention: '2 months' },
];

const heatmapData = [
  // weeks x days (0=Sun to 6=Sat), intensity 0-4
  [0, 2, 3, 1, 4, 2, 0],
  [0, 1, 2, 3, 2, 1, 0],
  [0, 3, 4, 2, 3, 1, 0],
  [0, 2, 1, 4, 3, 2, 0],
  [0, 1, 3, 2, 4, 3, 0],
  [0, 2, 2, 3, 1, 2, 0],
  [0, 4, 3, 2, 3, 1, 0],
  [0, 1, 2, 4, 2, 3, 0],
  [0, 3, 1, 3, 4, 2, 0],
  [0, 2, 3, 1, 2, 1, 0],
  [0, 1, 4, 3, 3, 2, 0],
  [0, 2, 2, 4, 1, 3, 0],
];

const heatColors = ['bg-secondary', 'bg-success/20', 'bg-success/40', 'bg-success/60', 'bg-success/80'];
const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type TabKey = 'overview' | 'cases' | 'revenue' | 'clients' | 'workload';

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'cases', label: 'Cases & Courts', icon: Scale },
  { key: 'revenue', label: 'Revenue', icon: DollarSign },
  { key: 'clients', label: 'Client Insights', icon: Users },
  { key: 'workload', label: 'Workload', icon: Flame },
];

const fadeIn = { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.25 } };

// ── Helpers ──
function MiniBarChart({ data, maxVal }: { data: { month: string; revenue: number; expenses: number }[]; maxVal: number }) {
  return (
    <div className="flex items-end gap-1.5 h-36 mt-2">
      {data.map(d => (
        <div key={d.month} className="flex-1 flex flex-col items-center gap-0.5">
          <div className="w-full flex flex-col items-center gap-0.5" style={{ height: '120px' }}>
            <div className="w-full flex gap-0.5 items-end h-full">
              <div className="flex-1 bg-primary/80 rounded-t-sm transition-all duration-500" style={{ height: `${(d.revenue / maxVal) * 100}%` }} />
              <div className="flex-1 bg-destructive/40 rounded-t-sm transition-all duration-500" style={{ height: `${(d.expenses / maxVal) * 100}%` }} />
            </div>
          </div>
          <span className="text-[8px] text-muted-foreground font-sans">{d.month}</span>
        </div>
      ))}
    </div>
  );
}

export default function PracticeAnalytics() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [period, setPeriod] = useState('12m');

  const maxRevenue = Math.max(...revenueData.map(d => d.revenue));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold font-sans text-foreground">Practice Analytics</h2>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">Business intelligence for your legal practice</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-secondary/50 rounded-md p-0.5">
            {['3m', '6m', '12m'].map(p => (
              <Button key={p} variant={period === p ? 'default' : 'ghost'} size="sm" className="h-7 text-[10px] px-2.5 font-sans" onClick={() => setPeriod(p)}>
                {p.toUpperCase()}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="h-8 text-xs font-sans gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
        <TabsList className="bg-secondary/50 h-9 p-0.5 w-full justify-start overflow-x-auto">
          {tabs.map(t => (
            <TabsTrigger key={t.key} value={t.key} className="text-[11px] font-sans gap-1 px-2.5 data-[state=active]:bg-background">
              <t.icon className="h-3 w-3" /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <AnimatePresence mode="wait">
        {/* ═══ OVERVIEW ═══ */}
        {activeTab === 'overview' && (
          <motion.div key="overview" {...fadeIn} className="space-y-5">
            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {kpiCards.map(k => (
                <Card key={k.label} className="border-border/50 shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                        <k.icon className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <Badge variant="outline" className={`text-[9px] font-sans ${k.trend === 'up' ? 'text-success border-success/30' : 'text-destructive border-destructive/30'}`}>
                        {k.trend === 'up' ? <ArrowUpRight className="h-2.5 w-2.5 mr-0.5" /> : <ArrowDownRight className="h-2.5 w-2.5 mr-0.5" />}
                        {k.change}
                      </Badge>
                    </div>
                    <p className="text-xl font-bold font-sans text-foreground mt-2">{k.value}</p>
                    <p className="text-[11px] font-semibold font-sans text-foreground/80">{k.label}</p>
                    <p className="text-[10px] text-muted-foreground font-sans mt-0.5">{k.detail}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Revenue Chart + Case Outcomes side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
              <Card className="lg:col-span-3 border-border/50 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold font-sans text-foreground">Revenue vs Expenses</h3>
                    <div className="flex items-center gap-3 text-[9px] font-sans">
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary/80" /> Revenue</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive/40" /> Expenses</span>
                    </div>
                  </div>
                  <MiniBarChart data={revenueData} maxVal={maxRevenue} />
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 border-border/50 shadow-sm">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold font-sans text-foreground mb-3">Case Outcomes</h3>
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative h-28 w-28">
                      <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                        {caseOutcomes.reduce((acc, o, i) => {
                          const offset = acc;
                          const dash = o.pct;
                          return acc + dash;
                        }, 0) && null}
                        {(() => {
                          let offset = 0;
                          return caseOutcomes.map((o, i) => {
                            const colors = ['hsl(var(--success))', 'hsl(var(--destructive))', 'hsl(var(--gold))'];
                            const el = (
                              <circle key={i} cx="18" cy="18" r="15.9" fill="none" strokeWidth="3.5"
                                stroke={colors[i]} strokeDasharray={`${o.pct} ${100 - o.pct}`}
                                strokeDashoffset={-offset} strokeLinecap="round" />
                            );
                            offset += o.pct;
                            return el;
                          });
                        })()}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-lg font-bold font-sans text-foreground">41</p>
                        <p className="text-[8px] text-muted-foreground font-sans">Total Decided</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {caseOutcomes.map(o => (
                      <div key={o.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-2.5 w-2.5 rounded-full ${o.color}`} />
                          <span className="text-xs font-sans text-foreground">{o.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-sans text-foreground">{o.value}</span>
                          <span className="text-[10px] text-muted-foreground font-sans">({o.pct}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* ═══ CASES & COURTS ═══ */}
        {activeTab === 'cases' && (
          <motion.div key="cases" {...fadeIn} className="space-y-5">
            {/* Win Rate by Case Type */}
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold font-sans text-foreground mb-3">Win Rate by Practice Area</h3>
                <div className="space-y-3">
                  {winRateByType.map(w => (
                    <div key={w.type}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-sans text-foreground">{w.type}</span>
                        <span className="text-xs font-bold font-sans text-foreground">{w.rate} <span className="text-muted-foreground font-normal">({w.won}/{w.total})</span></span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-success rounded-full transition-all duration-700" style={{ width: w.rate }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Court Analytics */}
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold font-sans text-foreground mb-3">Court Analytics</h3>
                <div className="space-y-2">
                  {courtAnalytics.map(c => (
                    <div key={c.court} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                      <div className={`h-2 w-2 rounded-full ${c.color} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold font-sans text-foreground truncate">{c.court}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground font-sans">
                          <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3" /> {c.hearings} hearings</span>
                          <span className="flex items-center gap-0.5"><Briefcase className="h-3 w-3" /> {c.cases} cases</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold font-sans text-foreground">{c.winRate}</p>
                        <p className="text-[9px] text-muted-foreground font-sans">win rate</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Case Status Pipeline */}
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold font-sans text-foreground mb-3">Case Pipeline</h3>
                <div className="flex items-center gap-1">
                  {[
                    { stage: 'Filed', count: 6, color: 'bg-primary/20 text-primary' },
                    { stage: 'Heard', count: 14, color: 'bg-gold/20 text-gold' },
                    { stage: 'Reserved', count: 8, color: 'bg-warning/20 text-warning' },
                    { stage: 'Decided', count: 4, color: 'bg-success/20 text-success' },
                    { stage: 'Appeal', count: 2, color: 'bg-destructive/20 text-destructive' },
                  ].map((s, i, arr) => (
                    <div key={s.stage} className="flex items-center gap-1 flex-1">
                      <div className={`flex-1 rounded-lg p-3 text-center ${s.color}`}>
                        <p className="text-lg font-bold font-sans">{s.count}</p>
                        <p className="text-[9px] font-sans font-medium">{s.stage}</p>
                      </div>
                      {i < arr.length - 1 && <span className="text-muted-foreground/40 text-xs">›</span>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ═══ REVENUE ═══ */}
        {activeTab === 'revenue' && (
          <motion.div key="revenue" {...fadeIn} className="space-y-5">
            {/* Revenue Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Yearly Revenue', value: '₨ 48.5M', sub: 'FY 2024-25' },
                { label: 'Avg Fee / Case', value: '₨ 1.4M', sub: 'Across 34 cases' },
                { label: 'Collection Efficiency', value: '82%', sub: '₨ 39.8M collected' },
                { label: 'Outstanding', value: '₨ 8.7M', sub: '12 pending invoices' },
              ].map(s => (
                <Card key={s.label} className="border-border/50 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <p className="text-lg font-bold font-sans text-foreground">{s.value}</p>
                    <p className="text-[11px] font-semibold font-sans text-foreground/80">{s.label}</p>
                    <p className="text-[9px] text-muted-foreground font-sans mt-0.5">{s.sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Monthly Revenue Chart */}
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold font-sans text-foreground">Monthly Revenue Trend</h3>
                  <div className="flex items-center gap-3 text-[9px] font-sans">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary/80" /> Revenue</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive/40" /> Expenses</span>
                  </div>
                </div>
                <MiniBarChart data={revenueData} maxVal={maxRevenue} />
              </CardContent>
            </Card>

            {/* Top Paying Clients */}
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold font-sans text-foreground mb-3">Top Paying Clients</h3>
                <div className="space-y-2">
                  {clientInsights.slice(0, 4).map((c, i) => (
                    <div key={c.name} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30">
                      <div className="flex items-center gap-2.5">
                        <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold font-sans text-primary">{i + 1}</span>
                        <div>
                          <p className="text-xs font-semibold font-sans text-foreground">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground font-sans">{c.cases} cases</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold font-sans text-foreground">{c.totalBilled}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ═══ CLIENT INSIGHTS ═══ */}
        {activeTab === 'clients' && (
          <motion.div key="clients" {...fadeIn} className="space-y-5">
            {/* Client KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Total Clients', value: '42', icon: Users, change: '+7 this quarter' },
                { label: 'Retention Rate', value: '89%', icon: Repeat, change: 'Returning clients' },
                { label: 'New This Month', value: '7', icon: UserPlus, change: '5 referrals' },
                { label: 'Avg. Lifetime Value', value: '₨ 2.1M', icon: DollarSign, change: 'Per client' },
              ].map(s => (
                <Card key={s.label} className="border-border/50 shadow-sm">
                  <CardContent className="p-4">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                      <s.icon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-lg font-bold font-sans text-foreground">{s.value}</p>
                    <p className="text-[11px] font-semibold font-sans text-foreground/80">{s.label}</p>
                    <p className="text-[9px] text-muted-foreground font-sans">{s.change}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Client List */}
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold font-sans text-foreground mb-3">Client Portfolio</h3>
                <div className="space-y-2">
                  {clientInsights.map(c => (
                    <div key={c.name} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold font-sans text-primary">
                          {c.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-semibold font-sans text-foreground">{c.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-sans">
                            <span>{c.cases} cases</span>
                            <span>·</span>
                            <span>{c.retention} relationship</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold font-sans text-foreground">{c.totalBilled}</p>
                        <Badge variant="outline" className={`text-[9px] font-sans ${c.status === 'New' ? 'text-gold border-gold/30' : 'text-success border-success/30'}`}>
                          {c.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Referral Sources */}
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold font-sans text-foreground mb-3">Client Acquisition Sources</h3>
                <div className="space-y-2.5">
                  {[
                    { source: 'Client Referrals', count: 22, pct: 52 },
                    { source: 'Bar Association', count: 8, pct: 19 },
                    { source: 'Online / WukalaGPT', count: 7, pct: 17 },
                    { source: 'Walk-in', count: 5, pct: 12 },
                  ].map(s => (
                    <div key={s.source}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-sans text-foreground">{s.source}</span>
                        <span className="text-[10px] font-sans text-muted-foreground">{s.count} clients ({s.pct}%)</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${s.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ═══ WORKLOAD HEATMAP ═══ */}
        {activeTab === 'workload' && (
          <motion.div key="workload" {...fadeIn} className="space-y-5">
            {/* Heatmap */}
            <Card className="border-border/50 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold font-sans text-foreground">Workload Heatmap — Last 12 Weeks</h3>
                  <div className="flex items-center gap-1 text-[8px] text-muted-foreground font-sans">
                    <span>Less</span>
                    {heatColors.map((c, i) => <div key={i} className={`h-3 w-3 rounded-sm ${c}`} />)}
                    <span>More</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <div className="flex flex-col gap-1 mr-1">
                    {dayLabels.map(d => <span key={d} className="text-[8px] text-muted-foreground font-sans h-4 flex items-center">{d}</span>)}
                  </div>
                  {heatmapData.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-1 flex-1">
                      {week.map((intensity, di) => (
                        <div key={di} className={`h-4 rounded-sm ${heatColors[intensity]} transition-colors`} title={`Week ${wi + 1}, ${dayLabels[di]}: ${intensity} hearings`} />
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Busiest Days */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold font-sans text-foreground mb-3">Busiest Days</h3>
                  <div className="space-y-2">
                    {[
                      { day: 'Thursday', avg: 4.2, hearings: 50 },
                      { day: 'Wednesday', avg: 3.8, hearings: 46 },
                      { day: 'Tuesday', avg: 3.1, hearings: 37 },
                      { day: 'Monday', avg: 2.5, hearings: 30 },
                      { day: 'Friday', avg: 2.0, hearings: 24 },
                    ].map(d => (
                      <div key={d.day} className="flex items-center gap-3">
                        <span className="text-xs font-sans text-foreground w-24">{d.day}</span>
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full bg-gold rounded-full" style={{ width: `${(d.avg / 4.2) * 100}%` }} />
                        </div>
                        <span className="text-[10px] font-sans text-muted-foreground w-20 text-right">{d.avg} avg/wk</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold font-sans text-foreground mb-3">Capacity Planning</h3>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                      <p className="text-xs font-semibold font-sans text-success">Available Capacity</p>
                      <p className="text-[10px] text-muted-foreground font-sans mt-0.5">You have ~6 hours free this week for new consultations</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gold/10 border border-gold/20">
                      <p className="text-xs font-semibold font-sans text-gold">Peak Month Alert</p>
                      <p className="text-[10px] text-muted-foreground font-sans mt-0.5">March-April historically busiest — consider delegating to juniors</p>
                    </div>
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="text-xs font-semibold font-sans text-primary">Weekly Avg.</p>
                      <p className="text-[10px] text-muted-foreground font-sans mt-0.5">15.6 hearings/week · 3.1 per day average</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
