import { Router } from 'express';
import { bootstrapOnboarding, getProfile, updateCanvas, updateSwot, addCompetitor } from '../controllers/startupController';
import { authenticateJWT, tenantIsolated } from '../middleware/auth';

const router = Router();

router.post('/onboarding/bootstrap', authenticateJWT, bootstrapOnboarding);
router.get('/profile', authenticateJWT, tenantIsolated, getProfile);
router.patch('/profile/canvas', authenticateJWT, tenantIsolated, updateCanvas);
router.patch('/profile/swot', authenticateJWT, tenantIsolated, updateSwot);
router.post('/profile/competitors', authenticateJWT, tenantIsolated, addCompetitor);

export default router;
