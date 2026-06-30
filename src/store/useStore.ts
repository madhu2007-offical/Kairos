import { create } from 'zustand';

const API_BASE = 'http://localhost:5000/api';

export interface UserSettings {
  id: string;
  email: string;
  name: string;
  autonomyLevel: 'SUGGEST_ONLY' | 'DRAFT_AND_CONFIRM' | 'FULL_AUTONOMY';
  peakFocusStart: number;
  peakFocusEnd: number;
  quietHourStart: number;
  quietHourEnd: number;
  calendarConnected: boolean;
  procrastinationIndex: number;
}

export interface Task {
  id: string;
  title: string;
  duration: number;
  deadline: string;
  urgency: number;
  importance: number;
  effort: number;
  priorityScore: number;
  opportunityCost: number;
  explanation: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED';
  context: 'WORK' | 'PERSONAL' | 'RECREATIONAL';
  createdAt: string;
}

export interface ScheduleBlock {
  id: string;
  taskId?: string;
  title: string;
  start: string;
  end: string;
  type: 'FOCUS' | 'MEETING' | 'BUFFER' | 'BREAK';
  isLocked: boolean;
}

export interface Milestone {
  title: string;
  duration: number;
  daysOffset: number;
  completed?: boolean;
}

export interface Goal {
  id: string;
  title: string;
  targetDate: string;
  status: 'ACTIVE' | 'COMPLETED';
  milestones: Milestone[];
  createdAt: string;
}

export interface Habit {
  id: string;
  name: string;
  frequency: 'DAILY' | 'WEEKLY';
  streak: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  lastCompletedDate?: string;
  history: string[];
}

export interface AutonomousAction {
  id: string;
  type: 'EMAIL_DRAFT' | 'CALENDAR_HOLD' | 'CHECKLIST_PREP';
  title: string;
  state: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'UNDONE';
  details: {
    recipient?: string;
    subject?: string;
    body?: string;
    start?: string;
    end?: string;
    description?: string;
    createdBlockId?: string;
  };
  explanation: string;
  createdAt: string;
}

