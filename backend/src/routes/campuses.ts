import express from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const createUniversitySchema = z.object({
  name: z.string().min(2).max(100),
  country: z.string().min(2).max(50),
  city: z.string().min(2).max(50).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  metadata: z.record(z.any()).optional()
});

const createCampusSchema = z.object({
  name: z.string().min(2).max(100),
  universityId: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  metadata: z.record(z.any()).optional()
});

// Get all universities
router.get('/universities', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, country, search } = req.query;

  const where: any = {};
  if (country) where.country = country;
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { city: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const universities = await prisma.university.findMany({
    where,
    orderBy: { name: 'asc' },
    skip: (parseInt(page as string) - 1) * parseInt(limit as string),
    take: parseInt(limit as string),
    include: {
      _count: {
        select: { users: true, campuses: true }
      }
    }
  });

  const total = await prisma.university.count({ where });

  res.json({
    universities,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string))
    }
  });
}));

// Get university by ID
router.get('/universities/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const university = await prisma.university.findUnique({
    where: { id },
    include: {
      campuses: {
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true,
          address: true
        }
      },
      _count: {
        select: { users: true, campuses: true }
      }
    }
  });

  if (!university) {
    throw createError('University not found', 404);
  }

  res.json(university);
}));

// Create new university
router.post('/universities', asyncHandler(async (req, res) => {
  const data = createUniversitySchema.parse(req.body);

  // Check if university already exists
  const existing = await prisma.university.findFirst({
    where: {
      name: { equals: data.name, mode: 'insensitive' },
      country: { equals: data.country, mode: 'insensitive' }
    }
  });

  if (existing) {
    throw createError('University already exists', 409);
  }

  const university = await prisma.university.create({
    data
  });

  res.status(201).json({
    message: 'University created successfully',
    university
  });
}));

// Get all campuses
router.get('/campuses', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, universityId, search } = req.query;

  const where: any = {};
  if (universityId) where.universityId = universityId;
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { address: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const campuses = await prisma.campus.findMany({
    where,
    orderBy: { name: 'asc' },
    skip: (parseInt(page as string) - 1) * parseInt(limit as string),
    take: parseInt(limit as string),
    include: {
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

  const total = await prisma.campus.count({ where });

  res.json({
    campuses,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string))
    }
  });
}));

// Get campus by ID
router.get('/campuses/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const campus = await prisma.campus.findUnique({
    where: { id },
    include: {
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

  if (!campus) {
    throw createError('Campus not found', 404);
  }

  res.json(campus);
}));

// Create new campus
router.post('/campuses', asyncHandler(async (req, res) => {
  const data = createCampusSchema.parse(req.body);

  // Verify university exists
  const university = await prisma.university.findUnique({
    where: { id: data.universityId }
  });

  if (!university) {
    throw createError('University not found', 404);
  }

  const campus = await prisma.campus.create({
    data,
    include: {
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

  res.status(201).json({
    message: 'Campus created successfully',
    campus
  });
}));

// Get real-time campus activity
router.get('/campuses/:id/activity', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const campus = await prisma.campus.findUnique({
    where: { id },
    include: {
      university: true
    }
  });

  if (!campus) {
    throw createError('Campus not found', 404);
  }

  // Get current active sessions for users at this university
  const now = new Date();
  const activeSessions = await prisma.studySession.findMany({
    where: {
      user: {
        universityId: campus.universityId
      },
      startTime: { lte: now },
      endTime: null,
      completed: false
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true
        }
      }
    }
  });

  // Get today's study hours for this university
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayStats = await prisma.studySession.aggregate({
    where: {
      user: {
        universityId: campus.universityId
      },
      startTime: { gte: today },
      completed: true
    },
    _sum: {
      duration: true
    },
    _count: {
      id: true
    }
  });

  // Get weekly leaderboard for this university
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weeklyLeaderboard = await prisma.user.findMany({
    where: {
      universityId: campus.universityId
    },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      xp: true,
      level: true,
      _count: {
        select: {
          studySessions: {
            where: {
              startTime: { gte: weekAgo },
              completed: true
            }
          }
        }
      }
    },
    orderBy: { xp: 'desc' },
    take: 10
  });

  res.json({
    campus,
    activeUsers: activeSessions.length,
    todayStudyHours: (todayStats._sum.duration || 0) / 60,
    todaySessions: todayStats._count.id,
    weeklyLeaderboard,
    activeSessions: activeSessions.map(s => ({
      userId: s.user.id,
      userName: s.user.name,
      userAvatar: s.user.avatarUrl,
      subject: s.subject,
      task: s.task,
      elapsed: Math.round((now.getTime() - s.startTime.getTime()) / (1000 * 60))
    }))
  });
}));

// Get campus leaderboard
router.get('/campuses/:id/leaderboard', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { period = 'week', limit = 20 } = req.query;

  const campus = await prisma.campus.findUnique({
    where: { id },
    include: {
      university: true
    }
  });

  if (!campus) {
    throw createError('Campus not found', 404);
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

  // Get leaderboard based on XP earned in the period
  const leaderboard = await prisma.user.findMany({
    where: {
      universityId: campus.universityId
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
  const leaderboardWithStats = leaderboard.map(user => {
    const periodXP = user.studySessions.reduce((sum, s) => sum + s.xpEarned, 0);
    const periodHours = user.studySessions.reduce((sum, s) => sum + s.duration, 0) / 60;
    
    return {
      ...user,
      periodXP,
      periodHours,
      studySessions: undefined // Remove from response
    };
  });

  res.json({
    campus,
    period,
    leaderboard: leaderboardWithStats
  });
}));

export default router;
