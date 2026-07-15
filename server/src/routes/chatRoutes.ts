import { Router } from 'express';
import { sendChat, getConversations, getMessages, markSeen, deleteMessage } from '../controllers/chatController';
import { authenticateJWT, tenantIsolated } from '../middleware/auth';

const router = Router();

router.post('/send', authenticateJWT, tenantIsolated, sendChat);
router.get('/conversations', authenticateJWT, tenantIsolated, getConversations);
router.get('/messages/:conversationId', authenticateJWT, tenantIsolated, getMessages);
router.patch('/seen', authenticateJWT, tenantIsolated, markSeen);
router.delete('/message', authenticateJWT, tenantIsolated, deleteMessage);

export default router;
