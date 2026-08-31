// server/routes/staff.js
import express from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { processApprovalStep } from '../services/approvalEngine.js';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { createNotification } from '../services/notificationService.js';

const router = express.Router();

const staffRoles = ['mentor', 'chairperson', 'hod'];

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
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, JPEG, PNG, and WEBP are allowed.'));
    }
  }
});

/**
 * GET /api/staff/queue
 * Returns pending requests for the logged-in staff member based on their role and department.
 */
router.get('/queue', requireAuth, roleGuard(staffRoles), async (req, res) => {
  const { id: staffId, role, deptId } = req.user;

  try {
    let whereClause = { status: 'PENDING' };

    if (role === 'mentor') {
      whereClause.currentStage = 'mentor_pending';
      whereClause.student = { mentorId: staffId };
    } else if (role === 'chairperson') {
      whereClause = {
        status: 'PENDING',
        OR: [
          {
            currentStage: 'chairperson_pending',
            student: {
              OR: [
                { chairpersonId: staffId },
                { chairpersonId: null, deptId }
              ]
            }
          },
          {
            currentStage: 'mentor_pending',
            student: { mentorId: staffId }
          }
        ]
      };
    } else if (role === 'hod') {
      whereClause = {
        status: 'PENDING',
        OR: [
          {
            currentStage: 'hod_pending',
            student: { deptId }
          },
          {
            currentStage: 'mentor_pending',
            student: { mentorId: staffId }
          }
        ]
      };
    } else {
      return res.status(403).json({ error: 'Unauthorized role queue access.' });
    }

    const pendingRequests = await prisma.odRequest.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
            department: true
          }
        },
        logs: {
          include: {
            approver: { select: { name: true } }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return res.json(pendingRequests);
  } catch (error) {
    console.error('Fetch Staff Queue Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve pending approval queue.' });
  }
});

/**
 * POST /api/staff/bulk-approve
 * Approve multiple OD requests at once.
 */
router.post('/bulk-approve', requireAuth, roleGuard(staffRoles), async (req, res) => {
  const { requestIds, remarks } = req.body;
  const approverId = req.user.id;

  if (!Array.isArray(requestIds) || requestIds.length === 0) {
    return res.status(400).json({ error: 'No requests selected.' });
  }

  try {
    const results = [];
    for (const odId of requestIds) {
      const odReq = await prisma.odRequest.findUnique({
        where: { id: odId },
        include: { student: true }
      });
      
      if (odReq && odReq.student && odReq.student.mentorId === approverId && odReq.currentStage === 'mentor_pending') {
        throw new Error('Mentee requests cannot be bulk approved at the mentor stage. Please evaluate them individually.');
      }

      const updated = await processApprovalStep(odId, approverId, 'APPROVED', remarks || 'Bulk Approved');
      results.push(updated);
    }
    return res.json({
      message: `${results.length} OD Requests approved and forwarded successfully.`,
      requests: results
    });
  } catch (error) {
    console.error('Bulk Approve Error:', error);
    return res.status(400).json({ error: error.message || 'Failed to process bulk approval.' });
  }
});

/**
 * POST /api/staff/approve/:id
 * Approve the OD request at the current stage.
 */
router.post('/approve/:id', requireAuth, roleGuard(staffRoles), async (req, res) => {
  const { remarks } = req.body;
  const odId = req.params.id;
  const approverId = req.user.id;

  try {
    const updatedRequest = await processApprovalStep(odId, approverId, 'APPROVED', remarks);
    return res.json({
      message: 'OD Request approved and forwarded successfully.',
      request: updatedRequest
    });
  } catch (error) {
    console.error('Approve Action Error:', error);
    return res.status(400).json({ error: error.message || 'Failed to process approval.' });
  }
});

/**
 * POST /api/staff/reject/:id
 * Reject the OD request. Requires rejection remarks.
 */
router.post('/reject/:id', requireAuth, roleGuard(staffRoles), async (req, res) => {
  const { remarks } = req.body;
  const odId = req.params.id;
  const approverId = req.user.id;

  if (!remarks || remarks.trim() === '') {
    return res.status(400).json({ error: 'Rejection remarks/reasons are mandatory.' });
  }

  try {
    const updatedRequest = await processApprovalStep(odId, approverId, 'REJECTED', remarks);
    return res.json({
      message: 'OD Request rejected successfully.',
      request: updatedRequest
    });
  } catch (error) {
    console.error('Reject Action Error:', error);
    return res.status(400).json({ error: error.message || 'Failed to process rejection.' });
  }
});

/**
 * GET /api/staff/history
 * Fetch past actions taken by this staff member.
 */
