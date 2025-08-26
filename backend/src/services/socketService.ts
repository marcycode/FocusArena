import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userData?: any;
}

export const initializeSocketHandlers = (io: Server) => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify token (you can reuse your JWT verification logic here)
      // For now, we'll use a simple approach - in production, use proper JWT verification
      const userId = token; // This should be decoded from JWT
      
      if (!userId) {
        return next(new Error('Invalid token'));
      }

      // Get user data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          universityId: true
        }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = userId;
      socket.userData = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`🔌 User connected: ${socket.userData?.name} (${socket.userId})`);

    // Join user's personal room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
      
      // Join campus room if user has university
      if (socket.userData?.universityId) {
        socket.join(`campus:${socket.userData.universityId}`);
        console.log(`📍 User joined campus: ${socket.userData.universityId}`);
      }
    }

    // Handle study session events
    socket.on('session:start', async (data) => {
      try {
        if (!socket.userId) return;

        // Emit to user's personal room
        socket.to(`user:${socket.userId}`).emit('session:started', {
          userId: socket.userId,
          userName: socket.userData?.name,
          userAvatar: socket.userData?.avatarUrl,
          ...data
        });

        // Emit to campus room if user has university
        if (socket.userData?.universityId) {
          socket.to(`campus:${socket.userData.universityId}`).emit('campus:session_started', {
            userId: socket.userId,
            userName: socket.userData?.name,
            userAvatar: socket.userData?.avatarUrl,
            ...data
          });
        }

        console.log(`📚 Session started: ${socket.userData?.name} - ${data.subject || 'No subject'}`);
      } catch (error) {
        console.error('Error handling session start:', error);
      }
    });

    socket.on('session:complete', async (data) => {
      try {
        if (!socket.userId) return;

        // Emit to user's personal room
        socket.to(`user:${socket.userId}`).emit('session:completed', {
          userId: socket.userId,
          userName: socket.userData?.name,
          userAvatar: socket.userData?.avatarUrl,
          ...data
        });

        // Emit to campus room if user has university
        if (socket.userData?.universityId) {
          socket.to(`campus:${socket.userData.universityId}`).emit('campus:session_completed', {
            userId: socket.userId,
            userName: socket.userData?.name,
            userAvatar: socket.userData?.avatarUrl,
            ...data
          });
        }

        console.log(`✅ Session completed: ${socket.userData?.name} - ${data.xpEarned} XP`);
      } catch (error) {
        console.error('Error handling session complete:', error);
      }
    });

    // Handle friend requests
    socket.on('friend:request', async (data) => {
      try {
        if (!socket.userId) return;

        // Emit to the friend's room
        socket.to(`user:${data.friendId}`).emit('friend:request_received', {
          from: {
            id: socket.userId,
            name: socket.userData?.name,
            avatarUrl: socket.userData?.avatarUrl
          },
          ...data
        });

        console.log(`👥 Friend request sent: ${socket.userData?.name} → ${data.friendId}`);
      } catch (error) {
        console.error('Error handling friend request:', error);
      }
    });

    // Handle achievement unlocks
    socket.on('achievement:unlocked', async (data) => {
      try {
        if (!socket.userId) return;

        // Emit to user's personal room
        socket.to(`user:${socket.userId}`).emit('achievement:unlocked', {
          userId: socket.userId,
          userName: socket.userData?.name,
          userAvatar: socket.userData?.avatarUrl,
          ...data
        });

        // Emit to campus room if user has university
        if (socket.userData?.universityId) {
          socket.to(`campus:${socket.userData.universityId}`).emit('campus:achievement_unlocked', {
            userId: socket.userId,
            userName: socket.userData?.name,
            userAvatar: socket.userData?.avatarUrl,
            ...data
          });
        }

        console.log(`🏆 Achievement unlocked: ${socket.userData?.name} - ${data.achievementName}`);
      } catch (error) {
        console.error('Error handling achievement unlock:', error);
      }
    });

    // Handle level ups
    socket.on('level:up', async (data) => {
      try {
        if (!socket.userId) return;

        // Emit to user's personal room
        socket.to(`user:${socket.userId}`).emit('level:up', {
          userId: socket.userId,
          userName: socket.userData?.name,
          userAvatar: socket.userData?.avatarUrl,
          ...data
        });

        // Emit to campus room if user has university
        if (socket.userData?.universityId) {
          socket.to(`campus:${socket.userData.universityId}`).emit('campus:level_up', {
            userId: socket.userId,
            userName: socket.userData?.name,
            userAvatar: socket.userData?.avatarUrl,
            ...data
          });
        }

        console.log(`🎉 Level up: ${socket.userData?.name} - Level ${data.newLevel}`);
      } catch (error) {
        console.error('Error handling level up:', error);
      }
    });

    // Handle user status updates
    socket.on('user:status', async (data) => {
      try {
        if (!socket.userId) return;

        // Emit to campus room if user has university
        if (socket.userData?.universityId) {
          socket.to(`campus:${socket.userData.universityId}`).emit('campus:user_status', {
            userId: socket.userId,
            userName: socket.userData?.name,
            userAvatar: socket.userData?.avatarUrl,
            ...data
          });
        }
      } catch (error) {
        console.error('Error handling user status:', error);
      }
    });

    // Handle typing indicators (for future chat features)
    socket.on('typing:start', (data) => {
      if (!socket.userId) return;
      
      socket.to(`user:${data.recipientId}`).emit('typing:started', {
        userId: socket.userId,
        userName: socket.userData?.name
      });
    });

    socket.on('typing:stop', (data) => {
      if (!socket.userId) return;
      
      socket.to(`user:${data.recipientId}`).emit('typing:stopped', {
        userId: socket.userId,
        userName: socket.userData?.name
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.userData?.name} (${socket.userId})`);
      
      // Emit user offline status to campus
      if (socket.userId && socket.userData?.universityId) {
        socket.to(`campus:${socket.userData.universityId}`).emit('campus:user_offline', {
          userId: socket.userId,
          userName: socket.userData?.name
        });
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  // Broadcast functions for use in other parts of the application
  io.broadcastToUser = (userId: string, event: string, data: any) => {
    io.to(`user:${userId}`).emit(event, data);
  };

  io.broadcastToCampus = (campusId: string, event: string, data: any) => {
    io.to(`campus:${campusId}`).emit(event, data);
  };

  io.broadcastToAll = (event: string, data: any) => {
    io.emit(event, data);
  };

  console.log('✅ Socket.io handlers initialized');
};

// Utility functions for external use
export const broadcastUserSessionStart = (io: Server, userId: string, userData: any, sessionData: any) => {
  io.to(`user:${userId}`).emit('session:started', {
    userId,
    userName: userData.name,
    userAvatar: userData.avatarUrl,
    ...sessionData
  });

  if (userData.universityId) {
    io.to(`campus:${userData.universityId}`).emit('campus:session_started', {
      userId,
      userName: userData.name,
      userAvatar: userData.avatarUrl,
      ...sessionData
    });
  }
};

export const broadcastUserSessionComplete = (io: Server, userId: string, userData: any, sessionData: any) => {
  io.to(`user:${userId}`).emit('session:completed', {
    userId,
    userName: userData.name,
    userAvatar: userData.avatarUrl,
    ...sessionData
  });

  if (userData.universityId) {
    io.to(`campus:${userData.universityId}`).emit('campus:session_completed', {
      userId,
      userName: userData.name,
      userAvatar: userData.avatarUrl,
      ...sessionData
    });
  }
};

export const broadcastAchievementUnlock = (io: Server, userId: string, userData: any, achievementData: any) => {
  io.to(`user:${userId}`).emit('achievement:unlocked', {
    userId,
    userName: userData.name,
    userAvatar: userData.avatarUrl,
    ...achievementData
  });

  if (userData.universityId) {
    io.to(`campus:${userData.universityId}`).emit('campus:achievement_unlocked', {
      userId,
      userName: userData.name,
      userAvatar: userData.avatarUrl,
      ...achievementData
    });
  }
};

export const broadcastLevelUp = (io: Server, userId: string, userData: any, levelData: any) => {
  io.to(`user:${userId}`).emit('level:up', {
    userId,
    userName: userData.name,
    userAvatar: userData.avatarUrl,
    ...levelData
  });

  if (userData.universityId) {
    io.to(`campus:${userData.universityId}`).emit('campus:level_up', {
      userId,
      userName: userData.name,
      userAvatar: userData.avatarUrl,
      ...levelData
    });
  }
};
