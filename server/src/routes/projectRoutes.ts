import { Router } from 'express';
import { createProject, getProjects, createSprint, getSprints, getSprintBurndown } from '../controllers/projectController';
import { authenticateJWT, tenantIsolated } from '../middleware/auth';

const router = Router();

router.post('/', authenticateJWT, tenantIsolated, createProject);
router.get('/', authenticateJWT, tenantIsolated, getProjects);

router.post('/sprints', authenticateJWT, tenantIsolated, createSprint);
router.get('/sprints/:projectId', authenticateJWT, tenantIsolated, getSprints);
router.get('/sprints/:sprintId/burndown', authenticateJWT, tenantIsolated, getSprintBurndown);

export default router;
