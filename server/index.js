// server/index.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from './lib/prisma.js';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import Route Handlers
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/student.js';
import staffRoutes from './routes/staff.js';
import adminRoutes from './routes/admin.js';
import notificationRoutes from './routes/notifications.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ESM Helpers for static directories
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware Configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '100kb' }));

// Serve static uploaded brochures from ./public/uploads
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// --- CORE API MOUNTING ---
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

/**
 * GET /api/public/verify/:odCode
 * PUBLIC verification endpoint. No login required.
 * Scanned from QR Code, confirms OD validity.
 */
const verifyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { verified: false, error: 'Too many requests, please try again later.' }
});

app.get('/api/public/verify/:odCode', verifyRateLimit, async (req, res) => {
  const { odCode } = req.params;

  try {
    const odRequest = await prisma.odRequest.findUnique({
      where: { odCode },
      include: {
        student: {
          include: {
            user: { select: { name: true } },
            department: { select: { id: true, name: true, code: true } }
          }
        },
        logs: {
          include: {
            approver: { select: { name: true, role: true } }
          },
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    if (!odRequest) {
      return res.status(404).json({ verified: false, error: 'Invalid OD Reference Code.' });
    }

    const mentorUser = odRequest.student?.mentorId
      ? await prisma.user.findUnique({ where: { id: odRequest.student.mentorId }, select: { name: true } })
      : null;

    const chairpersonUser = odRequest.student?.chairpersonId
      ? await prisma.user.findUnique({ where: { id: odRequest.student.chairpersonId }, select: { name: true } })
      : null;

    return res.json({
      verified: true,
      odCode: odRequest.odCode,
      studentName: odRequest.student.user.name,
      regNo: odRequest.student.regNo,
      year: odRequest.student.year,
      section: odRequest.student.section,
      department: odRequest.student.department.name,
      departmentCode: odRequest.student.department.code,
      eventName: odRequest.eventName,
      collegeName: odRequest.collegeName,
      fromDate: odRequest.fromDate,
      toDate: odRequest.toDate,
      status: odRequest.status,
      studentType: odRequest.studentType,
      currentStage: odRequest.currentStage,
      mentorName: mentorUser?.name || 'Unassigned',
      chairpersonName: chairpersonUser?.name || 'Unassigned',
      approvalLogs: odRequest.logs.map(l => ({
        approverName: l.approver.name,
        role: l.role,
        action: l.action,
        remarks: l.remarks,
        timestamp: l.timestamp
      }))
    });
  } catch (error) {
    console.error('Public Verification Error:', error);
    return res.status(500).json({ verified: false, error: 'Database verification failed.' });
  }
});

/**
 * ⏰ 48-Hour Pending Request Auto-Flagging Alert Worker
 * Scans DB for requests sitting in PENDING status for > 48 hours.
 */
async function checkStaleRequests() {
  console.log('[Worker] Checking for pending OD requests stale for > 48 hours...');
  try {
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

    const staleRequests = await prisma.odRequest.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: fortyEightHoursAgo }
      },
      include: {
        student: {
          include: { user: true }
        }
      }
    });

    if (staleRequests.length > 0) {
      console.warn(`[ALERT] Found ${staleRequests.length} stale pending requests!`);
      for (const req of staleRequests) {
        console.warn(` - Request ${req.odCode} for student ${req.student.user.name} is pending at stage: ${req.currentStage} since ${new Date(req.createdAt).toLocaleString()}`);
        
        // Auto-create alert notification for the current stage role or Admins
        const admins = await prisma.user.findMany({ where: { role: 'admin' } });
        for (const adm of admins) {
          // Check if notification already sent to avoid spamming
          const existingNotif = await prisma.notification.findFirst({
            where: {
              userId: adm.id,
              message: { startsWith: `[URGENT STALE ALERT] OD Request ${req.odCode}` }
            }
          });

          if (!existingNotif) {
            await prisma.notification.create({
              data: {
                userId: adm.id,
                odId: req.id,
                message: `[URGENT STALE ALERT] OD Request ${req.odCode} for student ${req.student.user.name} has been pending for over 48 hours at stage "${req.currentStage.toUpperCase()}".`
              }
            });
          }
        }
      }
    } else {
      console.log('[Worker] No stale pending requests found.');
    }
  } catch (error) {
    console.error('[Worker Error] Failed to scan stale requests:', error);
  }
}

// Run checks on server startup and then every 12 hours
checkStaleRequests();
setInterval(checkStaleRequests, 1000 * 60 * 60 * 12);

// Global Error Handlers
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err);
  // Optional: Add logic to restart gracefully using PM2 or similar
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 Kamaraj College of Engineering and Technology - OD Portal Server`);
  console.log(`🔥 Listening on PORT ${PORT}`);
  console.log(`=================================================`);
});
