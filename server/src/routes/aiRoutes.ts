import { Router } from 'express';
import { aiChatStream, getHealthScore } from '../controllers/aiController';
import { authenticateJWT, tenantIsolated } from '../middleware/auth';

const router = Router();

router.post('/chat', authenticateJWT, tenantIsolated, aiChatStream);
router.get('/health', authenticateJWT, tenantIsolated, getHealthScore);

export default router;
