// server/routes/auth.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../middleware/auth.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'tnec_od_approval_super_secret_jwt_sign_key_2026';

async function attachStudentNames(userProfile) {
  if (!userProfile?.student) return userProfile;

  if (userProfile.student.mentorId) {
    const mentor = await prisma.user.findUnique({
      where: { id: userProfile.student.mentorId },
      select: { name: true }
    });
    userProfile.student.mentorName = mentor?.name || 'Unassigned';
  }

  if (userProfile.student.chairpersonId) {
    const chairperson = await prisma.user.findUnique({
      where: { id: userProfile.student.chairpersonId },
      select: { name: true }
    });
    userProfile.student.chairpersonName = chairperson?.name || 'Unassigned';
  }

  return userProfile;
}

/**
 * POST /api/auth/login
 * Verifies email/password and returns a signed JWT.
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide both email and password.' });
  }

  try {
    // Fetch user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        department: true,
        student: {
          include: {
            department: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Verify Password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Sign JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        deptId: user.deptId
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Filter out password hash before sending user profile
    const { passwordHash, ...userProfile } = user;

    await attachStudentNames(userProfile);

    return res.json({
      token,
      user: userProfile
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ error: 'Internal Server Error.' });
  }
});

/**
 * GET /api/auth/me
 * Returns currently validated user profile.
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        department: true,
        student: {
          include: {
            department: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const { passwordHash, ...userProfile } = user;
    
    await attachStudentNames(userProfile);

    return res.json(userProfile);
  } catch (error) {
    console.error('Fetch Profile Error:', error);
    return res.status(500).json({ error: 'Internal Server Error.' });
  }
});

export default router;
