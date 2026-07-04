// server/routes/admin.js
import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../middleware/auth.js';
import { roleGuard } from '../middleware/roleGuard.js';

const router = express.Router();
const prisma = new PrismaClient();

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

// Ensure admin only accesses these endpoints
const adminGuard = [requireAuth, roleGuard(['admin'])];

/**
 * GET /api/admin/users
 * Returns all users in the system with departments and student details.
 */
router.get('/users', ...adminGuard, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        department: true,
        student: {
          include: {
            department: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Strip password hashes
    const sanitizedUsers = users.map(u => {
      const { passwordHash, ...rest } = u;
      return rest;
    });

    return res.json(sanitizedUsers);
  } catch (error) {
    console.error('Admin Fetch Users Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve users.' });
  }
});

/**
 * POST /api/admin/users
 * Create a new user (and student profile if applicable)
 */
router.post('/users', ...adminGuard, async (req, res) => {
  const { name, email, password, role, deptId, regNo, year, section, type, mentorId, chairpersonId } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required.' });
  }

  try {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role,
          deptId: deptId || null
        }
      });

      if (role === 'student') {
        if (!regNo || !year || !section || !type || !mentorId || !deptId) {
          throw new Error('All student specific fields (RegNo, Year, Section, Scholar Type, Department, Mentor) are required for student accounts.');
        }

        // Check RegNo unique
        const existingStudent = await tx.student.findUnique({ where: { regNo } });
        if (existingStudent) {
          throw new Error('A student with this Registration Number already exists.');
        }

        await tx.student.create({
          data: {
            userId: u.id,
            regNo,
            year: parseInt(year),
            section,
            type, // DAY_SCHOLAR or HOSTELLER
            mentorId,
            chairpersonId: chairpersonId || undefined,
            deptId
          }
        });
      }

      return u;
    });

    const { passwordHash: _, ...sanitized } = newUser;
    return res.status(201).json(sanitized);
  } catch (error) {
    console.error('Admin Create User Error:', error);
    return res.status(400).json({ error: error.message || 'Failed to create user.' });
  }
});

/**
 * PUT /api/admin/users/:id
 * Edit user profile or roles
 */
