import React, { useState } from 'react';
import { Crown, Medal, Award, TrendingUp, LogOut } from 'lucide-react';

interface LeaderboardUser {
  id: string;
  name: string;
  school: string;
  avatar: string;
  hoursStudied: number;
  rank: number;
  badge?: string;
  isCurrentUser?: boolean;
}

interface LeaderboardProps {
  currentUser: LeaderboardUser;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'university' | 'global'>('friends');

  const mockData = {
    friends: [
      { id: '1', name: 'Sarah Chen', school: 'Stanford', avatar: '👩‍💻', hoursStudied: 42.5, rank: 1, badge: 'crown' },
      { id: '2', name: 'Alex Kumar', school: 'MIT', avatar: '👨‍💼', hoursStudied: 38.2, rank: 2, badge: 'medal' },
      { id: '3', name: 'Maya Johnson', school: 'Harvard', avatar: '👩‍🎓', hoursStudied: 35.8, rank: 3, badge: 'award' },
      { ...currentUser, rank: 4 },
      { id: '4', name: 'David Lee', school: 'UC Berkeley', avatar: '👨‍🔬', hoursStudied: 28.3, rank: 5 },
    ],
    university: [
      { id: '5', name: 'Emma Wilson', school: 'Stanford', avatar: '👩‍🎨', hoursStudied: 55.2, rank: 1, badge: 'crown' },
      { id: '6', name: 'Jake Martinez', school: 'Stanford', avatar: '👨‍🎯', hoursStudied: 48.7, rank: 2, badge: 'medal' },
      { ...currentUser, rank: 3, badge: 'award' },
      { id: '7', name: 'Lisa Park', school: 'Stanford', avatar: '👩‍🔬', hoursStudied: 31.5, rank: 4 },
    ],
    global: [
      { id: '8', name: 'Yuki Tanaka', school: 'Tokyo University', avatar: '👨‍💻', hoursStudied: 78.3, rank: 1, badge: 'crown' },
      { id: '9', name: 'Maria Santos', school: 'University of São Paulo', avatar: '👩‍🎓', hoursStudied: 72.1, rank: 2, badge: 'medal' },
      { id: '10', name: 'Ahmed Hassan', school: 'Cairo University', avatar: '👨‍🎓', hoursStudied: 68.9, rank: 3, badge: 'award' },
      { ...currentUser, rank: 147 },
    ]
  };

  const tabs = [
    { id: 'friends', label: 'Friends', icon: '👥' },
    { id: 'university', label: 'University', icon: '🏫' },
    { id: 'global', label: 'Global', icon: '🌍' },
  ] as const;

  const getRankIcon = (rank: number, badge?: string) => {
    if (badge === 'crown' || rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (badge === 'medal' || rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (badge === 'award' || rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
    return <span className="text-white/70 font-bold text-sm">#{rank}</span>;
  };

  const getRankColor = (rank: number, isCurrentUser?: boolean) => {
    if (isCurrentUser) return 'bg-blue-500/20 border-blue-400/50 text-blue-400';
    if (rank === 1) return 'bg-yellow-500/10 border-yellow-400/30';
    if (rank === 2) return 'bg-gray-300/10 border-gray-300/30';
    if (rank === 3) return 'bg-amber-600/10 border-amber-600/30';
    return 'bg-white/5 border-white/10';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
        <h1 className="text-3xl font-bold text-white mb-2">Rankings</h1>
        <p className="text-white/70">Compete with friends and students worldwide</p>
        </div>
        <button
          onClick={() => {
            // TODO: Implement Google logout
            console.log('Logout clicked');
          }}
          className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-3 text-white hover:bg-white/20 transition-all"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/10 backdrop-blur-lg rounded-2xl p-1 mb-8">
        {tabs.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-all duration-300 ${
              activeTab === id
                ? 'bg-white text-gray-900 font-semibold'
                : 'text-white/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="text-lg">{icon}</span>
            <span className="text-sm">{label}</span>
          </button>
        ))}
      </div>

      {/* Podium for Top 3 */}
      <div className="flex justify-center items-end space-x-4 mb-8">
        {mockData[activeTab].slice(0, 3).map((user, index) => {
          const positions = [1, 0, 2]; // Center winner, left second, right third
          const heights = ['h-20', 'h-24', 'h-16'];
          const actualIndex = positions[index];
          
          return (
            <div
              key={user.id}
              className={`flex flex-col items-center ${actualIndex === 1 ? 'order-1' : actualIndex === 0 ? 'order-2' : 'order-3'}`}
            >
              <div className="relative mb-2">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${
                  actualIndex === 1 ? 'from-yellow-400 to-yellow-600' :
                  actualIndex === 0 ? 'from-gray-300 to-gray-500' :
                  'from-amber-600 to-amber-800'
                } flex items-center justify-center text-2xl border-4 border-white/20`}>
                  {user.avatar}
                </div>
                <div className="absolute -top-2 -right-2">
                  {getRankIcon(user.rank, user.badge)}
                </div>
              </div>
              
              <div className={`w-24 ${heights[actualIndex]} bg-gradient-to-t ${
                actualIndex === 1 ? 'from-yellow-500/20 to-yellow-400/10' :
                actualIndex === 0 ? 'from-gray-400/20 to-gray-300/10' :
                'from-amber-600/20 to-amber-500/10'
              } rounded-t-xl flex flex-col justify-end items-center p-3 border-t-2 ${
                actualIndex === 1 ? 'border-yellow-400' :
                actualIndex === 0 ? 'border-gray-300' :
                'border-amber-600'
              }`}>
                <div className="text-white text-xs text-center">
                  <div className="font-semibold">{user.name.split(' ')[0]}</div>
                  <div className="text-white/70">{user.hoursStudied}h</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Rankings List */}
      <div className="space-y-2">
        {mockData[activeTab].map((user) => (
          <div
            key={user.id}
            className={`flex items-center space-x-4 p-4 rounded-2xl border backdrop-blur-lg transition-all duration-300 hover:scale-[1.02] ${getRankColor(user.rank, user.isCurrentUser)}`}
          >
            <div className="flex items-center justify-center w-8">
              {getRankIcon(user.rank, user.badge)}
            </div>
            
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl">
                {user.avatar}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-white font-semibold">{user.name}</span>
                  {user.isCurrentUser && (
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">You</span>
                  )}
                </div>
                <div className="text-white/70 text-sm">{user.school}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-white font-bold">{user.hoursStudied}h</span>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly Reset Notice */}
      <div className="mt-8 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-400/30 rounded-2xl p-4">
        <div className="flex items-center space-x-2 text-purple-300">
          <Award className="w-5 h-5" />
          <span className="font-semibold">Weekly Competition</span>
        </div>
        <p className="text-white/70 text-sm mt-1">
          Rankings reset every Sunday. Keep studying to maintain your position!
        </p>
      </div>
    </div>
  );
};