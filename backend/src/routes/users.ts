import express from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  universityId: z.string().optional(),
  preferences: z.record(z.any()).optional()
});

const updateAvatarSchema = z.object({
  avatarUrl: z.string().url()
});

// Get user profile
router.get('/profile', asyncHandler(async (req: any, res) => {
  const userId = req.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      universityId: true,
      xp: true,
      level: true,
      streakCount: true,
      totalStudyHours: true,
      preferences: true,
      createdAt: true,
      university: {
        select: {
          id: true,
          name: true,
          country: true,
          city: true
        }
      }
    }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  res.json(user);
}));

// Update user profile
router.put('/profile', asyncHandler(async (req: any, res) => {
  const userId = req.user.id;
  const data = updateProfileSchema.parse(req.body);

  // If updating university, verify it exists
  if (data.universityId) {
    const university = await prisma.university.findUnique({
      where: { id: data.universityId }
    });

    if (!university) {
      throw createError('University not found', 404);
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      universityId: true,
      xp: true,
      level: true,
      streakCount: true,
      totalStudyHours: true,
      preferences: true,
      university: {
        select: {
          id: true,
          name: true,
          country: true,
          city: true
        }
      }
    }
  });

  res.json({
    message: 'Profile updated successfully',
    user: updatedUser
  });
}));

// Update user avatar
router.put('/avatar', asyncHandler(async (req: any, res) => {
  const userId = req.user.id;
  const { avatarUrl } = updateAvatarSchema.parse(req.body);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
    select: {
      id: true,
      avatarUrl: true
    }
  });

  res.json({
    message: 'Avatar updated successfully',
    avatarUrl: updatedUser.avatarUrl
  });
}));

// Get user stats
router.get('/stats', asyncHandler(async (req: any, res) => {
  const userId = req.user.id;
  const { period = 'week' } = req.query;

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

  // Get user's study sessions for the period
  const sessions = await prisma.studySession.findMany({
    where: {
      userId,
      startTime: { gte: startDate },
      completed: true
    },
    select: {
      duration: true,
      xpEarned: true,
      subject: true,
      startTime: true
    }
  });

  // Calculate stats
  const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
  const totalXP = sessions.reduce((sum, s) => sum + s.xpEarned, 0);
  const sessionCount = sessions.length;
  const averageDuration = sessionCount > 0 ? totalDuration / sessionCount : 0;

  // Subject breakdown
  const subjectBreakdown = sessions.reduce((acc, s) => {
    const subject = s.subject || 'Uncategorized';
    if (!acc[subject]) {
      acc[subject] = { duration: 0, sessions: 0, xp: 0 };
    }
    acc[subject].duration += s.duration;
    acc[subject].sessions += 1;
    acc[subject].xp += s.xpEarned;
    return acc;
  }, {} as Record<string, { duration: number; sessions: number; xp: number }>);

  // Daily breakdown
  const dailyBreakdown = sessions.reduce((acc, s) => {
    const date = s.startTime.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { duration: 0, sessions: 0, xp: 0 };
    }
    acc[date].duration += s.duration;
    acc[date].sessions += 1;
    acc[date].xp += s.xpEarned;
    return acc;
  }, {} as Record<string, { duration: number; sessions: number; xp: number }>);

  // Get user's current level and progress
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      xp: true,
      level: true,
      streakCount: true,
      totalStudyHours: true
    }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  // Calculate level progress
  const currentLevelXP = user.xp % 100;
  const nextLevelXP = 100 - currentLevelXP;
  const levelProgress = (currentLevelXP / 100) * 100;

  res.json({
    period,
    currentStats: {
      totalXP: user.xp,
      level: user.level,
      streakCount: user.streakCount,
      totalStudyHours: user.totalStudyHours,
      levelProgress,
      nextLevelXP
    },
    periodStats: {
      totalDuration,
      totalXP,
      sessionCount,
      averageDuration,
      subjectBreakdown,
      dailyBreakdown
    }
  });
}));

// Get user's study history
router.get('/history', asyncHandler(async (req: any, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20, subject, completed } = req.query;

  const where: any = { userId };
  if (subject) where.subject = subject;
  if (completed !== undefined) where.completed = completed === 'true';

  const sessions = await prisma.studySession.findMany({
    where,
    orderBy: { startTime: 'desc' },
    skip: (parseInt(page as string) - 1) * parseInt(limit as string),
    take: parseInt(limit as string),
    select: {
      id: true,
      startTime: true,
      endTime: true,
      duration: true,
      subject: true,
      task: true,
      completed: true,
      xpEarned: true
    }
  });

  const total = await prisma.studySession.count({ where });

  res.json({
    sessions,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string))
    }
  });
}));

// Get user's achievements
router.get('/achievements', asyncHandler(async (req: any, res) => {
  const userId = req.user.id;

  const userAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    include: {
      achievement: {
        select: {
          id: true,
          name: true,
          description: true,
          icon: true,
          xpReward: true
        }
      }
    },
    orderBy: { unlockedAt: 'desc' }
  });

  // Get all available achievements
  const allAchievements = await prisma.achievement.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      icon: true,
      xpReward: true,
      condition: true
    }
  });

  // Mark which achievements are unlocked
  const achievementsWithStatus = allAchievements.map(achievement => {
    const unlocked = userAchievements.find(ua => ua.achievementId === achievement.id);
    return {
      ...achievement,
      unlocked: !!unlocked,
      unlockedAt: unlocked?.unlockedAt || null
    };
  });

  res.json({
    unlocked: userAchievements,
    all: achievementsWithStatus
  });
}));

// Get user's friends
router.get('/friends', asyncHandler(async (req: any, res) => {
  const userId = req.user.id;

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
          totalStudyHours: true,
          university: {
            select: {
              id: true,
              name: true,
              country: true,
              city: true
            }
          }
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
          totalStudyHours: true,
          university: {
            select: {
              id: true,
              name: true,
              country: true,
              city: true
            }
          }
        }
      }
    }
  });

  // Extract friend data
  const friends = friendships.map(f => {
    const friend = f.userId === userId ? f.friend : f.user;
    return {
      ...friend,
      friendshipId: f.id,
      friendshipCreatedAt: f.createdAt
    };
  });

  res.json({ friends });
}));

export default router;
