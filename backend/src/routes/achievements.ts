import express from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createAchievementSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().min(10).max(500),
  icon: z.string().optional(),
  xpReward: z.number().min(0).max(1000),
  condition: z.record(z.any())
});

// Get all achievements
router.get('/', asyncHandler(async (req, res) => {
  const achievements = await prisma.achievement.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      icon: true,
      xpReward: true,
      condition: true,
      createdAt: true,
      _count: {
        select: {
          userAchievements: true
        }
      }
    },
    orderBy: { xpReward: 'asc' }
  });

  res.json({ achievements });
}));

// Get achievement by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const achievement = await prisma.achievement.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      icon: true,
      xpReward: true,
      condition: true,
      createdAt: true,
      _count: {
        select: {
          userAchievements: true
        }
      }
    }
  });

  if (!achievement) {
    throw createError('Achievement not found', 404);
  }

  res.json(achievement);
}));

// Create new achievement (admin only)
router.post('/', asyncHandler(async (req, res) => {
  const data = createAchievementSchema.parse(req.body);

  // Check if achievement already exists
  const existing = await prisma.achievement.findUnique({
    where: { name: data.name }
  });

  if (existing) {
    throw createError('Achievement with this name already exists', 409);
  }

  const achievement = await prisma.achievement.create({
    data
  });

  res.status(201).json({
    message: 'Achievement created successfully',
    achievement
  });
}));

// Get user's achievements
router.get('/user/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

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

  res.json({ userAchievements });
}));

// Check and unlock achievements for a user
router.post('/check/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      studySessions: {
        where: { completed: true },
        select: {
          duration: true,
          xpEarned: true,
          subject: true,
          startTime: true
        }
      }
    }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  // Get all achievements
  const achievements = await prisma.achievement.findMany({
    select: {
      id: true,
      name: true,
      description: true,
      icon: true,
      xpReward: true,
      condition: true
    }
  });

  // Get user's already unlocked achievements
  const unlockedAchievements = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true }
  });

  const unlockedIds = unlockedAchievements.map(ua => ua.achievementId);
  const newlyUnlocked: any[] = [];

  // Check each achievement
  for (const achievement of achievements) {
    if (unlockedIds.includes(achievement.id)) {
      continue; // Already unlocked
    }

    if (await checkAchievementCondition(achievement.condition, user)) {
      // Unlock achievement
      await prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievement.id
        }
      });

      // Award XP
      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: achievement.xpReward }
        }
      });

      newlyUnlocked.push({
        ...achievement,
        unlockedAt: new Date()
      });
    }
  }

  res.json({
    message: `${newlyUnlocked.length} achievements unlocked`,
    newlyUnlocked
  });
}));

// Helper function to check achievement conditions
async function checkAchievementCondition(condition: any, user: any): Promise<boolean> {
  const { type, value, subject, timeframe } = condition;

  switch (type) {
    case 'total_study_hours':
      return user.totalStudyHours >= value;

    case 'total_sessions':
      return user.studySessions.length >= value;

    case 'streak_days':
      return user.streakCount >= value;

    case 'subject_sessions':
      if (!subject) return false;
      const subjectSessions = user.studySessions.filter(
        (s: any) => s.subject === subject
      );
      return subjectSessions.length >= value;

    case 'daily_study_hours':
      if (!timeframe) return false;
      const now = new Date();
      let startDate: Date;

      switch (timeframe) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        default:
          return false;
      }

      const dailyHours = user.studySessions
        .filter((s: any) => s.startTime >= startDate)
        .reduce((sum: number, s: any) => sum + s.duration, 0) / 60;

      return dailyHours >= value;

    case 'consecutive_days':
      // This would require more complex logic to track consecutive study days
      // For now, we'll use a simplified version
      return user.streakCount >= value;

    case 'xp_milestone':
      return user.xp >= value;

    case 'level_milestone':
      return user.level >= value;

    default:
      return false;
  }
}

// Get achievement statistics
router.get('/stats/overview', asyncHandler(async (req, res) => {
  const totalAchievements = await prisma.achievement.count();
  const totalUnlocked = await prisma.userAchievement.count();
  const uniqueUsers = await prisma.userAchievement.groupBy({
    by: ['userId'],
    _count: { userId: true }
  });

  // Get most popular achievements
  const popularAchievements = await prisma.userAchievement.groupBy({
    by: ['achievementId'],
    _count: { achievementId: true },
    orderBy: {
      _count: {
        achievementId: 'desc'
      }
    },
    take: 10
  });

  // Get achievement details for popular ones
  const popularAchievementsWithDetails = await Promise.all(
    popularAchievements.map(async (pa) => {
      const achievement = await prisma.achievement.findUnique({
        where: { id: pa.achievementId },
        select: {
          id: true,
          name: true,
          description: true,
          icon: true,
          xpReward: true
        }
      });

      return {
        ...achievement,
        unlockCount: pa._count.achievementId
      };
    })
  );

  res.json({
    totalAchievements,
    totalUnlocked,
    uniqueUsers: uniqueUsers.length,
    averageUnlocksPerUser: totalUnlocked / Math.max(uniqueUsers.length, 1),
    popularAchievements: popularAchievementsWithDetails
  });
}));

// Get user's achievement progress
router.get('/progress/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  const totalAchievements = await prisma.achievement.count();
  const unlockedAchievements = await prisma.userAchievement.count({
    where: { userId }
  });

  const progress = (unlockedAchievements / totalAchievements) * 100;

  // Get achievement categories
  const achievements = await prisma.achievement.findMany({
    select: {
      id: true,
      name: true,
      xpReward: true
    }
  });

  const unlockedIds = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true }
  });

  const unlockedIdsSet = new Set(unlockedIds.map(ua => ua.achievementId));

  const achievementsWithStatus = achievements.map(achievement => ({
    ...achievement,
    unlocked: unlockedIdsSet.has(achievement.id)
  }));

  res.json({
    totalAchievements,
    unlockedAchievements,
    progress: Math.round(progress * 100) / 100,
    achievements: achievementsWithStatus
  });
}));

export default router;
