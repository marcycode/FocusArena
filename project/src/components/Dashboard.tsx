import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Flame, Clock, Target, Calendar, CheckCircle, Circle, Volume2, VolumeX, Sun, Moon } from 'lucide-react';

interface FocusSession {
  id: string;
  task: string;
  duration: number;
  completedAt: Date;
  completed: boolean;
}

interface DashboardProps {
  streak: number;
  todayHours: number;
  yesterdayHours: number;
  totalPomodoros: number;
  onStartSession: (task: string, duration: number) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  streak,
  todayHours,
  yesterdayHours,
  totalPomodoros,
  onStartSession,
  isDarkMode,
  onToggleTheme
}) => {
  const [task, setTask] = useState('');
  const [duration, setDuration] = useState(25);
  const [customDuration, setCustomDuration] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showTaskPanel, setShowTaskPanel] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const presets = [15, 25, 50, 90];
  
  // Calming/abstract background images
  const backgroundImages = [
    'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg',
    'https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg',
    'https://images.pexels.com/photos/1323712/pexels-photo-1323712.jpeg',
    'https://images.pexels.com/photos/1591447/pexels-photo-1591447.jpeg',
    'https://images.pexels.com/photos/1366630/pexels-photo-1366630.jpeg',
  ];

  const motivationalQuotes = [
    "The secret of getting ahead is getting started. - Mark Twain",
    "Focus on being productive instead of busy. - Tim Ferriss",
    "Success is the sum of small efforts repeated day in and day out. - Robert Collier",
    "The way to get started is to quit talking and begin doing. - Walt Disney",
    "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
    "Productivity is never an accident. It is always the result of commitment. - Paul J. Meyer"
  ];

  const [currentBg, setCurrentBg] = useState(0);
  const [currentQuote, setCurrentQuote] = useState(0);

  // Theme-based styles
  const themeStyles = {
    background: isDarkMode 
      ? 'from-slate-900 via-gray-900 to-black' 
      : 'from-blue-50 via-indigo-50 to-purple-50',
    overlay: isDarkMode 
      ? 'from-slate-900/60 via-purple-900/50 to-indigo-900/60' 
      : 'from-white/40 via-blue-50/60 to-purple-50/40',
    text: isDarkMode ? 'text-white' : 'text-gray-900',
    textSecondary: isDarkMode ? 'text-white/70' : 'text-gray-600',
    textTertiary: isDarkMode ? 'text-white/50' : 'text-gray-500',
    card: isDarkMode 
      ? 'bg-white/10 backdrop-blur-md border-white/20' 
      : 'bg-white/80 backdrop-blur-md border-gray-200/50',
    cardHover: isDarkMode ? 'hover:bg-white/20' : 'hover:bg-white/90',
    button: isDarkMode 
      ? 'bg-white/10 hover:bg-white/20 border-white/20' 
      : 'bg-white/90 hover:bg-white border-gray-200',
    input: isDarkMode 
      ? 'bg-white/10 border-white/20 text-white placeholder-white/50' 
      : 'bg-white/90 border-gray-200 text-gray-900 placeholder-gray-500',
    inputFocus: isDarkMode 
      ? 'focus:ring-blue-400 focus:border-blue-400' 
      : 'focus:ring-blue-500 focus:border-blue-500'
  };
  // Rotate backgrounds every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBg((prev) => (prev + 1) % backgroundImages.length);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // Don't rotate backgrounds in light mode
  useEffect(() => {
    if (isDarkMode) {
      const interval = setInterval(() => {
        setCurrentBg((prev) => (prev + 1) % backgroundImages.length);
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [isDarkMode]);

  // Rotate quotes every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % motivationalQuotes.length);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      handleComplete();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const effectiveDuration = customDuration ? parseInt(customDuration) : duration;

  const handleStart = () => {
    if (!task.trim()) {
      setShowTaskPanel(true);
      return;
    }
    
    const sessionDuration = effectiveDuration;
    setTimeLeft(sessionDuration * 60);
    setIsActive(true);
    onStartSession(task, sessionDuration);
  };

  const handlePause = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(0);
    
    if (task.trim()) {
      const newSession: FocusSession = {
        id: Date.now().toString(),
        task: task,
        duration: effectiveDuration,
        completedAt: new Date(),
        completed: false
      };
      setSessions(prev => [newSession, ...prev]);
    }
  };

  const handleComplete = () => {
    setIsActive(false);
    
    if (task.trim()) {
      const newSession: FocusSession = {
        id: Date.now().toString(),
        task: task,
        duration: effectiveDuration,
        completedAt: new Date(),
        completed: true
      };
      setSessions(prev => [newSession, ...prev]);
    }
    
    setTimeLeft(0);
    setTask('');
    
    // Play completion sound if enabled
    if (soundEnabled) {
      // Simple audio feedback (browser beep)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = timeLeft > 0 ? ((effectiveDuration * 60 - timeLeft) / (effectiveDuration * 60)) * 100 : 0;

  return (
    <div className={`min-h-screen relative overflow-hidden ${isDarkMode ? '' : `bg-gradient-to-br ${themeStyles.background}`}`}>
      {/* Full-screen rotating background (dark mode only) */}
      {isDarkMode && (
        <div className="absolute inset-0">
          {backgroundImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-2000 ${
                index === currentBg ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={image}
                alt="Background"
                className="w-full h-full object-cover"
              />
              <div className={`absolute inset-0 bg-gradient-to-br ${themeStyles.overlay}`} />
            </div>
          ))}
        </div>
      )}

      {/* Top controls */}
      <div className="absolute top-6 right-6 z-20 flex space-x-3">
        <button
          onClick={onToggleTheme}
          className={`${themeStyles.card} rounded-full p-3 ${themeStyles.text} ${themeStyles.cardHover} transition-all`}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`${themeStyles.card} rounded-full p-3 ${themeStyles.text} ${themeStyles.cardHover} transition-all`}
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      <div className={`relative z-10 min-h-screen flex flex-col items-center justify-center p-6 ${themeStyles.text}`}>
        
        {/* Top Stats Bar */}
        <div className="absolute top-6 left-6 right-32 flex justify-between items-center">
          {/* Streak Counter */}
          <div className={`${themeStyles.card} rounded-2xl px-6 py-3 flex items-center space-x-3`}>
            <Flame className={`w-6 h-6 text-orange-400 ${streak > 0 ? 'animate-pulse' : ''}`} />
            <div>
              <div className={`text-xl font-bold ${themeStyles.text}`}>{streak}</div>
              <div className={`text-xs ${themeStyles.textSecondary}`}>Day Streak</div>
            </div>
          </div>

          {/* Daily Stats */}
          <div className="flex space-x-4">
            <div className={`${themeStyles.card} rounded-xl px-4 py-3 text-center`}>
              <Clock className="w-5 h-5 mx-auto mb-1 text-blue-300" />
              <div className={`text-lg font-bold ${themeStyles.text}`}>{todayHours.toFixed(1)}h</div>
              <div className={`text-xs ${themeStyles.textSecondary}`}>Today</div>
            </div>
            <div className={`${themeStyles.card} rounded-xl px-4 py-3 text-center`}>
              <Target className="w-5 h-5 mx-auto mb-1 text-green-300" />
              <div className={`text-lg font-bold ${themeStyles.text}`}>{totalPomodoros}</div>
              <div className={`text-xs ${themeStyles.textSecondary}`}>Sessions</div>
            </div>
            <div className={`${themeStyles.card} rounded-xl px-4 py-3 text-center`}>
              <Calendar className="w-5 h-5 mx-auto mb-1 text-purple-300" />
              <div className={`text-lg font-bold ${themeStyles.text}`}>
                {todayHours > yesterdayHours ? '+' : ''}{(todayHours - yesterdayHours).toFixed(1)}h
              </div>
              <div className={`text-xs ${themeStyles.textSecondary}`}>vs Yesterday</div>
            </div>
          </div>
        </div>

        {/* Central Content */}
        <div className="flex flex-col items-center space-y-8 max-w-2xl w-full">
          
          {/* Timer Display (when active) */}
          {timeLeft > 0 && (
            <div className="text-center mb-8">
              <div className={`${themeStyles.card} rounded-3xl p-8`}>
                <div className={`text-6xl font-bold mb-4 font-mono ${themeStyles.text}`}>{formatTime(timeLeft)}</div>
                <div className={`text-xl ${themeStyles.textSecondary} mb-6`}>{task}</div>
                <div className={`w-full ${isDarkMode ? 'bg-white/20' : 'bg-gray-200'} rounded-full h-3 mb-4`}>
                  <div
                    className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 h-3 rounded-full transition-all duration-1000 relative overflow-hidden"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                  </div>
                </div>
                <div className={`${themeStyles.textTertiary} text-sm`}>
                  {Math.floor(progress)}% Complete • {effectiveDuration} min session
                </div>
                
                {/* Timer Controls */}
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={handlePause}
                    className={`${themeStyles.card} ${themeStyles.cardHover} px-6 py-3 rounded-xl flex items-center space-x-2 transition-all transform hover:scale-105`}
                  >
                    {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    <span className="font-semibold">{isActive ? 'Pause' : 'Resume'}</span>
                  </button>
                  <button
                    onClick={handleReset}
                    className="bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 px-6 py-3 rounded-xl flex items-center space-x-2 transition-all transform hover:scale-105 text-red-300 hover:text-red-200"
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span className="font-semibold">Reset</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Task Lock-in Panel */}
          {showTaskPanel && !isActive && (
            <div className={`${themeStyles.card} rounded-3xl p-8 w-full max-w-lg`}>
              <h3 className={`text-2xl font-bold mb-6 text-center ${themeStyles.text}`}>What's your focus?</h3>
              
              <input
                type="text"
                value={task}
                onChange={(e) => setTask(e.target.value)}
                placeholder="Enter your task or goal..."
                className={`w-full ${themeStyles.input} border rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 ${themeStyles.inputFocus} focus:border-transparent text-lg mb-6`}
              />

              {/* Timer Presets */}
              <div className="mb-6">
                <div className={`text-sm ${themeStyles.textSecondary} mb-3`}>Choose duration:</div>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {presets.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => {
                        setDuration(preset);
                        setCustomDuration('');
                      }}
                      className={`py-3 px-4 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                        duration === preset && !customDuration
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                          : `${themeStyles.button} ${themeStyles.text} ${themeStyles.cardHover}`
                      }`}
                    >
                      {preset}m
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center space-x-3 mb-4">
                  <input
                    type="number"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    placeholder="Custom minutes"
                    min="1"
                    max="480"
                    className={`flex-1 ${themeStyles.input} border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 transition-all ${
                      customDuration ? `border-blue-400 ${themeStyles.inputFocus}` : `${themeStyles.inputFocus}`
                    }`}
                  />
                </div>
                
                <div className={`text-center text-sm ${themeStyles.textSecondary} bg-gradient-to-r ${isDarkMode ? 'from-blue-500/10 to-purple-500/10' : 'from-blue-50 to-purple-50'} rounded-lg py-2 px-4`}>
                  Session Duration: <span className={`font-semibold ${themeStyles.text}`}>{effectiveDuration} minutes</span>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleStart}
                  disabled={!task.trim()}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                    task.trim()
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600'
                      : `${themeStyles.button} ${themeStyles.textSecondary} opacity-50 cursor-not-allowed`
                  }`}
                >
                  Start Session
                </button>
                <button
                onClick={() => setShowTaskPanel(false)}
                className={`w-full ${themeStyles.button} py-3 rounded-xl ${themeStyles.textSecondary} transition-all`}
              >
                Close
              </button>
              </div>
            </div>
          )}

          {/* Central Clock In Button */}
          {!showTaskPanel && (
            <div className="text-center">
              {!isActive && timeLeft === 0 && (
                <button
                  onClick={handleStart}
                  className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 px-12 py-6 rounded-full font-bold text-2xl flex items-center space-x-4 transition-all transform hover:scale-110 shadow-2xl border-2 border-white/20"
                >
                  <Play className="w-8 h-8" />
                  <span>{task.trim() ? 'Clock In' : 'Set Task & Clock In'}</span>
                </button>
              )}

              {task.trim() && !isActive && timeLeft === 0 && (
                <div className={`mt-4 ${themeStyles.textSecondary}`}>
                  Ready to focus on: <span className={`${themeStyles.text} font-semibold`}>"{task}"</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Motivational Quote */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className={`${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-gray-200/50'} backdrop-blur-md rounded-2xl p-6 border text-center`}>
            <p className={`${themeStyles.textSecondary} italic text-lg transition-all duration-1000`}>
              "{motivationalQuotes[currentQuote]}"
            </p>
          </div>
        </div>

        {/* Recent Sessions (minimal, bottom corner) */}
        {sessions.length > 0 && (
          <div className={`absolute bottom-24 right-6 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/60 border-gray-200/50'} backdrop-blur-md rounded-xl p-4 border max-w-xs`}>
            <div className={`text-sm ${themeStyles.textSecondary} mb-2`}>Recent Sessions</div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {sessions.slice(0, 3).map((session) => (
                <div key={session.id} className="flex items-center space-x-2 text-xs">
                  {session.completed ? (
                    <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                  ) : (
                    <Circle className="w-3 h-3 text-red-400 flex-shrink-0" />
                  )}
                  <span className={`${themeStyles.textTertiary} truncate`}>{session.task}</span>
                  <span className={`${themeStyles.textTertiary}`}>{session.duration}m</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;