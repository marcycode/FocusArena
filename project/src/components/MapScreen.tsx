import React from 'react';
import { Users, Clock, TrendingUp, Plus, LogOut } from 'lucide-react';

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
  onAddUniversity?: (name: string, country: string) => void;
}

export const MapScreen: React.FC<MapScreenProps> = ({ campuses, onCampusSelect, onAddUniversity }) => {
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [newUniversityName, setNewUniversityName] = React.useState('');
  const [newUniversityCountry, setNewUniversityCountry] = React.useState('');

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
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">StudySync</h1>
        </div>
        
        <div className="flex items-center space-x-4">
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
      </div>

      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Campus Activity</h1>
          <p className="text-white/70">See real-time study sessions around the world</p>
        </div>
        <div className="flex space-x-3 items-center">
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-300 transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span>Add University</span>
          </button>
        </div>
      </div>

      {/* Add University Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-8 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-6">Add Your University</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-white/70 text-sm mb-2">University Name</label>
                <input
                  type="text"
                  value={newUniversityName}
                  onChange={(e) => setNewUniversityName(e.target.value)}
                  placeholder="e.g., Harvard University"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                />
              </div>
              
              <div>
                <label className="block text-white/70 text-sm mb-2">Country</label>
                <input
                  type="text"
                  value={newUniversityCountry}
                  onChange={(e) => setNewUniversityCountry(e.target.value)}
                  placeholder="e.g., United States"
                  className="w-full bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                />
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  if (newUniversityName.trim() && newUniversityCountry.trim() && onAddUniversity) {
                    onAddUniversity(newUniversityName.trim(), newUniversityCountry.trim());
                    setNewUniversityName('');
                    setNewUniversityCountry('');
                    setShowAddForm(false);
                  }
                }}
                disabled={!newUniversityName.trim() || !newUniversityCountry.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all"
              >
                Add University
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewUniversityName('');
                  setNewUniversityCountry('');
                }}
                className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 rounded-xl font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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