router.get('/history', requireAuth, roleGuard(staffRoles), async (req, res) => {
  const staffId = req.user.id;

  try {
    const pastLogs = await prisma.approvalLog.findMany({
      where: { approverId: staffId },
      include: {
        request: {
          include: {
            student: {
              include: {
                user: { select: { name: true } },
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
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    return res.json(pastLogs);
  } catch (error) {
    console.error('Fetch Staff History Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve approval history.' });
  }
});

/**
 * GET /api/staff/search-students
 * Search students by name or register number.
 */
router.get('/search-students', requireAuth, roleGuard(staffRoles), async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json([]);
  
  try {
    const students = await prisma.student.findMany({
      where: {
        OR: [
          { regNo: { contains: q } },
          { regNo: { contains: q.toLowerCase() } },
          { regNo: { contains: q.toUpperCase() } },
          { user: { name: { contains: q } } },
          { user: { name: { contains: q.toLowerCase() } } },
          { user: { name: { contains: q.toUpperCase() } } }
        ]
      },
      include: {
        user: { select: { name: true } },
        department: { select: { code: true } }
      },
      take: 10
    });
    return res.json(students);
  } catch (error) {
    console.error('Search Students Error:', error);
    return res.status(500).json({ error: 'Failed to search students.' });
  }
});

/**
 * POST /api/staff/apply-bulk-od
 * Staff applies OD for multiple students. Sent directly to HOD.
 */
router.post('/apply-bulk-od', requireAuth, roleGuard(staffRoles), upload.single('brochure'), async (req, res) => {
  try {
    const { studentIds, eventName, collegeName, eventDate, fromDate, toDate, reason } = req.body;
    let ids = [];
    if (typeof studentIds === 'string') {
      try { ids = JSON.parse(studentIds); } catch { ids = studentIds.split(',').map(s => s.trim()); }
    } else if (Array.isArray(studentIds)) {
      ids = studentIds;
    }

    if (!ids || ids.length === 0) {
      return res.status(400).json({ error: 'At least one student must be selected.' });
    }

    if (!eventName || !collegeName || !eventDate || !fromDate || !toDate || !reason) {
      return res.status(400).json({ error: 'All fields are mandatory.' });
    }

    const eventDateParsed = new Date(eventDate);
    const fromDateParsed = new Date(fromDate);
    const toDateParsed = new Date(toDate);
    eventDateParsed.setHours(0, 0, 0, 0);
    fromDateParsed.setHours(0, 0, 0, 0);
    toDateParsed.setHours(0, 0, 0, 0);

    let brochureUrl = '';
    if (req.file) {
      brochureUrl = `/uploads/${req.file.filename}`;
    }

    const currentYear = new Date().getFullYear();
    const createdRequests = [];

    // Process each student
    for (const sid of ids) {
      const student = await prisma.student.findUnique({
        where: { id: sid },
        include: { department: true, user: true }
      });
      if (!student) continue;

      let odCode = '';
      let retries = 3;
      let newRequest = null;
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
            odCode = `OD-${currentYear}-${student.department.code}-${countSuffix}`;

            return await tx.odRequest.create({
              data: {
                studentId: student.id,
                odCode,
                eventName,
                collegeName,
                eventDate: eventDateParsed,
                fromDate: fromDateParsed,
                toDate: toDateParsed,
                reason: `[Applied by Staff: ${req.user.name}] ` + reason,
                brochureUrl,
                studentType: student.type,
                currentStage: 'chairperson_pending', // direct to Chairperson
                status: 'PENDING',
                isStaffApplied: true
              }
            });
          });
          break;
        } catch (err) {
          if (err.code === 'P2002' && err.meta?.target?.includes('odCode')) {
            retries--;
            if (retries === 0) throw err;
          } else {
            throw err;
          }
        }
      }

      if (newRequest) {
        createdRequests.push(newRequest);
        // Notify Student
        await createNotification({
          userId: student.userId,
          odId: newRequest.id,
          message: `Your OD Request (${odCode}) for "${eventName}" has been applied by Staff (${req.user.name}) and is pending Chairperson approval.`,
          emailTo: student.user.email,
          emailSubject: `OD Request Submitted by Staff: ${odCode}`
        }).catch(() => {});
        
        // Notify Chairperson
        const chairperson = student.chairpersonId
          ? await prisma.user.findUnique({ where: { id: student.chairpersonId } })
          : await prisma.user.findFirst({ where: { role: 'chairperson', deptId: student.deptId } });
        if (chairperson) {
          await createNotification({
            userId: chairperson.id,
            odId: newRequest.id,
            message: `New OD Request applied by Staff pending your review: Student ${student.user.name} for ${odCode}.`,
            emailTo: chairperson.email,
            emailSubject: `KCET OD Request Pending: ${odCode}`
          }).catch(() => {});
        }
      }
    }

    return res.status(201).json({ message: 'Successfully applied OD for selected students.', requests: createdRequests });
  } catch (error) {
    console.error('Apply Bulk OD Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to apply bulk OD.' });
  }
});

/**
 * GET /api/staff/approved-ods
 * Fetch approved OD requests based on staff role and scope.
 */
router.get('/approved-ods', requireAuth, roleGuard(staffRoles), async (req, res) => {
  const { role, deptId } = req.user;

  try {
    let whereClause = { status: 'APPROVED' };

    if (['mentor', 'chairperson', 'hod'].includes(role)) {
      whereClause.student = { deptId };
    } else {
      return res.status(403).json({ error: 'Unauthorized approved OD log access.' });
    }

    const approvedOds = await prisma.odRequest.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
            department: true
          }
        },
        logs: {
          include: {
            approver: { select: { name: true } }
          },
          orderBy: { timestamp: 'asc' }
        }
      },
      orderBy: { toDate: 'desc' }
    });

    return res.json(approvedOds);
  } catch (error) {
    console.error('Fetch Approved ODs Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve approved ODs.' });
  }
});

export default router;
