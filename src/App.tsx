import React, { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import LandingPage from './components/LandingPage';
import Onboarding from './components/Onboarding';
import PriorityMatrix from './components/PriorityMatrix';
import ScheduleCalendar from './components/ScheduleCalendar';
import GoalHabitTracker from './components/GoalHabitTracker';
import AutonomousActionLog from './components/AutonomousActionLog';
import VoiceBriefing from './components/VoiceBriefing';
import TrustControl from './components/TrustControl';
import { 
  Compass, 
  Layers, 
  Calendar, 
  Target, 
  ShieldCheck, 
  Mic, 
  Settings, 
  LogOut, 
  Bell, 
  Sparkles, 
  CheckCircle2, 
  Flame, 
  ChevronRight 
} from 'lucide-react';

export default function App() {
  const onboardingCompleted = useStore((state) => state.onboardingCompleted);
  const setOnboardingCompleted = useStore((state) => state.setOnboardingCompleted);
  
  const user = useStore((state) => state.user);
  const tasks = useStore((state) => state.tasks);
  const schedule = useStore((state) => state.schedule);
  const habits = useStore((state) => state.habits);
  const actions = useStore((state) => state.actions);
  const notifications = useStore((state) => state.notifications);

  const fetchUser = useStore((state) => state.fetchUser);
  const fetchTasks = useStore((state) => state.fetchTasks);
  const fetchSchedule = useStore((state) => state.fetchSchedule);
  const fetchGoals = useStore((state) => state.fetchGoals);
  const fetchHabits = useStore((state) => state.fetchHabits);
  const fetchActions = useStore((state) => state.fetchActions);
  const fetchNotifications = useStore((state) => state.fetchNotifications);
  const readNotification = useStore((state) => state.readNotification);

  const [landingMode, setLandingMode] = useState(true);
  const [activeTab, setActiveTab] = useState<'backlog' | 'timeline' | 'milestones' | 'actions' | 'speech' | 'settings'>('backlog');
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);

  // Sync data on startup
  useEffect(() => {
    if (onboardingCompleted) {
      setLandingMode(false);
      fetchUser();
      fetchTasks();
      fetchSchedule();
      fetchGoals();
      fetchHabits();
      fetchActions();
      fetchNotifications();

      // Poll notifications every 8 seconds for real-time nudges simulation
      const interval = setInterval(() => {
        fetchNotifications();
        fetchTasks();
        fetchSchedule();
        fetchActions();
      }, 8000);

      return () => clearInterval(interval);
    }
  }, [onboardingCompleted]);

  // Statistics calculations
  const pendingTasksCount = tasks.filter(t => t.status !== 'COMPLETED').length;
  const pendingActionsCount = actions.filter(a => a.state === 'PENDING').length;
  const bestHabitStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  if (landingMode && !onboardingCompleted) {
    return <LandingPage onStartOnboarding={() => setLandingMode(false)} />;
  }

  if (!onboardingCompleted) {
    return <Onboarding onComplete={() => setLandingMode(false)} />;
  }

  const handleSignOut = () => {
    setOnboardingCompleted(false);
    setLandingMode(true);
    // Clear localStorage
    localStorage.removeItem('kairos_onboarding_done');
  };

  return (
    <div className="min-h-screen bg-darkslate-950 text-linen-100 flex flex-col md:flex-row relative">
      {/* Background blurs */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sage-600/5 rounded-full filter blur-3xl pointer-events-none z-0"></div>
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-darkslate-950 border-r border-white/5 flex flex-col justify-between shrink-0 z-10">
        <div className="flex flex-col gap-8 px-6 py-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sage-600 to-sage-400 flex items-center justify-center text-linen-50 shadow-md shadow-sage-950/40">
              <span className="font-serif font-bold text-lg tracking-tight">K</span>
            </div>
            <span className="font-serif text-xl font-semibold tracking-wide text-linen-50">kairos</span>
          </div>

          {/* Tab lists */}
          <nav className="flex flex-col gap-1.5">
            <button
              onClick={() => setActiveTab('backlog')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'backlog'
                  ? 'bg-sage-950 border border-sage-500/20 text-sage-300 shadow-md shadow-sage-950/40'
                  : 'text-linen-400 hover:text-linen-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Layers className="h-4 w-4" />
              <span>Priority Backlog</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'timeline'
                  ? 'bg-sage-950 border border-sage-500/20 text-sage-300 shadow-md shadow-sage-950/40'
                  : 'text-linen-400 hover:text-linen-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span>Adaptive Timeline</span>
            </button>

            <button
              onClick={() => setActiveTab('milestones')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'milestones'
                  ? 'bg-sage-950 border border-sage-500/20 text-sage-300 shadow-md shadow-sage-950/40'
                  : 'text-linen-400 hover:text-linen-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Target className="h-4 w-4" />
              <span>Goals & Habits</span>
            </button>

            <button
              onClick={() => setActiveTab('actions')}
              className={`flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'actions'
                  ? 'bg-sage-950 border border-sage-500/20 text-sage-300 shadow-md shadow-sage-950/40'
                  : 'text-linen-400 hover:text-linen-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4" />
                <span>Staged Actions</span>
              </div>
              {pendingActionsCount > 0 && (
                <span className="h-5 px-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] font-bold text-amber-400 flex items-center justify-center">
                  {pendingActionsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('speech')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'speech'
                  ? 'bg-sage-950 border border-sage-500/20 text-sage-300 shadow-md shadow-sage-950/40'
                  : 'text-linen-400 hover:text-linen-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Mic className="h-4 w-4" />
              <span>Speech Center</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeTab === 'settings'
                  ? 'bg-sage-950 border border-sage-500/20 text-sage-300 shadow-md shadow-sage-950/40'
                  : 'text-linen-400 hover:text-linen-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Trust Settings</span>
            </button>
          </nav>
        </div>

        {/* User Card */}
        <div className="px-6 py-6 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8.5 w-8.5 rounded-full bg-sage-900 border border-sage-500/20 flex items-center justify-center font-bold text-xs text-sage-300 uppercase tracking-wider shrink-0">
              {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-linen-100 block truncate leading-tight">
                {user?.name || 'Loading Name...'}
              </span>
              <span className="text-[10px] text-linen-500 block truncate">
                {user?.email || 'user@kairos.ai'}
              </span>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded hover:bg-red-950/20 text-linen-500 hover:text-red-400 transition-colors"
            title="Reset App Session"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0 z-10">
        {/* Header bar */}
        <header className="px-6 md:px-10 py-5 border-b border-white/5 flex items-center justify-between shrink-0">
          {/* Quick status bar */}
          <div className="flex gap-6 text-[11px] text-linen-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4.5 w-4.5 text-sage-400" />
              <span>{pendingTasksCount} priorities pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Flame className="h-4.5 w-4.5 text-amber-500 fill-amber-500/10" />
              <span>{bestHabitStreak} day streak</span>
            </div>
          </div>

          {/* Right utility items */}
          <div className="flex items-center gap-4 relative">
            {/* Notification trigger button */}
            <button
              onClick={() => setShowNotificationDrawer(!showNotificationDrawer)}
              className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 text-linen-200 relative"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 bg-red-500 border-2 border-darkslate-950 rounded-full animate-pulse"></span>
              )}
            </button>

            {/* Notification dropdown drawer */}
            {showNotificationDrawer && (
              <div className="absolute right-0 top-12 w-80 glass-panel rounded-2xl border border-white/10 p-4 shadow-xl z-50 space-y-3 max-h-[350px] overflow-y-auto">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-xs font-semibold text-linen-100 uppercase tracking-wide">Sync Alerts</span>
                  <span className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-linen-400">
                    {notifications.length} alerts
                  </span>
                </div>

                <div className="space-y-2">
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => readNotification(n.id)}
                        className={`p-2.5 rounded-lg text-[10px] leading-relaxed transition-colors cursor-pointer border ${
                          n.isRead 
                            ? 'bg-black/10 border-white/5 text-linen-500' 
                            : 'bg-sage-950/20 border-sage-500/20 text-linen-200 hover:border-sage-500/35'
                        }`}
                      >
                        <span className="font-semibold block">{n.title}</span>
                        <p className="font-light mt-0.5">{n.message}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-[10px] text-linen-600 py-6 italic">No notifications generated.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Tab display */}
        <main className="flex-grow p-6 md:p-10 overflow-y-auto">
          {activeTab === 'backlog' && <PriorityMatrix />}
          {activeTab === 'timeline' && <ScheduleCalendar />}
          {activeTab === 'milestones' && <GoalHabitTracker />}
          {activeTab === 'actions' && <AutonomousActionLog />}
          {activeTab === 'speech' && <VoiceBriefing />}
          {activeTab === 'settings' && <TrustControl />}
        </main>
      </div>
    </div>
  );
}
