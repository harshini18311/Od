// server/routes/student.js
import express from 'express';
import prisma from '../lib/prisma.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { createNotification } from '../services/notificationService.js';
import { generateApprovedOdPdf } from '../services/pdfGenerator.js';

const router = express.Router();

// Ensure public upload folder exists
const uploadDir = './public/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // Prefix filename by field type for clarity
    const prefix = file.fieldname === 'photoProof' ? 'photo-proof' : 'brochure';
    cb(null, `${prefix}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, JPEG, PNG, and WEBP are allowed.'));
    }
  }
});

// Accept both brochure (External OD) and photoProof (Internal OD) as separate fields
const uploadFields = upload.fields([
  { name: 'brochure', maxCount: 1 },
  { name: 'photoProof', maxCount: 1 }
]);

// Helper to get student by User ID
async function getStudentProfile(userId) {
  return await prisma.student.findUnique({
    where: { userId },
    include: {
      user: true,
      department: true
    }
  });
}

async function attachStudentNames(student) {
  if (!student) return student;

  if (student.mentorId) {
    const mentor = await prisma.user.findUnique({
      where: { id: student.mentorId },
      select: { name: true }
    });
    student.mentorName = mentor?.name || 'Unassigned';
  }

  if (student.chairpersonId) {
    const chairperson = await prisma.user.findUnique({
      where: { id: student.chairpersonId },
      select: { name: true }
    });
    student.chairpersonName = chairperson?.name || 'Unassigned';
  }

  return student;
}

/**
 * GET /api/student/dashboard
 * Fetch statistics and recent OD requests.
 */
router.get('/dashboard', requireAuth, roleGuard(['student']), async (req, res) => {
  try {
    const student = await getStudentProfile(req.user.id);
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    await attachStudentNames(student);

    const requests = await prisma.odRequest.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' }
    });

    const stats = {
      total: requests.length,
      approved: requests.filter(r => r.status === 'APPROVED').length,
      pending: requests.filter(r => r.status === 'PENDING').length,
      rejected: requests.filter(r => r.status === 'REJECTED').length
    };

    return res.json({
      student,
      stats,
      recentRequests: requests.slice(0, 5)
    });
  } catch (error) {
    console.error('Fetch Dashboard Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve dashboard statistics.' });
  }
});

/**
 * GET /api/student/requests
 * Fetch all OD requests of the student.
 */
router.get('/requests', requireAuth, roleGuard(['student']), async (req, res) => {
  try {
    const student = await getStudentProfile(req.user.id);
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    await attachStudentNames(student);

    const requests = await prisma.odRequest.findMany({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(requests);
  } catch (error) {
    console.error('Fetch Requests Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve OD requests.' });
  }
});

/**
 * POST /api/student/request
 * Submit a new OD request.
 */
router.post('/request', requireAuth, roleGuard(['student']), uploadFields, async (req, res) => {
  try {
    const student = await getStudentProfile(req.user.id);
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    const { odType, reason } = req.body;

    // --- Validate odType ---
    if (!odType || !['INTERNAL', 'EXTERNAL'].includes(odType)) {
      return res.status(400).json({ error: 'OD Type is required and must be INTERNAL or EXTERNAL.' });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'Reason/Purpose is mandatory.' });
    }
    if (reason.length > 1000) {
      return res.status(400).json({ error: 'Reason must be less than 1000 characters.' });
    }

    let eventName, collegeName, eventDateParsed, fromDateParsed, toDateParsed;
    let brochureUrl = null;
    let photoProofUrl = null;
    let fromPeriod = null;
    let toPeriod = null;

    if (odType === 'EXTERNAL') {
      // ----------------------------------------------------------------
      // EXTERNAL OD — existing validation, unchanged
      // ----------------------------------------------------------------
      const { eventName: en, collegeName: cn, eventDate, fromDate, toDate } = req.body;

      if (!en || !cn || !eventDate || !fromDate || !toDate) {
        return res.status(400).json({ error: 'All fields are mandatory for External OD.' });
      }

      eventName = en;
      collegeName = cn;

      eventDateParsed = new Date(eventDate);
      fromDateParsed = new Date(fromDate);
      toDateParsed = new Date(toDate);
      eventDateParsed.setHours(0, 0, 0, 0);
      fromDateParsed.setHours(0, 0, 0, 0);
      toDateParsed.setHours(0, 0, 0, 0);

      const todayServer = new Date();
      todayServer.setHours(0, 0, 0, 0);
      if (eventDateParsed < todayServer) {
        return res.status(400).json({ error: 'Event date cannot be in the past.' });
      }

      const minFromDate = new Date(eventDateParsed);
      minFromDate.setDate(minFromDate.getDate() - 2);
      minFromDate.setHours(0, 0, 0, 0);

      const maxToDate = new Date(eventDateParsed);
      maxToDate.setDate(maxToDate.getDate() + 3);
      maxToDate.setHours(0, 0, 0, 0);

      if (fromDateParsed > toDateParsed) {
        return res.status(400).json({ error: 'Date Conflict: From Date cannot be later than To Date.' });
      }
      if (fromDateParsed < minFromDate) {
        return res.status(400).json({ error: 'Date Conflict: From Date can be at most 2 days before the Main Event Date.' });
      }
      if (toDateParsed > maxToDate) {
        return res.status(400).json({ error: 'Date Conflict: To Date can be at most 3 days after the Main Event Date.' });
      }
      if (eventDateParsed < fromDateParsed || eventDateParsed > toDateParsed) {
        return res.status(400).json({ error: 'Date Conflict: Main Event Date must fall within the OD Permission From Date and To Date range.' });
      }

      // Optional brochure for External OD
      if (req.files?.brochure?.[0]) {
        brochureUrl = `/uploads/${req.files.brochure[0].filename}`;
      }

    } else {
      // ----------------------------------------------------------------
      // INTERNAL OD — period-based validation
      // ----------------------------------------------------------------
      const { internalDate, fromPeriod: fp, toPeriod: tp } = req.body;

      if (!internalDate) {
        return res.status(400).json({ error: 'Date is required for Internal OD.' });
      }

      const internalDateParsed = new Date(internalDate);
      internalDateParsed.setHours(0, 0, 0, 0);
      const todayInternal = new Date();
      todayInternal.setHours(0, 0, 0, 0);
      if (internalDateParsed < todayInternal) {
        return res.status(400).json({ error: 'Activity date cannot be in the past.' });
      }

      fromPeriod = parseInt(fp, 10);
      toPeriod = parseInt(tp, 10);

      if (!fp || isNaN(fromPeriod) || fromPeriod < 1 || fromPeriod > 8) {
        return res.status(400).json({ error: 'From Period must be a value between 1 and 8.' });
      }
      if (!tp || isNaN(toPeriod) || toPeriod < 1 || toPeriod > 8) {
        return res.status(400).json({ error: 'To Period must be a value between 1 and 8.' });
      }
      if (toPeriod < fromPeriod) {
        return res.status(400).json({ error: 'To Period must be greater than or equal to From Period.' });
      }

      // Photo proof is MANDATORY for Internal OD
      if (!req.files?.photoProof?.[0]) {
        return res.status(400).json({ error: 'Photo Proof is mandatory for Internal OD.' });
      }
      photoProofUrl = `/uploads/${req.files.photoProof[0].filename}`;

      // Auto-fill event fields for Internal OD
      eventName = 'Internal Activity';
      collegeName = 'KCET';

      // Store the single activity date as both event/from/to date
      eventDateParsed = new Date(internalDate);
      fromDateParsed = new Date(internalDate);
      toDateParsed = new Date(internalDate);
      eventDateParsed.setHours(0, 0, 0, 0);
      fromDateParsed.setHours(0, 0, 0, 0);
      toDateParsed.setHours(0, 0, 0, 0);
    }

    // --- Overlap Date Check (same for both types) ---
    const overlappingRequest = await prisma.odRequest.findFirst({
      where: {
        studentId: student.id,
        status: { not: 'REJECTED' },
        OR: [
          {
            fromDate: { lte: toDateParsed },
            toDate: { gte: fromDateParsed }
          }
        ]
      }
    });

    if (overlappingRequest) {
      return res.status(400).json({
        error: `Date Conflict: You already have a pending or approved OD request overlapping with these dates (${overlappingRequest.odCode}).`
      });
    }

    let newRequest = null;
    let odCode = '';
    const currentYear = new Date().getFullYear();
    const deptCode = student.department.code;

    // Wrap OD Code generation and creation in a retry loop to prevent race conditions
    let retries = 3;
    while (retries > 0) {
      try {
        newRequest = await prisma.$transaction(async (tx) => {
          const requestCount = await tx.odRequest.count({
            where: {
              student: { deptId: student.deptId },
              createdAt: {
                gte: new Date(`${currentYear}-01-01`),
                lte: new Date(`${currentYear}-12-31`)
              }
            }
          });

          const countSuffix = String(requestCount + 1).padStart(4, '0');
          odCode = `OD-${currentYear}-${deptCode}-${countSuffix}`;

          return await tx.odRequest.create({
            data: {
              studentId: student.id,
              odCode,
              eventName,
              collegeName,
              eventDate: eventDateParsed,
              fromDate: fromDateParsed,
              toDate: toDateParsed,
              reason,
              brochureUrl,
              odType,
              fromPeriod,
              toPeriod,
              photoProofUrl,
              studentType: student.type,
              currentStage: odType === 'INTERNAL' ? 'chairperson_pending' : 'mentor_pending',
              status: 'PENDING'
            }
          });
        });
        break;
      } catch (err) {
        if (err.code === 'P2002' && err.meta?.target?.includes('odCode')) {
          retries--;
          if (retries === 0) {
            throw new Error('Failed to generate unique OD Reference Code after multiple attempts. Please try again.');
          }
        } else {
          throw err;
        }
      }
    }

    const odTypeLabel = odType === 'INTERNAL' ? 'Internal' : 'External';
    const activityLabel = odType === 'INTERNAL'
      ? `Internal Activity on ${fromDateParsed.toLocaleDateString('en-IN')} (Periods ${fromPeriod}–${toPeriod})`
      : eventName;

    if (odType === 'INTERNAL') {
      const chairperson = student.chairpersonId
        ? await prisma.user.findUnique({ where: { id: student.chairpersonId } })
        : await prisma.user.findFirst({ where: { role: 'chairperson', deptId: student.deptId } });
      if (chairperson) {
        await createNotification({
          userId: chairperson.id,
          odId: newRequest.id,
          message: `New ${odTypeLabel} OD Request submitted by ${student.user.name} (${odCode}) for "${activityLabel}". Review required.`,
          emailTo: chairperson.email,
          emailSubject: `KCET OD Portal: Review Required for ${odCode}`
        });
      }

      await createNotification({
        userId: student.userId,
        odId: newRequest.id,
        message: `Your ${odTypeLabel} OD Request (${odCode}) has been submitted successfully and is pending Chairperson approval.`,
        emailTo: student.user.email,
        emailSubject: `OD Request Submitted: ${odCode}`
      });
    } else {
      // Notify Mentor (Step 1)
      const mentor = await prisma.user.findUnique({ where: { id: student.mentorId } });
      if (mentor) {
        await createNotification({
          userId: mentor.id,
          odId: newRequest.id,
          message: `New ${odTypeLabel} OD Request submitted by ${student.user.name} (${odCode}) for "${activityLabel}". Review required.`,
          emailTo: mentor.email,
          emailSubject: `KCET OD Portal: Review Required for ${odCode}`
        });
      }

      // Notify Student of successful submission
      await createNotification({
        userId: student.userId,
        odId: newRequest.id,
        message: `Your ${odTypeLabel} OD Request (${odCode}) has been submitted successfully and is pending Mentor approval.`,
        emailTo: student.user.email,
        emailSubject: `OD Request Submitted: ${odCode}`
      });
    }

    return res.status(201).json(newRequest);
  } catch (error) {
    console.error('Submit Request Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to submit OD request.' });
  }
});

/**
 * GET /api/student/request/:id
 * Retrieve a single request details along with logs.
 */
router.get('/request/:id', requireAuth, async (req, res) => {
  try {
    const request = await prisma.odRequest.findUnique({
      where: { id: req.params.id },
      include: {
        student: {
          include: {
            user: {
              select: { name: true, email: true }
            },
            department: true
          }
        },
        logs: {
          include: {
            approver: {
              select: { name: true, role: true }
            }
          },
          orderBy: { timestamp: 'asc' }
        }
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'OD Request not found.' });
    }

    // Security Check: Only the student or a staff member/admin can view it
    if (req.user.role === 'student') {
      const student = await getStudentProfile(req.user.id);
      if (request.studentId !== student.id) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    } else if (req.user.role !== 'admin') {
      if (req.user.role === 'mentor' && request.student.mentorId !== req.user.id) {
        return res.status(403).json({ error: "Access denied. You are not this student's mentor." });
      }
      if (req.user.role === 'chairperson' && request.student.chairpersonId !== req.user.id) {
        return res.status(403).json({ error: "Access denied. You are not this student's chairperson." });
      }
      if (req.user.role === 'hod' && request.student.deptId !== req.user.deptId) {
        return res.status(403).json({ error: "Access denied. You are not in this student's department." });
      }
    }

    // Add Mentor Name to profile info dynamically
    const mentorUser = request.student.mentorId
      ? await prisma.user.findUnique({ where: { id: request.student.mentorId }, select: { name: true } })
      : null;
    const chairpersonUser = request.student.chairpersonId
      ? await prisma.user.findUnique({ where: { id: request.student.chairpersonId }, select: { name: true } })
      : null;

    const responseData = {
      ...request,
      mentorName: mentorUser ? mentorUser.name : 'Unassigned',
      chairpersonName: chairpersonUser ? chairpersonUser.name : 'Unassigned'
    };

    return res.json(responseData);
  } catch (error) {
    console.error('Fetch Single Request Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve OD request details.' });
  }
});

/**
 * GET /api/student/request/:id/pdf
 * Generate and stream certified approval letter PDF.
 */
router.get('/request/:id/pdf', requireAuth, async (req, res) => {
  try {
    const request = await prisma.odRequest.findUnique({
      where: { id: req.params.id },
      include: {
        student: {
          include: {
            user: true,
            department: true
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

    if (!request) {
      return res.status(404).json({ error: 'OD Request not found.' });
    }

    if (request.status !== 'APPROVED') {
      return res.status(400).json({ error: 'PDF can only be generated for fully APPROVED OD requests.' });
    }

    // Security Check: Only the requesting student or staff/admin can download it
    if (req.user.role === 'student') {
      const student = await getStudentProfile(req.user.id);
      if (request.studentId !== student.id) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    } else if (req.user.role !== 'admin') {
      if (req.user.role === 'mentor' && request.student.mentorId !== req.user.id) {
        return res.status(403).json({ error: "Access denied. You are not this student's mentor." });
      }
      if (req.user.role === 'chairperson' && request.student.chairpersonId !== req.user.id) {
        return res.status(403).json({ error: "Access denied. You are not this student's chairperson." });
      }
      if (req.user.role === 'hod' && request.student.deptId !== req.user.deptId) {
        return res.status(403).json({ error: "Access denied. You are not in this student's department." });
      }
    }

    const pdfBuffer = await generateApprovedOdPdf(request);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="OD-LETTER-${request.odCode}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    return res.status(500).json({ error: 'Failed to generate OD PDF letter.' });
  }
});

export default router;
