import { Router } from 'express';
import { uploadDocument, getDocuments, deleteDocument } from '../controllers/documentController';
import { authenticateJWT, tenantIsolated } from '../middleware/auth';

const router = Router();

router.post('/', authenticateJWT, tenantIsolated, uploadDocument);
router.get('/', authenticateJWT, tenantIsolated, getDocuments);
router.delete('/:id', authenticateJWT, tenantIsolated, deleteDocument);

export default router;
