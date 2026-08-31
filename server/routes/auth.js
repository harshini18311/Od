// server/routes/auth.js
import express from 'express';
import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { requireAuth } from '../middleware/auth.js';
import { sendEmail } from '../services/notificationService.js';

import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET environment variable is not defined.');
}

const staffRoles = ['mentor', 'chairperson', 'hod'];

function normalizeEmailLookup(value) {
  return String(value ?? '').trim();
}

async function findUserByEmail(email) {
  const lookup = normalizeEmailLookup(email);

  return prisma.user.findFirst({
    where: {
      OR: [
        { email: lookup },
        { email: lookup.toUpperCase() },
        { email: lookup.toLowerCase() }
      ]
    },
    include: {
      department: true,
      student: {
        include: {
          department: true
        }
      }
    }
  });
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function maskEmail(email) {
  const [localPart = '', domainPart = ''] = String(email ?? '').split('@');
  if (!domainPart) {
    return email;
  }

  return `${localPart.slice(0, 2)}***@${domainPart}`;
}

async function sendPasswordResetOtp(user, otp) {
  await sendEmail({
    to: user.recoveryEmail,
    subject: 'KCET OD Portal - Staff Password Reset OTP',
    text: `Your OTP for resetting your OD portal password is ${otp}. It will expire in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px; background: #F8FAFC; color: #0F172A; border-radius: 10px;">
        <h2 style="margin: 0 0 12px; font-size: 20px;">KCET OD Portal</h2>
        <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6;">Use the OTP below to reset your staff password.</p>
        <div style="font-size: 28px; font-weight: 700; letter-spacing: 0.2em; background: #FFFFFF; border: 1px solid #E2E8F0; padding: 14px 18px; border-radius: 10px; display: inline-block;">${otp}</div>
        <p style="margin: 16px 0 0; font-size: 12px; color: #475569;">This code expires in 10 minutes. If you did not request this, ignore this email.</p>
      </div>
    `
  });
}

async function storeResetOtp(userId, otp) {
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.passwordResetOtp.upsert({
    where: { userId },
    update: {
      otpHash,
      attempts: 0,
      requestedAt: new Date(),
      expiresAt,
      verifiedAt: null
    },
    create: {
      userId,
      otpHash,
      attempts: 0,
      expiresAt
    }
  });
}

async function verifyResetOtpRecord(userId, otp) {
  const otpRecord = await prisma.passwordResetOtp.findUnique({ where: { userId } });

  if (!otpRecord) {
    return { ok: false, error: 'Please request a new OTP first.' };
  }

  if (otpRecord.expiresAt < new Date()) {
    await prisma.passwordResetOtp.delete({ where: { userId } });
    return { ok: false, error: 'OTP has expired. Please request a new OTP.' };
  }

  if (otpRecord.attempts >= 5) {
    await prisma.passwordResetOtp.delete({ where: { userId } });
    return { ok: false, error: 'Too many invalid attempts. Please request a new OTP.' };
  }

  const isValid = await bcrypt.compare(otp, otpRecord.otpHash);
  if (!isValid) {
    await prisma.passwordResetOtp.update({
      where: { userId },
      data: { attempts: otpRecord.attempts + 1 }
    });
    return { ok: false, error: 'Invalid OTP.' };
  }

  await prisma.passwordResetOtp.update({
    where: { userId },
    data: {
      verifiedAt: new Date(),
      attempts: 0
    }
  });

  return { ok: true };
}

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
  let { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide both email and password.' });
  }

  email = email.trim();

  try {
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Verify Password
    let passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch && user.role === 'student') {
      passwordMatch = await bcrypt.compare(password.toUpperCase(), user.passwordHash);
    }
    
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

router.post('/staff/password-reset/request', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Please provide your login email.' });
  }

  try {
    const user = await findUserByEmail(email);

    if (!user || !staffRoles.includes(user.role)) {
      return res.status(404).json({ error: 'Staff account not found.' });
    }

    if (!user.recoveryEmail) {
      return res.status(400).json({ error: 'No official mail address is configured for this account.' });
    }

    const otp = generateOtp();
    await storeResetOtp(user.id, otp);
    await sendPasswordResetOtp(user, otp);

    return res.json({
      message: 'OTP sent to the registered official mail address.',
      email: maskEmail(user.recoveryEmail)
    });
  } catch (error) {
    console.error('Password Reset OTP Request Error:', error);
    return res.status(500).json({ error: 'Unable to send OTP right now.' });
  }
});

router.post('/staff/password-reset/verify', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Please provide your email and OTP.' });
  }

  try {
    const user = await findUserByEmail(email);

    if (!user || !staffRoles.includes(user.role)) {
      return res.status(404).json({ error: 'Staff account not found.' });
    }

    const result = await verifyResetOtpRecord(user.id, String(otp).trim());
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({ message: 'OTP verified successfully.' });
  } catch (error) {
    console.error('Password Reset OTP Verify Error:', error);
    return res.status(500).json({ error: 'Unable to verify OTP right now.' });
  }
});

router.post('/staff/password-reset/complete', async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Please provide your email and new password.' });
  }

  if (String(newPassword).trim().length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  try {
    const user = await findUserByEmail(email);

    if (!user || !staffRoles.includes(user.role)) {
      return res.status(404).json({ error: 'Staff account not found.' });
    }

    const otpRecord = await prisma.passwordResetOtp.findUnique({ where: { userId: user.id } });
    if (!otpRecord || !otpRecord.verifiedAt) {
      return res.status(400).json({ error: 'Please verify the OTP before resetting your password.' });
    }

    if (otpRecord.expiresAt < new Date()) {
      await prisma.passwordResetOtp.delete({ where: { userId: user.id } });
      return res.status(400).json({ error: 'OTP has expired. Please request a new OTP.' });
    }

    const passwordHash = await bcrypt.hash(String(newPassword), 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    await prisma.passwordResetOtp.delete({ where: { userId: user.id } });

    return res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Password Reset Completion Error:', error);
    return res.status(500).json({ error: 'Unable to update password right now.' });
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
