import React, { useState } from 'react';
import { Layout } from './components/Layout';
import Dashboard from './components/Dashboard';
import { MapScreen } from './components/MapScreen';
import { Leaderboard } from './components/Leaderboard';
import { Profile } from './components/Profile';
import { useLocalStorage } from './hooks/useLocalStorage';
import { 
  mockCampuses, 
  mockCurrentUser, 
  mockProfileStats, 
  mockAchievements, 
  mockSubjectBreakdown 
} from './data/mockData';
import { DailyStats, Campus } from './types';

function App() {
  const [currentScreen, setCurrentScreen] = useState<string>('dashboard');
  const [streakCount, setStreakCount] = useLocalStorage('streakCount', 7);
  const [isDarkMode, setIsDarkMode] = useLocalStorage('isDarkMode', true);
  const [dailyStats, setDailyStats] = useLocalStorage<DailyStats>('dailyStats', {
    hoursStudied: 3.2,
    pomodorosCompleted: 6,
    tasksCompleted: 4
  });

  const handleStartSession = (task: string, duration: number) => {
    // Update daily stats when a session starts
    setDailyStats(prev => ({
      ...prev,
      pomodorosCompleted: prev.pomodorosCompleted + 1,
      hoursStudied: prev.hoursStudied + (duration / 60)
    }));
  };

  const handleCampusSelect = (campus: Campus) => {
    // Handle campus selection - could show modal or navigate to campus detail
    console.log('Selected campus:', campus.name);
  };

  const handleToggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
        return (
          <Dashboard
            streak={streakCount}
            todayHours={dailyStats.hoursStudied}
            yesterdayHours={0}
            totalPomodoros={dailyStats.pomodorosCompleted}
            onStartSession={handleStartSession}
            isDarkMode={isDarkMode}
            onToggleTheme={handleToggleTheme}
          />
        );
      case 'map':
        return (
          <MapScreen
            campuses={mockCampuses}
            onCampusSelect={handleCampusSelect}
          />
        );
      case 'leaderboard':
        return (
          <Leaderboard
            currentUser={mockCurrentUser}
          />
        );
      case 'profile':
        return (
          <Profile
            stats={mockProfileStats}
            achievements={mockAchievements}
            subjectBreakdown={mockSubjectBreakdown}
          />
        );
      default:
        return (
          <Dashboard
            streak={streakCount}
            todayHours={dailyStats.hoursStudied}
            yesterdayHours={0}
            totalPomodoros={dailyStats.pomodorosCompleted}
            onStartSession={handleStartSession}
          />
        );
    }
  };

  return (
    <Layout currentScreen={currentScreen} onScreenChange={setCurrentScreen} isDarkMode={isDarkMode}>
      {renderCurrentScreen()}
    </Layout>
  );
}

export default App;