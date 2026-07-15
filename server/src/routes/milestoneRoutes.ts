import { Router } from 'express';
import { createMilestone, getMilestones, updateMilestone, deleteMilestone } from '../controllers/milestoneController';
import { authenticateJWT, tenantIsolated } from '../middleware/auth';

const router = Router();

router.post('/', authenticateJWT, tenantIsolated, createMilestone);
router.get('/', authenticateJWT, tenantIsolated, getMilestones);
router.patch('/:id', authenticateJWT, tenantIsolated, updateMilestone);
router.delete('/:id', authenticateJWT, tenantIsolated, deleteMilestone);

export default router;
