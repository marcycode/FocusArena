import express from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const startSessionSchema = z.object({
  subject: z.string().optional(),
  task: z.string().optional(),
  duration: z.number().min(1).max(480) // 1 minute to 8 hours
});

const completeSessionSchema = z.object({
  sessionId: z.string(),
  endTime: z.string().datetime().optional(),
  completed: z.boolean().default(true)
});

// Start a study session
router.post('/start', asyncHandler(async (req: any, res) => {
  const { subject, task, duration } = startSessionSchema.parse(req.body);
  const userId = req.user.id;

  // Check if user already has an active session
  const activeSession = await prisma.studySession.findFirst({
    where: {
      userId,
      completed: false,
      endTime: null
    }
  });

  if (activeSession) {
    throw createError('User already has an active session', 400);
  }

  // Create new session
  const session = await prisma.studySession.create({
    data: {
      userId,
      startTime: new Date(),
      duration,
      subject,
      task,
      completed: false
    }
  });

  // Emit socket event for real-time updates
  req.app.get('io')?.to(`user:${userId}`).emit('session:started', {
    sessionId: session.id,
    startTime: session.startTime,
    duration,
    subject,
    task
  });

  res.status(201).json({
    message: 'Study session started',
    session: {
      id: session.id,
      startTime: session.startTime,
      duration,
      subject,
      task
    }
  });
}));

// Complete a study session
router.put('/complete', asyncHandler(async (req: any, res) => {
  const { sessionId, endTime, completed } = completeSessionSchema.parse(req.body);
  const userId = req.user.id;

  // Find and verify session ownership
  const session = await prisma.studySession.findFirst({
    where: {
      id: sessionId,
      userId,
      completed: false
    }
  });

  if (!session) {
    throw createError('Session not found or already completed', 404);
  }

  const actualEndTime = endTime ? new Date(endTime) : new Date();
  const actualDuration = Math.round((actualEndTime.getTime() - session.startTime.getTime()) / (1000 * 60));

  // Calculate XP based on duration and completion
  let xpEarned = 0;
  if (completed) {
    // Base XP: 1 XP per minute, bonus for longer sessions
    xpEarned = Math.floor(actualDuration * 1.2);
    
    // Bonus for completing the full intended duration
    if (Math.abs(actualDuration - session.duration) <= 5) {
      xpEarned += Math.floor(session.duration * 0.3); // 30% bonus
    }
  }

  // Update session
  const updatedSession = await prisma.studySession.update({
    where: { id: sessionId },
    data: {
      endTime: actualEndTime,
      duration: actualDuration,
      completed,
      xpEarned
    }
  });

  // Update user stats
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      xp: { increment: xpEarned },
      totalStudyHours: { increment: actualDuration / 60 },
      streakCount: { increment: completed ? 1 : 0 }
    }
  });

  // Check for level up
  const newLevel = Math.floor(user.xp / 100) + 1;
  let levelUp = false;
  
  if (newLevel > user.level) {
    await prisma.user.update({
      where: { id: userId },
      data: { level: newLevel }
    });
    levelUp = true;
  }

  // Emit socket events
  const io = req.app.get('io');
  if (io) {
    io.to(`user:${userId}`).emit('session:completed', {
      sessionId: updatedSession.id,
      xpEarned,
      totalXP: user.xp,
      levelUp,
      newLevel: levelUp ? newLevel : user.level
    });

    // Emit campus activity update if user has university
    if (user.universityId) {
      io.to(`campus:${user.universityId}`).emit('campus:activity', {
        userId,
        userName: user.name,
        action: 'completed_session',
        duration: actualDuration,
        xpEarned
      });
    }
  }

  res.json({
    message: 'Study session completed',
    session: updatedSession,
    xpEarned,
    totalXP: user.xp,
    levelUp,
    newLevel: levelUp ? newLevel : user.level
  });
}));

// Get user's study session history
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

// Get study session analytics
router.get('/analytics', asyncHandler(async (req: any, res) => {
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

  // Calculate analytics
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

  // Daily breakdown for the period
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

  res.json({
    period,
    totalDuration,
    totalXP,
    sessionCount,
    averageDuration,
    subjectBreakdown,
    dailyBreakdown
  });
}));

// Get current active session
router.get('/active', asyncHandler(async (req: any, res) => {
  const userId = req.user.id;

  const activeSession = await prisma.studySession.findFirst({
    where: {
      userId,
      completed: false,
      endTime: null
    },
    select: {
      id: true,
      startTime: true,
      duration: true,
      subject: true,
      task: true
    }
  });

  if (!activeSession) {
    return res.json({ activeSession: null });
  }

  // Calculate elapsed time
  const elapsed = Math.round((Date.now() - activeSession.startTime.getTime()) / (1000 * 60));

  res.json({
    activeSession: {
      ...activeSession,
      elapsed,
      remaining: Math.max(0, activeSession.duration - elapsed)
    }
  });
}));

export default router;
