import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Briefcase,
  Calendar,
  Users,
  FileText,
  DollarSign,
  Bell,
  BarChart3,
  UsersRound,
  FolderLock,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  Search,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import DashboardOverview from './components/DashboardOverview';
import CaseManagement from './components/CaseManagement';
import HearingCalendar from './components/HearingCalendar';
import ClientCRM from './components/ClientCRM';
import DocumentDrafting from './components/DocumentDrafting';
import FeeBilling from './components/FeeBilling';
import SmartNotifications from './components/SmartNotifications';
import PracticeAnalytics from './components/PracticeAnalytics';
import TeamManagement from './components/TeamManagement';
import DocumentVault from './components/DocumentVault';

const sidebarItems = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'cases', label: 'Case Management', icon: Briefcase },
  { id: 'calendar', label: 'Hearing Calendar', icon: Calendar },
  { id: 'clients', label: 'Client CRM', icon: Users },
  { id: 'documents', label: 'Document Drafting', icon: FileText },
  { id: 'billing', label: 'Fee & Billing', icon: DollarSign },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'analytics', label: 'Practice Analytics', icon: BarChart3 },
  { id: 'team', label: 'Team Management', icon: UsersRound },
  { id: 'vault', label: 'Document Vault', icon: FolderLock },
];

export default function LawyerDashboard() {
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview': return <DashboardOverview onNavigate={setActiveSection} />;
      case 'cases': return <CaseManagement />;
      case 'calendar': return <HearingCalendar />;
      case 'clients': return <ClientCRM />;
      case 'documents': return <DocumentDrafting />;
      case 'billing': return <FeeBilling />;
      case 'notifications': return <SmartNotifications />;
      case 'analytics': return <PracticeAnalytics />;
      case 'team': return <TeamManagement />;
      case 'vault': return <DocumentVault />;
      default: return <DashboardOverview onNavigate={setActiveSection} />;
    }
  };

  const activeItem = sidebarItems.find(i => i.id === activeSection);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out',
          sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
        )}
      >
        {/* Sidebar Header */}
        <div className={cn(
          'flex items-center h-16 border-b border-border px-4',
          sidebarCollapsed ? 'justify-center' : 'justify-between'
        )}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-sm font-semibold font-sans text-foreground leading-none">LawDesk</h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">Practice Suite</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {sidebarItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium font-sans transition-all duration-150 group relative',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon className={cn('h-[18px] w-[18px] shrink-0', isActive && 'drop-shadow-sm')} />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                {isActive && !sidebarCollapsed && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary-foreground/30 rounded-r-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Section */}
        <div className={cn(
          'border-t border-border p-3',
          sidebarCollapsed && 'flex flex-col items-center'
        )}>
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-3 px-2 py-2">
              <Avatar className="h-9 w-9 border-2 border-border">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold font-sans">
                  {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'L'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium font-sans text-foreground truncate">{user?.name || 'Lawyer'}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user?.email || ''}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-[260px] bg-card border-r border-border flex flex-col"
            >
              <div className="flex items-center justify-between h-14 border-b border-border px-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                    <Briefcase className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <h2 className="text-sm font-semibold font-sans text-foreground">LawDesk</h2>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
                {sidebarItems.map((item) => {
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveSection(item.id); setMobileMenuOpen(false); }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium font-sans transition-all duration-150',
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      )}
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
              <div className="border-t border-border p-3">
                <div className="flex items-center gap-3 px-2 py-2">
                  <Avatar className="h-9 w-9 border-2 border-border">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold font-sans">
                      {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'L'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium font-sans truncate">{user?.name || 'Lawyer'}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="h-14 lg:h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-9 w-9"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-base lg:text-lg font-semibold font-sans text-foreground leading-none">
                {activeItem?.label || 'Dashboard'}
              </h1>
              <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center relative">
              <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 h-9 w-56 bg-secondary/50 border-border/50 text-sm font-sans"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 relative"
              onClick={() => setActiveSection('notifications')}
            >
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-destructive rounded-full" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 hidden lg:flex">
              <Settings className="h-[18px] w-[18px]" />
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-secondary/30">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="p-4 lg:p-6"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
