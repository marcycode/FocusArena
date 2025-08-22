import React from 'react';
import { Calendar, Clock, Target, TrendingUp, Award, BookOpen, Star, Zap } from 'lucide-react';

interface ProfileStats {
  totalHours: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  xp: number;
  xpToNext: number;
  tasksCompleted: number;
  averageSession: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

interface ProfileProps {
  stats: ProfileStats;
  achievements: Achievement[];
  subjectBreakdown: { subject: string; hours: number; color: string }[];
}

export const Profile: React.FC<ProfileProps> = ({ stats, achievements, subjectBreakdown }) => {
  const xpProgress = (stats.xp / (stats.xp + stats.xpToNext)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl">
            👨‍💻
          </div>
          <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full">
            {stats.level}
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">John Doe</h1>
          <p className="text-white/70">Stanford University</p>
          <div className="flex items-center space-x-2 mt-1">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 text-sm font-medium">Level {stats.level}</span>
          </div>
        </div>
      </div>

      {/* XP Progress */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Experience Points</h3>
          <span className="text-white/70 text-sm">{stats.xp} / {stats.xp + stats.xpToNext} XP</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
        <p className="text-white/60 text-xs mt-2">{stats.xpToNext} XP to Level {stats.level + 1}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-4">
          <Clock className="w-6 h-6 text-blue-400 mb-3" />
          <div className="text-white text-xl font-bold">{stats.totalHours.toFixed(1)}h</div>
          <div className="text-white/70 text-sm">Total Study Time</div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-4">
          <Calendar className="w-6 h-6 text-green-400 mb-3" />
          <div className="text-white text-xl font-bold">{stats.currentStreak}</div>
          <div className="text-white/70 text-sm">Day Streak</div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-4">
          <Target className="w-6 h-6 text-purple-400 mb-3" />
          <div className="text-white text-xl font-bold">{stats.tasksCompleted}</div>
          <div className="text-white/70 text-sm">Tasks Done</div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-4">
          <TrendingUp className="w-6 h-6 text-orange-400 mb-3" />
          <div className="text-white text-xl font-bold">{stats.averageSession}m</div>
          <div className="text-white/70 text-sm">Avg Session</div>
        </div>
      </div>

      {/* Subject Breakdown */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 mb-8">
        <div className="flex items-center space-x-2 mb-6">
          <BookOpen className="w-5 h-5 text-white" />
          <h3 className="text-white font-semibold">Study Breakdown</h3>
        </div>
        
        <div className="space-y-4">
          {subjectBreakdown.map((subject) => {
            const percentage = (subject.hours / stats.totalHours) * 100;
            return (
              <div key={subject.subject}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white text-sm">{subject.subject}</span>
                  <span className="text-white/70 text-sm">{subject.hours.toFixed(1)}h</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: subject.color 
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Award className="w-5 h-5 text-white" />
          <h3 className="text-white font-semibold">Achievements</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {achievements.map((achievement) => (
            <div 
              key={achievement.id}
              className={`p-4 rounded-xl border transition-all duration-300 ${
                achievement.unlocked 
                  ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-400/30' 
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`text-2xl ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold ${achievement.unlocked ? 'text-yellow-400' : 'text-white/70'}`}>
                    {achievement.name}
                  </h4>
                  <p className="text-white/60 text-xs">{achievement.description}</p>
                  
                  {achievement.progress !== undefined && achievement.maxProgress && (
                    <div className="mt-2">
                      <div className="w-full bg-white/10 rounded-full h-1">
                        <div 
                          className="bg-yellow-400 h-1 rounded-full transition-all duration-500"
                          style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                        />
                      </div>
                      <div className="text-xs text-white/50 mt-1">
                        {achievement.progress} / {achievement.maxProgress}
                      </div>
                    </div>
                  )}
                </div>
                
                {achievement.unlocked && (
                  <Zap className="w-5 h-5 text-yellow-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};