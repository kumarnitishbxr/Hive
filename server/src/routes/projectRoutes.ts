import { Router } from 'express';
import { createProject, getProjects, createSprint, getSprints, createTask, getTasks, updateTask, logTime, getSprintBurndown } from '../controllers/projectController';
import { authenticateJWT, tenantIsolated } from '../middleware/auth';

const router = Router();

router.post('/', authenticateJWT, tenantIsolated, createProject);
router.get('/', authenticateJWT, tenantIsolated, getProjects);

router.post('/sprints', authenticateJWT, tenantIsolated, createSprint);
router.get('/sprints/:projectId', authenticateJWT, tenantIsolated, getSprints);
router.get('/sprints/:sprintId/burndown', authenticateJWT, tenantIsolated, getSprintBurndown);

router.post('/tasks', authenticateJWT, tenantIsolated, createTask);
router.get('/tasks', authenticateJWT, tenantIsolated, getTasks);
router.patch('/tasks/:id', authenticateJWT, tenantIsolated, updateTask);
router.post('/tasks/log-time', authenticateJWT, tenantIsolated, logTime);

export default router;