router.put('/users/:id', ...adminGuard, async (req, res) => {
  const userId = req.params.id;
  const { name, email, role, deptId, regNo, year, section, type, mentorId, chairpersonId, password } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { student: true }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const updateData = {
      name: name || existingUser.name,
      email: email || existingUser.email,
      role: role || existingUser.role,
      deptId: deptId !== undefined ? deptId : existingUser.deptId
    };

    if (password && password.trim() !== '') {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: updateData
      });

      if (updatedUser.role === 'student') {
        if (regNo || year || section || type || mentorId || chairpersonId || deptId) {
          const studentData = {
            regNo: regNo || undefined,
            year: year ? parseInt(year) : undefined,
            section: section || undefined,
            type: type || undefined,
            mentorId: mentorId || undefined,
            chairpersonId: chairpersonId || undefined,
            deptId: deptId || undefined
          };

          // Check if student profile exists, if not create, else update
          if (existingUser.student) {
            await tx.student.update({
              where: { userId },
              data: studentData
            });
          } else {
            await tx.student.create({
              data: {
                userId,
                regNo: regNo || '',
                year: parseInt(year) || 1,
                section: section || 'A',
                type: type || 'DAY_SCHOLAR',
                mentorId: mentorId || '',
                chairpersonId: chairpersonId || undefined,
                deptId: deptId || ''
              }
            });
          }
        }
      } else {
        // If role changed from student to staff, delete student profile
        if (existingUser.student) {
          await tx.student.delete({ where: { userId } });
        }
      }
    });

    return res.json({ message: 'User updated successfully.' });
  } catch (error) {
    console.error('Admin Update User Error:', error);
    return res.status(400).json({ error: error.message || 'Failed to update user.' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user from the system
 */
router.delete('/users/:id', ...adminGuard, async (req, res) => {
  try {
    await prisma.user.delete({
      where: { id: req.params.id }
    });
    return res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Admin Delete User Error:', error);
    return res.status(400).json({ error: 'Failed to delete user. They may have active logs or dependencies.' });
  }
});

/**
 * GET /api/admin/requests
 * Fetch all OD requests in the college with query filters.
 */
router.get('/requests', ...adminGuard, async (req, res) => {
  const { deptId, status, type } = req.query;

  try {
    const whereClause = {};

    if (status) {
      whereClause.status = status;
    }
    if (type) {
      whereClause.studentType = type;
    }
    if (deptId) {
      whereClause.student = { deptId };
    }

    const requests = await prisma.odRequest.findMany({
      where: whereClause,
      include: {
        student: {
          include: {
            user: { select: { name: true, email: true } },
            department: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(requests);
  } catch (error) {
    console.error('Admin Fetch Requests Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve OD requests.' });
  }
});

/**
 * GET /api/admin/report
 * Compile aggregated statistics for dashboard charts.
 */
router.get('/report', ...adminGuard, async (req, res) => {
  try {
    const requests = await prisma.odRequest.findMany({
      include: {
        student: {
          include: { department: true }
        }
      }
    });

    // 1. Requests per month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyCounts = {};
    months.forEach(m => { monthlyCounts[m] = 0; });

    requests.forEach(r => {
      const monthIndex = new Date(r.createdAt).getMonth();
      const monthName = months[monthIndex];
      monthlyCounts[monthName] = (monthlyCounts[monthName] || 0) + 1;
    });

    const requestsPerMonth = months.map(m => ({
      month: m,
      count: monthlyCounts[m]
    }));

    // 2. Approval rate by department
    const deptStats = {};
    requests.forEach(r => {
      const deptCode = r.student.department.code;
      if (!deptStats[deptCode]) {
        deptStats[deptCode] = { total: 0, approved: 0 };
      }
      deptStats[deptCode].total += 1;
      if (r.status === 'APPROVED') {
        deptStats[deptCode].approved += 1;
      }
    });

    const approvalRateByDept = Object.keys(deptStats).map(code => ({
      department: code,
      total: deptStats[code].total,
      approved: deptStats[code].approved,
      rate: deptStats[code].total > 0
        ? Math.round((deptStats[code].approved / deptStats[code].total) * 100)
        : 0
    }));

    // 3. Day Scholar vs Hosteller ratio
    let dayScholars = 0;
    let hostellers = 0;
    requests.forEach(r => {
      if (r.studentType === 'DAY_SCHOLAR') dayScholars++;
      else if (r.studentType === 'HOSTELLER') hostellers++;
    });

    const typeRatio = [
      { name: 'Day Scholar', value: dayScholars },
      { name: 'Hosteller', value: hostellers }
    ];

    // General counters
    const totalStudents = await prisma.student.count();
    const totalStaff = await prisma.user.count({
      where: { role: { in: ['mentor', 'chairperson', 'hod', 'principal'] } }
    });

    return res.json({
      counters: {
        totalRequests: requests.length,
        approved: requests.filter(r => r.status === 'APPROVED').length,
        pending: requests.filter(r => r.status === 'PENDING').length,
        rejected: requests.filter(r => r.status === 'REJECTED').length,
        totalStudents,
        totalStaff
      },
      requestsPerMonth,
      approvalRateByDept,
      typeRatio
    });
  } catch (error) {
    console.error('Admin Compile Report Error:', error);
    return res.status(500).json({ error: 'Failed to compile dashboard reports.' });
  }
});

/**
 * GET /api/admin/export
 * Compile OD requests and stream CSV document
 */
router.get('/export', ...adminGuard, async (req, res) => {
  try {
    const requests = await prisma.odRequest.findMany({
      include: {
        student: {
          include: {
            user: true,
            department: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const csvRows = [[
      'OD Reference',
      'Student Name',
      'Reg No',
      'Dept',
      'Year',
      'Scholar Type',
      'Event Name',
      'College Name',
      'Event Date',
      'From Date',
      'To Date',
      'Current Stage',
      'Status',
      'Created At'
    ]];

    requests.forEach(r => {
      csvRows.push([
        r.odCode,
        r.student.user.name,
        r.student.regNo,
        r.student.department.code,
        r.student.year,
        r.studentType,
        r.eventName,
        r.collegeName,
        new Date(r.eventDate).toLocaleDateString('en-GB'),
        new Date(r.fromDate).toLocaleDateString('en-GB'),
        new Date(r.toDate).toLocaleDateString('en-GB'),
        r.currentStage,
        r.status,
        new Date(r.createdAt).toLocaleDateString('en-GB')
      ]);
    });

    const csvContent = '\uFEFF' + csvRows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=OD-SYSTEM-REPORT.csv');
    return res.send(csvContent);
  } catch (error) {
    console.error('CSV Export Error:', error);
    return res.status(500).send('Failed to generate CSV export.');
  }
});

export default router;
