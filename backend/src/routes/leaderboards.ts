import express from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get global leaderboard
router.get('/global', asyncHandler(async (req, res) => {
  const { period = 'all', limit = 50, page = 1 } = req.query;

  let startDate: Date | undefined;
  const now = new Date();

  if (period !== 'all') {
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
  }

  const where: any = {};
  if (startDate) {
    where.studySessions = {
      some: {
        startTime: { gte: startDate },
        completed: true
      }
    };
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      xp: true,
      level: true,
      streakCount: true,
      totalStudyHours: true,
      university: {
        select: {
          id: true,
          name: true,
          country: true,
          city: true
        }
      },
      studySessions: startDate ? {
        where: {
          startTime: { gte: startDate },
          completed: true
        },
        select: {
          xpEarned: true,
          duration: true
        }
      } : undefined
    },
    orderBy: { xp: 'desc' },
    skip: (parseInt(page as string) - 1) * parseInt(limit as string),
    take: parseInt(limit as string)
  });

  // Calculate period-specific stats if needed
  const leaderboard = users.map(user => {
    if (startDate && user.studySessions) {
      const periodXP = user.studySessions.reduce((sum, s) => sum + s.xpEarned, 0);
      const periodHours = user.studySessions.reduce((sum, s) => sum + s.duration, 0) / 60;
      
      return {
        ...user,
        periodXP,
        periodHours,
        studySessions: undefined
      };
    }
    
    return {
      ...user,
      periodXP: user.xp,
      periodHours: user.totalStudyHours
    };
  });

  const total = await prisma.user.count(where);

  res.json({
    period,
    leaderboard,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string))
    }
  });
}));

// Get university leaderboard
router.get('/university/:universityId', asyncHandler(async (req, res) => {
  const { universityId } = req.params;
  const { period = 'week', limit = 20, page = 1 } = req.query;

  // Verify university exists
  const university = await prisma.university.findUnique({
    where: { id: universityId }
  });

  if (!university) {
    return res.status(404).json({ error: 'University not found' });
  }

  let startDate: Date;
  const now = new Date();

  switch (period) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  const users = await prisma.user.findMany({
    where: {
      universityId,
      studySessions: {
        some: {
          startTime: { gte: startDate },
          completed: true
        }
      }
    },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      xp: true,
      level: true,
      streakCount: true,
      totalStudyHours: true,
      studySessions: {
        where: {
          startTime: { gte: startDate },
          completed: true
        },
        select: {
          xpEarned: true,
          duration: true
        }
      }
    },
    orderBy: { xp: 'desc' },
    skip: (parseInt(page as string) - 1) * parseInt(limit as string),
    take: parseInt(limit as string)
  });

  // Calculate period-specific stats
  const leaderboard = users.map(user => {
    const periodXP = user.studySessions.reduce((sum, s) => sum + s.xpEarned, 0);
    const periodHours = user.studySessions.reduce((sum, s) => sum + s.duration, 0) / 60;
    
    return {
      ...user,
      periodXP,
      periodHours,
      studySessions: undefined
    };
  });

  const total = await prisma.user.count({
    where: {
      universityId,
      studySessions: {
        some: {
          startTime: { gte: startDate },
          completed: true
        }
      }
    }
  });

  res.json({
    university,
    period,
    leaderboard,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string))
    }
  });
}));

// Get friends leaderboard
router.get('/friends', asyncHandler(async (req: any, res) => {
  const userId = req.user.id;
  const { period = 'week', limit = 20 } = req.query;

  // Get user's friends
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [
        { userId, status: 'accepted' },
        { friendId: userId, status: 'accepted' }
      ]
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          xp: true,
          level: true,
          streakCount: true,
          totalStudyHours: true
        }
      },
      friend: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          xp: true,
          level: true,
          streakCount: true,
          totalStudyHours: true
        }
      }
    }
  });

  // Extract friend IDs and user data
  const friendIds = friendships.map(f => 
    f.userId === userId ? f.friend.id : f.user.id
  );

  if (friendIds.length === 0) {
    return res.json({
      period,
      leaderboard: [],
      message: 'No friends found'
    });
  }

  let startDate: Date;
  const now = new Date();

  switch (period) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  // Get friends with period stats
  const friends = await prisma.user.findMany({
    where: {
      id: { in: friendIds },
      studySessions: {
        some: {
          startTime: { gte: startDate },
          completed: true
        }
      }
    },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      xp: true,
      level: true,
      streakCount: true,
      totalStudyHours: true,
      studySessions: {
        where: {
          startTime: { gte: startDate },
          completed: true
        },
        select: {
          xpEarned: true,
          duration: true
        }
      }
    },
    orderBy: { xp: 'desc' },
    take: parseInt(limit as string)
  });

  // Calculate period-specific stats
  const leaderboard = friends.map(friend => {
    const periodXP = friend.studySessions.reduce((sum, s) => sum + s.xpEarned, 0);
    const periodHours = friend.studySessions.reduce((sum, s) => sum + s.duration, 0) / 60;
    
    return {
      ...friend,
      periodXP,
      periodHours,
      studySessions: undefined
    };
  });

  res.json({
    period,
    leaderboard
  });
}));

// Get subject leaderboard
router.get('/subject/:subject', asyncHandler(async (req, res) => {
  const { subject } = req.params;
  const { period = 'month', limit = 20, page = 1 } = req.query;

  let startDate: Date;
  const now = new Date();

  switch (period) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const users = await prisma.user.findMany({
    where: {
      studySessions: {
        some: {
          subject: { equals: subject, mode: 'insensitive' },
          startTime: { gte: startDate },
          completed: true
        }
      }
    },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      xp: true,
      level: true,
      university: {
        select: {
          id: true,
          name: true,
          country: true,
          city: true
        }
      },
      studySessions: {
        where: {
          subject: { equals: subject, mode: 'insensitive' },
          startTime: { gte: startDate },
          completed: true
        },
        select: {
          xpEarned: true,
          duration: true
        }
      }
    },
    orderBy: { xp: 'desc' },
    skip: (parseInt(page as string) - 1) * parseInt(limit as string),
    take: parseInt(limit as string)
  });

  // Calculate subject-specific stats
  const leaderboard = users.map(user => {
    const subjectXP = user.studySessions.reduce((sum, s) => sum + s.xpEarned, 0);
    const subjectHours = user.studySessions.reduce((sum, s) => sum + s.duration, 0) / 60;
    
    return {
      ...user,
      subjectXP,
      subjectHours,
      studySessions: undefined
    };
  });

  const total = await prisma.user.count({
    where: {
      studySessions: {
        some: {
          subject: { equals: subject, mode: 'insensitive' },
          startTime: { gte: startDate },
          completed: true
        }
      }
    }
  });

  res.json({
    subject,
    period,
    leaderboard,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string))
    }
  });
}));

export default router;
