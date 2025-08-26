import express from 'express';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const addFriendSchema = z.object({
  friendEmail: z.string().email()
});

const updateFriendshipSchema = z.object({
  status: z.enum(['accepted', 'rejected', 'blocked'])
});

// Get user's friends
router.get('/', asyncHandler(async (req: any, res) => {
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

// Get pending friend requests
router.get('/pending', asyncHandler(async (req: any, res) => {
  const userId = req.user.id;

  const pendingRequests = await prisma.friendship.findMany({
    where: {
      friendId: userId,
      status: 'pending'
    },
    include: {
      user: {
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
          }
        }
      }
    }
  });

  res.json({ pendingRequests });
}));

// Get sent friend requests
router.get('/sent', asyncHandler(async (req: any, res) => {
  const userId = req.user.id;

  const sentRequests = await prisma.friendship.findMany({
    where: {
      userId,
      status: 'pending'
    },
    include: {
      friend: {
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
          }
        }
      }
    }
  });

  res.json({ sentRequests });
}));

// Add friend by email
router.post('/add', asyncHandler(async (req: any, res) => {
  const userId = req.user.id;
  const { friendEmail } = addFriendSchema.parse(req.body);

  // Check if trying to add self
  if (friendEmail === req.user.email) {
    throw createError('Cannot add yourself as a friend', 400);
  }

  // Find friend by email
  const friend = await prisma.user.findUnique({
    where: { email: friendEmail }
  });

  if (!friend) {
    throw createError('User not found', 404);
  }

  // Check if friendship already exists
  const existingFriendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userId, friendId: friend.id },
        { userId: friend.id, friendId: userId }
      ]
    }
  });

  if (existingFriendship) {
    if (existingFriendship.status === 'accepted') {
      throw createError('Already friends with this user', 409);
    } else if (existingFriendship.status === 'pending') {
      if (existingFriendship.userId === userId) {
        throw createError('Friend request already sent', 409);
      } else {
        throw createError('Friend request already received', 409);
      }
    } else if (existingFriendship.status === 'blocked') {
      throw createError('Cannot add blocked user', 403);
    }
  }

  // Create friendship request
  const friendship = await prisma.friendship.create({
    data: {
      userId,
      friendId: friend.id,
      status: 'pending'
    },
    include: {
      friend: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          email: true
        }
      }
    }
  });

  // Emit socket event to notify friend
  const io = req.app.get('io');
  if (io) {
    io.to(`user:${friend.id}`).emit('friend:request_received', {
      friendshipId: friendship.id,
      user: {
        id: req.user.id,
        name: req.user.name,
        avatarUrl: req.user.avatarUrl
      }
    });
  }

  res.status(201).json({
    message: 'Friend request sent',
    friendship
  });
}));

// Accept friend request
router.put('/:friendshipId/accept', asyncHandler(async (req: any, res) => {
  const { friendshipId } = req.params;
  const userId = req.user.id;

  const friendship = await prisma.friendship.findFirst({
    where: {
      id: friendshipId,
      friendId: userId,
      status: 'pending'
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

  if (!friendship) {
    throw createError('Friend request not found', 404);
  }

  // Accept the request
  const updatedFriendship = await prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: 'accepted' }
  });

  // Emit socket events
  const io = req.app.get('io');
  if (io) {
    // Notify the user who sent the request
    io.to(`user:${friendship.userId}`).emit('friend:request_accepted', {
      friendshipId,
      user: {
        id: userId,
        name: req.user.name,
        avatarUrl: req.user.avatarUrl
      }
    });

    // Notify the user who accepted
    io.to(`user:${userId}`).emit('friend:request_accepted', {
      friendshipId,
      user: friendship.user
    });
  }

  res.json({
    message: 'Friend request accepted',
    friendship: updatedFriendship
  });
}));

// Reject friend request
router.put('/:friendshipId/reject', asyncHandler(async (req: any, res) => {
  const { friendshipId } = req.params;
  const userId = req.user.id;

  const friendship = await prisma.friendship.findFirst({
    where: {
      id: friendshipId,
      friendId: userId,
      status: 'pending'
    },
    include: {
      user: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  if (!friendship) {
    throw createError('Friend request not found', 404);
  }

  // Delete the friendship
  await prisma.friendship.delete({
    where: { id: friendshipId }
  });

  // Emit socket event
  const io = req.app.get('io');
  if (io) {
    io.to(`user:${friendship.userId}`).emit('friend:request_rejected', {
      friendshipId,
      user: {
        id: userId,
        name: req.user.name
      }
    });
  }

  res.json({
    message: 'Friend request rejected'
  });
}));

// Remove friend
router.delete('/:friendshipId', asyncHandler(async (req: any, res) => {
  const { friendshipId } = req.params;
  const userId = req.user.id;

  const friendship = await prisma.friendship.findFirst({
    where: {
      id: friendshipId,
      OR: [
        { userId, status: 'accepted' },
        { friendId: userId, status: 'accepted' }
      ]
    },
    include: {
      user: {
        select: { id: true, name: true }
      },
      friend: {
        select: { id: true, name: true }
      }
    }
  });

  if (!friendship) {
    throw createError('Friendship not found', 404);
  }

  const friendId = friendship.userId === userId ? friendship.friendId : friendship.userId;

  // Delete the friendship
  await prisma.friendship.delete({
    where: { id: friendshipId }
  });

  // Emit socket event
  const io = req.app.get('io');
  if (io) {
    io.to(`user:${friendId}`).emit('friend:removed', {
      friendshipId,
      user: {
        id: userId,
        name: req.user.name
      }
    });
  }

  res.json({
    message: 'Friend removed successfully'
  });
}));

// Block user
router.put('/:friendshipId/block', asyncHandler(async (req: any, res) => {
  const { friendshipId } = req.params;
  const userId = req.user.id;

  const friendship = await prisma.friendship.findFirst({
    where: {
      id: friendshipId,
      OR: [
        { userId },
        { friendId: userId }
      ]
    }
  });

  if (!friendship) {
    throw createError('Friendship not found', 404);
  }

  // Update status to blocked
  const updatedFriendship = await prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: 'blocked' }
  });

  res.json({
    message: 'User blocked successfully',
    friendship: updatedFriendship
  });
}));

// Search users to add as friends
router.get('/search', asyncHandler(async (req: any, res) => {
  const userId = req.user.id;
  const { query, limit = 10 } = req.query;

  if (!query || (query as string).length < 2) {
    throw createError('Search query must be at least 2 characters', 400);
  }

  // Search users by name or email
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: query as string, mode: 'insensitive' } },
        { email: { contains: query as string, mode: 'insensitive' } }
      ],
      NOT: { id: userId }
    },
    select: {
      id: true,
      name: true,
      email: true,
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
      }
    },
    take: parseInt(limit as string)
  });

  // Check friendship status for each user
  const usersWithStatus = await Promise.all(
    users.map(async (user) => {
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { userId, friendId: user.id },
            { userId: user.id, friendId: userId }
          ]
        },
        select: { status: true }
      });

      return {
        ...user,
        friendshipStatus: friendship?.status || 'none'
      };
    })
  );

  res.json({ users: usersWithStatus });
}));

export default router;
