// server/routes/notifications.js
import express from 'express';
import prisma from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/notifications
 * Retrieves user's notification list, sorted unread-first then by date.
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: [
        { isRead: 'asc' },
        { createdAt: 'desc' }
      ]
    });
    return res.json(notifications);
  } catch (error) {
    console.error('Fetch Notifications Error:', error);
    return res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

/**
 * PUT /api/notifications/read
 * Marks all notifications as read for the logged-in user.
 */
router.put('/read', requireAuth, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true }
    });
    return res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Mark Notifications Read Error:', error);
    return res.status(500).json({ error: 'Failed to mark notifications as read.' });
  }
});

export default router;
