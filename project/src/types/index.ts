export interface Campus {
  id: string;
  name: string;
  country: string;
  position: { x: number; y: number };
  hoursToday: number;
  weeklyTotal: number;
  activeUsers: number;
  topStudents: string[];
}

export interface LeaderboardUser {
  id: string;
  name: string;
  school: string;
  avatar: string;
  hoursStudied: number;
  rank: number;
  badge?: string;
  isCurrentUser?: boolean;
}

export interface ProfileStats {
  totalHours: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  xp: number;
  xpToNext: number;
  tasksCompleted: number;
  averageSession: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

export interface DailyStats {
  hoursStudied: number;
  pomodorosCompleted: number;
  tasksCompleted: number;
}