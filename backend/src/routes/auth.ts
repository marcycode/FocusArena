import express from 'express';
import passport from 'passport';
import { PrismaClient } from '@prisma/client';
import { generateTokens, verifyRefreshToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Google OAuth Strategy Setup
passport.use(new (await import('passport-google-oauth20')).Strategy({
  clientID: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  callbackURL: process.env.GOOGLE_CALLBACK_URL!,
  scope: ['profile', 'email']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const { id, displayName, emails } = profile;
    const email = emails?.[0]?.value;

    if (!email) {
      return done(new Error('Email not provided by Google'), null);
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          name: displayName,
          avatarUrl: profile.photos?.[0]?.value,
          xp: 0,
          level: 1,
          streakCount: 0,
          totalStudyHours: 0
        }
      });
    } else {
      // Update existing user's Google info
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: displayName,
          avatarUrl: profile.photos?.[0]?.value
        }
      });
    }

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  asyncHandler(async (req: any, res) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication failed' });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id);

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    // Redirect to frontend with tokens
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
    
    res.redirect(redirectUrl);
  })
);

// Get current user
router.get('/me', asyncHandler(async (req: any, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
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

  res.json(user);
}));

// Refresh access token
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  const { valid, userId } = verifyRefreshToken(refreshToken);

  if (!valid || !userId) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }

  // Verify token exists in database
  const storedToken = await prisma.refreshToken.findFirst({
    where: {
      userId,
      token: refreshToken,
      expiresAt: { gt: new Date() }
    }
  });

  if (!storedToken) {
    return res.status(401).json({ error: 'Refresh token expired or invalid' });
  }

  // Generate new tokens
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(userId);

  // Update refresh token in database
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: {
      token: newRefreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });

  res.json({
    accessToken,
    refreshToken: newRefreshToken
  });
}));

// Logout
router.post('/logout', asyncHandler(async (req: any, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    // Invalidate refresh token
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken }
    });
  }

  res.json({ message: 'Logged out successfully' });
}));

export default router;