export interface NotificationNudge {
  id: string;
  taskId?: string;
  type: 'GENTLE' | 'WARNING' | 'AUTONOMOUS_DRAFT' | 'REPLAN_SUGGESTION';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface KairosState {
  user: UserSettings | null;
  tasks: Task[];
  schedule: ScheduleBlock[];
  goals: Goal[];
  habits: Habit[];
  actions: AutonomousAction[];
  notifications: NotificationNudge[];
  replanLog: string;
  loading: boolean;
  onboardingCompleted: boolean;
  
  // Actions
  setOnboardingCompleted: (val: boolean) => void;
  fetchUser: () => Promise<void>;
  updateUser: (data: Partial<UserSettings>) => Promise<void>;
  fetchTasks: () => Promise<void>;
  addTask: (params: { title?: string; duration?: number; deadline?: string; context?: string; isNlp?: boolean; input?: string }) => Promise<void>;
  updateTaskStatus: (id: string, status: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  reCalculatePriorities: () => Promise<void>;
  
  fetchSchedule: () => Promise<void>;
  replanSchedule: () => Promise<string>;
  updateScheduleBlock: (id: string, start: string, end: string, isLocked?: boolean) => Promise<void>;
  deleteScheduleBlock: (id: string) => Promise<void>;
  
  fetchGoals: () => Promise<void>;
  addGoal: (title: string, targetDate: string) => Promise<void>;
  fetchHabits: () => Promise<void>;
  addHabit: (name: string, frequency: string, difficulty: string) => Promise<void>;
  completeHabit: (id: string) => Promise<void>;
  
  fetchActions: () => Promise<void>;
  approveAction: (id: string) => Promise<void>;
  rejectAction: (id: string) => Promise<void>;
  undoAction: (id: string) => Promise<void>;
  
  fetchNotifications: () => Promise<void>;
  readNotification: (id: string) => Promise<void>;
  clearNotifications: () => Promise<void>;
  simulateTrigger: (trigger: 'LAPTOP_OPEN' | 'CALENDAR_CONFLICT' | 'LOCATION_CHANGE') => Promise<void>;
  fetchBriefing: () => Promise<string>;
}

export const useStore = create<KairosState>((set, get) => ({
  user: null,
  tasks: [],
  schedule: [],
  goals: [],
  habits: [],
  actions: [],
  notifications: [],
  replanLog: '',
  loading: false,
  onboardingCompleted: localStorage.getItem('kairos_onboarding_done') === 'true',

  setOnboardingCompleted: (val) => {
    localStorage.setItem('kairos_onboarding_done', String(val));
    set({ onboardingCompleted: val });
  },

  fetchUser: async () => {
    try {
      const res = await fetch(`${API_BASE}/user`);
      const data = await res.json();
      set({ user: data });
    } catch (e) {
      console.error('fetchUser error', e);
    }
  },

  updateUser: async (data) => {
    try {
      const res = await fetch(`${API_BASE}/user`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const updated = await res.json();
      set({ user: updated });
    } catch (e) {
      console.error('updateUser error', e);
    }
  },

  fetchTasks: async () => {
    set({ loading: true });
    try {
      const res = await fetch(`${API_BASE}/tasks`);
      const data = await res.json();
      set({ tasks: data, loading: false });
    } catch (e) {
      console.error('fetchTasks error', e);
      set({ loading: false });
    }
  },

  addTask: async (params) => {
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      await res.json();
      await get().fetchTasks();
      await get().fetchNotifications();
      await get().fetchActions();
    } catch (e) {
      console.error('addTask error', e);
    }
  },

  updateTaskStatus: async (id, status) => {
    try {
      await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await get().fetchTasks();
      await get().fetchSchedule(); // Status changes like COMPLETED delete schedule blocks
    } catch (e) {
      console.error('updateTaskStatus error', e);
    }
  },

  deleteTask: async (id) => {
    try {
      await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
      await get().fetchTasks();
      await get().fetchSchedule();
    } catch (e) {
      console.error('deleteTask error', e);
    }
  },

  reCalculatePriorities: async () => {
    try {
      await fetch(`${API_BASE}/tasks/re-prioritize`, { method: 'POST' });
      await get().fetchTasks();
    } catch (e) {
      console.error('reCalculatePriorities error', e);
    }
  },

  fetchSchedule: async () => {
    try {
      const res = await fetch(`${API_BASE}/schedule`);
      const data = await res.json();
      set({ schedule: data });
    } catch (e) {
      console.error('fetchSchedule error', e);
    }
  },

  replanSchedule: async () => {
    try {
      const res = await fetch(`${API_BASE}/schedule/replan`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        set({ schedule: data.blocks, replanLog: data.explanation });
        return data.explanation;
      }
      return 'Scheduling failed.';
    } catch (e) {
      console.error('replanSchedule error', e);
      return 'Failed to reach server.';
    }
  },

  updateScheduleBlock: async (id, start, end, isLocked = true) => {
    try {
      await fetch(`${API_BASE}/schedule/block/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start, end, isLocked }),
      });
      await get().fetchSchedule();
    } catch (e) {
      console.error('updateScheduleBlock error', e);
    }
  },

  deleteScheduleBlock: async (id) => {
    try {
      await fetch(`${API_BASE}/schedule/block/${id}`, { method: 'DELETE' });
      await get().fetchSchedule();
    } catch (e) {
      console.error('deleteScheduleBlock error', e);
    }
  },

  fetchGoals: async () => {
    try {
      const res = await fetch(`${API_BASE}/goals`);
      const data = await res.json();
      set({ goals: data });
    } catch (e) {
      console.error('fetchGoals error', e);
    }
  },

  addGoal: async (title, targetDate) => {
    try {
      await fetch(`${API_BASE}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, targetDate }),
      });
      await get().fetchGoals();
    } catch (e) {
      console.error('addGoal error', e);
    }
  },

  fetchHabits: async () => {
    try {
      const res = await fetch(`${API_BASE}/habits`);
      const data = await res.json();
      set({ habits: data });
    } catch (e) {
      console.error('fetchHabits error', e);
    }
  },

  addHabit: async (name, frequency, difficulty) => {
    try {
      await fetch(`${API_BASE}/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, frequency, difficulty }),
      });
      await get().fetchHabits();
    } catch (e) {
      console.error('addHabit error', e);
    }
  },

  completeHabit: async (id) => {
    try {
      await fetch(`${API_BASE}/habits/${id}/complete`, { method: 'POST' });
      await get().fetchHabits();
    } catch (e) {
      console.error('completeHabit error', e);
    }
  },

  fetchActions: async () => {
    try {
      const res = await fetch(`${API_BASE}/actions`);
      const data = await res.json();
      set({ actions: data });
    } catch (e) {
      console.error('fetchActions error', e);
    }
  },

  approveAction: async (id) => {
    try {
      await fetch(`${API_BASE}/actions/${id}/approve`, { method: 'POST' });
      await get().fetchActions();
      await get().fetchSchedule();
    } catch (e) {
      console.error('approveAction error', e);
    }
  },

  rejectAction: async (id) => {
    try {
      await fetch(`${API_BASE}/actions/${id}/reject`, { method: 'POST' });
      await get().fetchActions();
    } catch (e) {
      console.error('rejectAction error', e);
    }
  },

  undoAction: async (id) => {
    try {
      await fetch(`${API_BASE}/actions/${id}/undo`, { method: 'POST' });
      await get().fetchActions();
      await get().fetchSchedule();
    } catch (e) {
      console.error('undoAction error', e);
    }
  },

  fetchNotifications: async () => {
    try {
      const res = await fetch(`${API_BASE}/notifications`);
      const data = await res.json();
      set({ notifications: data });
    } catch (e) {
      console.error('fetchNotifications error', e);
    }
  },

  readNotification: async (id) => {
    try {
      await fetch(`${API_BASE}/notifications/read/${id}`, { method: 'POST' });
      // update locally to make it instant
      set(state => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n)
      }));
    } catch (e) {
      console.error('readNotification error', e);
    }
  },

  clearNotifications: async () => {
    try {
      await fetch(`${API_BASE}/notifications/clear`, { method: 'POST' });
      set({ notifications: [] });
    } catch (e) {
      console.error('clearNotifications error', e);
    }
  },

  simulateTrigger: async (trigger) => {
    try {
      await fetch(`${API_BASE}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger }),
      });
      await get().fetchNotifications();
      await get().fetchSchedule();
      await get().fetchTasks();
    } catch (e) {
      console.error('simulateTrigger error', e);
    }
  },

  fetchBriefing: async () => {
    try {
      const res = await fetch(`${API_BASE}/briefing`);
      const data = await res.json();
      return data.briefing;
    } catch (e) {
      console.error('fetchBriefing error', e);
      return 'Briefing unavailable at this time.';
    }
  }
}));
