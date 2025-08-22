import { Campus, LeaderboardUser, ProfileStats, Achievement } from '../types';

export const mockCampuses: Campus[] = [
  {
    id: '1',
    name: 'Stanford University',
    country: 'USA',
    position: { x: 15, y: 45 },
    hoursToday: 234,
    weeklyTotal: 1456,
    activeUsers: 42,
    topStudents: ['Sarah Chen', 'Mike Johnson', 'Lisa Park']
  },
  {
    id: '2',
    name: 'MIT',
    country: 'USA',
    position: { x: 22, y: 38 },
    hoursToday: 189,
    weeklyTotal: 1234,
    activeUsers: 38,
    topStudents: ['Alex Kumar', 'Emma Wilson', 'David Lee']
  },
  {
    id: '3',
    name: 'University of Oxford',
    country: 'UK',
    position: { x: 48, y: 32 },
    hoursToday: 156,
    weeklyTotal: 987,
    activeUsers: 29,
    topStudents: ['James Smith', 'Sophie Brown', 'Tom Davis']
  },
  {
    id: '4',
    name: 'Tokyo University',
    country: 'Japan',
    position: { x: 78, y: 42 },
    hoursToday: 298,
    weeklyTotal: 1789,
    activeUsers: 56,
    topStudents: ['Yuki Tanaka', 'Hana Sato', 'Kenji Yamamoto']
  },
  {
    id: '5',
    name: 'ETH Zurich',
    country: 'Switzerland',
    position: { x: 52, y: 28 },
    hoursToday: 145,
    weeklyTotal: 876,
    activeUsers: 31,
    topStudents: ['Anna Müller', 'Marco Rossi', 'Pierre Dubois']
  },
  {
    id: '6',
    name: 'University of Sydney',
    country: 'Australia',
    position: { x: 85, y: 75 },
    hoursToday: 178,
    weeklyTotal: 1123,
    activeUsers: 33,
    topStudents: ['Jack Williams', 'Olivia Taylor', 'Liam Anderson']
  }
];

export const mockCurrentUser: LeaderboardUser = {
  id: 'current',
  name: 'John Doe',
  school: 'Stanford University',
  avatar: '👨‍💻',
  hoursStudied: 32.5,
  rank: 4,
  isCurrentUser: true
};

export const mockProfileStats: ProfileStats = {
  totalHours: 245.5,
  currentStreak: 7,
  longestStreak: 15,
  level: 12,
  xp: 2450,
  xpToNext: 550,
  tasksCompleted: 89,
  averageSession: 35
};

export const mockAchievements: Achievement[] = [
  {
    id: '1',
    name: 'Early Bird',
    description: 'Start 10 sessions before 8 AM',
    icon: '🌅',
    unlocked: true
  },
  {
    id: '2',
    name: 'Night Owl',
    description: 'Study past midnight 5 times',
    icon: '🦉',
    unlocked: true
  },
  {
    id: '3',
    name: 'Marathoner',
    description: 'Complete a 4+ hour study session',
    icon: '🏃‍♂️',
    unlocked: false,
    progress: 2,
    maxProgress: 4
  },
  {
    id: '4',
    name: 'Streak Master',
    description: 'Maintain a 30-day streak',
    icon: '🔥',
    unlocked: false,
    progress: 7,
    maxProgress: 30
  },
  {
    id: '5',
    name: 'Focus Champion',
    description: 'Complete 100 Pomodoro sessions',
    icon: '🏆',
    unlocked: false,
    progress: 45,
    maxProgress: 100
  },
  {
    id: '6',
    name: 'Team Player',
    description: 'Study with friends 20 times',
    icon: '🤝',
    unlocked: true
  }
];

export const mockSubjectBreakdown = [
  { subject: 'Computer Science', hours: 89.2, color: '#3B82F6' },
  { subject: 'Mathematics', hours: 67.3, color: '#10B981' },
  { subject: 'Physics', hours: 45.8, color: '#F59E0B' },
  { subject: 'Literature', hours: 28.4, color: '#EF4444' },
  { subject: 'History', hours: 14.8, color: '#8B5CF6' }
];