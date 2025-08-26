import { io, Socket } from 'socket.io-client';

interface SocketEvents {
  // Study session events
  'session:started': (data: any) => void;
  'session:completed': (data: any) => void;
  
  // Campus activity events
  'campus:session_started': (data: any) => void;
  'campus:session_completed': (data: any) => void;
  'campus:activity': (data: any) => void;
  'campus:user_status': (data: any) => void;
  'campus:user_offline': (data: any) => void;
  'campus:achievement_unlocked': (data: any) => void;
  'campus:level_up': (data: any) => void;
  
  // Friend events
  'friend:request_received': (data: any) => void;
  'friend:request_accepted': (data: any) => void;
  'friend:request_rejected': (data: any) => void;
  'friend:removed': (data: any) => void;
  
  // Achievement events
  'achievement:unlocked': (data: any) => void;
  
  // Level events
  'level:up': (data: any) => void;
  
  // Typing indicators
  'typing:started': (data: any) => void;
  'typing:stopped': (data: any) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(token: string) {
    if (this.socket && this.isConnected) {
      return;
    }

    try {
      this.socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
        auth: { token },
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
      });

      this.setupEventHandlers();
      console.log('🔌 Socket.io connecting...');
    } catch (error) {
      console.error('Failed to create socket connection:', error);
    }
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket.io connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.io disconnected:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.socket?.connect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.io connection error:', error);
      this.isConnected = false;
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => {
          this.socket?.connect();
        }, this.reconnectDelay * this.reconnectAttempts);
      }
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Socket.io reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('❌ Socket.io reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('❌ Socket.io reconnection failed');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('🔌 Socket.io disconnected');
    }
  }

  // Emit events
  emitSessionStart(sessionData: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('session:start', sessionData);
    }
  }

  emitSessionComplete(sessionData: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('session:complete', sessionData);
    }
  }

  emitFriendRequest(friendId: string, message?: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('friend:request', { friendId, message });
    }
  }

  emitAchievementUnlock(achievementData: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('achievement:unlocked', achievementData);
    }
  }

  emitLevelUp(levelData: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('level:up', levelData);
    }
  }

  emitUserStatus(statusData: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit('user:status', statusData);
    }
  }

  emitTypingStart(recipientId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing:start', { recipientId });
    }
  }

  emitTypingStop(recipientId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing:stop', { recipientId });
    }
  }

  // Listen to events
  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) {
    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  off<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]) {
    if (this.socket) {
      this.socket.off(event, callback as any);
    }
  }

  // Utility methods
  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }

  getSocketId() {
    return this.socket?.id;
  }

  // Batch emit for multiple events
  emitBatch(events: Array<{ event: string; data: any }>) {
    if (this.socket && this.isConnected) {
      events.forEach(({ event, data }) => {
        this.socket!.emit(event, data);
      });
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.socket || !this.isConnected) {
        resolve(false);
        return;
      }

      const timeout = setTimeout(() => {
        resolve(false);
      }, 5000);

      this.socket.emit('ping', {}, () => {
        clearTimeout(timeout);
        resolve(true);
      });
    });
  }
}

// Create singleton instance
export const socketService = new SocketService();
export default socketService;

// Export types for use in components
export type { SocketEvents };
