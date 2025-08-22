import React from 'react';
import { Home, Map, Trophy, User } from 'lucide-react';

interface BottomNavigationProps {
  currentScreen: string;
  onScreenChange: (screen: string) => void;
  isDarkMode: boolean;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentScreen, onScreenChange, isDarkMode }) => {
  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Focus' },
    { id: 'map', icon: Map, label: 'Campus' },
    { id: 'leaderboard', icon: Trophy, label: 'Rankings' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className={`${
      isDarkMode 
        ? 'bg-white/10 border-white/20' 
        : 'bg-white/80 border-gray-200/50'
    } backdrop-blur-lg border-t px-4 py-2`}>
      <div className="flex justify-around items-center">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => onScreenChange(id)}
            className={`flex flex-col items-center space-y-1 py-2 px-3 rounded-xl transition-all duration-300 ${
              currentScreen === id
                ? isDarkMode 
                  ? 'text-blue-400 bg-blue-500/20' 
                  : 'text-blue-600 bg-blue-100/80'
                : isDarkMode 
                  ? 'text-white/70 hover:text-white hover:bg-white/10' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
            }`}
          >
            <Icon size={20} />
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};