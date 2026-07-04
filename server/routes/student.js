// server/routes/student.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { requireAuth } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { createNotification } from '../services/notificationService.js';
import { generateApprovedOdPdf } from '../services/pdfGenerator.js';

const router = express.Router();
const prisma = new PrismaClient();

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
    cb(null, `brochure-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, JPEG, and PNG are allowed.'));
    }
  }
});

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
router.post('/request', requireAuth, roleGuard(['student']), upload.single('brochure'), async (req, res) => {
  try {
    const student = await getStudentProfile(req.user.id);
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    const { eventName, collegeName, eventDate, fromDate, toDate, reason } = req.body;

    // Validate Input
    if (!eventName || !collegeName || !eventDate || !fromDate || !toDate || !reason) {
      return res.status(400).json({ error: 'All fields are mandatory.' });
    }

    const eventDateParsed = new Date(eventDate);
    const fromDateParsed = new Date(fromDate);
    const toDateParsed = new Date(toDate);

    eventDateParsed.setHours(0, 0, 0, 0);
    fromDateParsed.setHours(0, 0, 0, 0);
    toDateParsed.setHours(0, 0, 0, 0);

    const minFromDate = new Date(eventDateParsed);
    minFromDate.setDate(minFromDate.getDate() - 2);
    minFromDate.setHours(0, 0, 0, 0);

    const maxToDate = new Date(eventDateParsed);
    maxToDate.setDate(maxToDate.getDate() + 3);
    maxToDate.setHours(0, 0, 0, 0);

    if (fromDateParsed > toDateParsed) {
      return res.status(400).json({
        error: 'Date Conflict: From Date cannot be later than To Date.'
      });
    }

    if (fromDateParsed < minFromDate) {
      return res.status(400).json({
        error: 'Date Conflict: From Date can be at most 2 days before the Main Event Date.'
      });
    }

    if (toDateParsed > maxToDate) {
      return res.status(400).json({
        error: 'Date Conflict: To Date can be at most 3 days after the Main Event Date.'
      });
    }

    if (eventDateParsed < fromDateParsed || eventDateParsed > toDateParsed) {
      return res.status(400).json({
        error: 'Date Conflict: Main Event Date must fall within the OD Permission From Date and To Date range.'
      });
    }

    // 2. Overlap Date Check (Prevent duplicate submissions for the same student on overlapping dates)
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

    // 3. Generate Reference Code (OD-YYYY-DEPT-XXXX)
    const currentYear = new Date().getFullYear();
    const deptCode = student.department.code;
    
    // Count total department requests this year
    const requestCount = await prisma.odRequest.count({
      where: {
        student: { deptId: student.deptId },
        createdAt: {
          gte: new Date(`${currentYear}-01-01`),
          lte: new Date(`${currentYear}-12-31`)
        }
      }
    });
    
    const countSuffix = String(requestCount + 1).padStart(4, '0');
    const odCode = `OD-${currentYear}-${deptCode}-${countSuffix}`;

    // 4. Set brochure URL
    let brochureUrl = '';
    if (req.file) {
      // Local server URL
      brochureUrl = `/uploads/${req.file.filename}`;
    }

    // 5. Create Request inside DB
    const newRequest = await prisma.odRequest.create({
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
        studentType: student.type,
        currentStage: 'mentor_pending',
        status: 'PENDING'
      }
    });

    // 6. Notify Mentor (Step 1)
    const mentor = await prisma.user.findUnique({
      where: { id: student.mentorId }
    });

    if (mentor) {
      await createNotification({
        userId: mentor.id,
        odId: newRequest.id,
        message: `New OD Request submitted by ${student.user.name} (${odCode}) for "${eventName}". Review required.`,
        emailTo: mentor.email,
        emailSubject: `KCET OD Portal: Review Required for ${odCode}`
      });
    }

    // 7. Notify Student of successful submission
    await createNotification({
      userId: student.userId,
      odId: newRequest.id,
      message: `Your OD Request (${odCode}) for "${eventName}" has been submitted successfully and is pending Mentor approval.`,
      emailTo: student.user.email,
      emailSubject: `OD Request Submitted: ${odCode}`
    });

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
