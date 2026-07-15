import { Router } from 'express';
import { createNotification, getNotifications, markRead, markAllRead } from '../controllers/notificationController';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

router.post('/create', authenticateJWT, createNotification);
router.get('/', authenticateJWT, getNotifications);
router.patch('/read/:id', authenticateJWT, markRead);
router.patch('/read-all', authenticateJWT, markAllRead);

export default router;
