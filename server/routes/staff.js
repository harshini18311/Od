// server/routes/staff.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';
import { processApprovalStep } from '../services/approvalEngine.js';

const router = express.Router();
const prisma = new PrismaClient();

const staffRoles = ['mentor', 'chairperson', 'hod', 'principal'];

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
      whereClause.currentStage = 'chairperson_pending';
      whereClause.student = { chairpersonId: staffId };
    } else if (role === 'hod') {
      whereClause.currentStage = 'hod_pending';
      whereClause.student = { deptId };
    } else if (role === 'principal') {
      whereClause.currentStage = 'principal_pending';
      // Principal is college-wide, sees all principal_pending
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
        logs: true
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

export default router;
