import React from 'react';
import { Users, Clock, TrendingUp } from 'lucide-react';

interface Campus {
  id: string;
  name: string;
  country: string;
  position: { x: number; y: number };
  hoursToday: number;
  weeklyTotal: number;
  activeUsers: number;
  topStudents: string[];
}

interface MapScreenProps {
  campuses: Campus[];
  onCampusSelect: (campus: Campus) => void;
}

export const MapScreen: React.FC<MapScreenProps> = ({ campuses, onCampusSelect }) => {
  const getIntensityColor = (hours: number) => {
    if (hours < 50) return 'bg-blue-500';
    if (hours < 150) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getIntensitySize = (hours: number) => {
    const baseSize = 8;
    const maxSize = 20;
    const size = Math.min(baseSize + (hours / 20), maxSize);
    return `${size}px`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Campus Activity</h1>
        <p className="text-white/70">See real-time study sessions around the world</p>
      </div>

      {/* World Map Container */}
      <div className="bg-white/5 backdrop-blur-lg rounded-3xl border border-white/10 p-8 mb-8">
        <div className="relative w-full h-96 bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-2xl overflow-hidden">
          {/* Simple World Map Background */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 200'%3E%3Cpath d='M50 50h80v30h-80zM150 40h60v40h-60zM230 60h90v25h-90zM60 120h70v35h-70zM150 110h100v45h-100z' fill='rgba(255,255,255,0.1)'/%3E%3C/svg%3E")`,
              backgroundSize: 'cover'
            }}
          />
          
          {/* Campus Nodes */}
          {campuses.map((campus) => (
            <button
              key={campus.id}
              onClick={() => onCampusSelect(campus)}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
              style={{
                left: `${campus.position.x}%`,
                top: `${campus.position.y}%`,
              }}
            >
              <div className="relative">
                {/* Pulsing Ring */}
                <div 
                  className={`absolute inset-0 rounded-full ${getIntensityColor(campus.hoursToday)} opacity-30 animate-ping`}
                  style={{ 
                    width: getIntensitySize(campus.hoursToday),
                    height: getIntensitySize(campus.hoursToday),
                  }}
                />
                
                {/* Main Node */}
                <div 
                  className={`rounded-full ${getIntensityColor(campus.hoursToday)} shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  style={{ 
                    width: getIntensitySize(campus.hoursToday),
                    height: getIntensitySize(campus.hoursToday),
                  }}
                />
                
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="bg-black/90 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                    <div className="font-semibold">{campus.name}</div>
                    <div className="text-white/70">{campus.hoursToday}h today</div>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 mt-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-white/70 text-sm">Low Activity</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-white/70 text-sm">Medium Activity</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-white/70 text-sm">High Activity</span>
          </div>
        </div>
      </div>

      {/* Campus Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campuses.slice(0, 6).map((campus) => (
          <button
            key={campus.id}
            onClick={() => onCampusSelect(campus)}
            className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">{campus.name}</h3>
              <div className={`w-3 h-3 rounded-full ${getIntensityColor(campus.hoursToday)}`}></div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-white/70 text-sm">
                <Clock className="w-4 h-4" />
                <span>{campus.hoursToday}h today • {campus.weeklyTotal}h this week</span>
              </div>
              
              <div className="flex items-center space-x-2 text-white/70 text-sm">
                <Users className="w-4 h-4" />
                <span>{campus.activeUsers} students focusing</span>
              </div>
              
              <div className="flex items-center space-x-2 text-white/70 text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>Top: {campus.topStudents.join(', ')}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};