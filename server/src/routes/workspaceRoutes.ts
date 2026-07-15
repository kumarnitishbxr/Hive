import { Router } from 'express';
import { createPage, getWorkspaces, getPages, getPageDetails, updatePage, deletePage } from '../controllers/workspaceController';
import { authenticateJWT, tenantIsolated } from '../middleware/auth';

const router = Router();

router.get('/workspaces', authenticateJWT, tenantIsolated, getWorkspaces);
router.post('/pages', authenticateJWT, tenantIsolated, createPage);
router.get('/pages', authenticateJWT, tenantIsolated, getPages);
router.get('/pages/:id', authenticateJWT, tenantIsolated, getPageDetails);
router.patch('/pages/:id', authenticateJWT, tenantIsolated, updatePage);
router.delete('/pages/:id', authenticateJWT, tenantIsolated, deletePage);

export default router;
