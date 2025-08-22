import React from 'react';
import { BottomNavigation } from './BottomNavigation';

interface LayoutProps {
  children: React.ReactNode;
  currentScreen: string;
  onScreenChange: (screen: string) => void;
  isDarkMode: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentScreen, onScreenChange, isDarkMode }) => {
  return (
    <div className={`min-h-screen flex flex-col ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-black' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
      <BottomNavigation currentScreen={currentScreen} onScreenChange={onScreenChange} isDarkMode={isDarkMode} />
    </div>
  );
};