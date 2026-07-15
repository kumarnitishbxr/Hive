import { Router } from 'express';
import { createInvestor, getInvestors, updateInvestor, addMeetingNote, generateShareLink, submitSlideTelemetry, getPitchDeckTelemetry } from '../controllers/crmController';
import { authenticateJWT, tenantIsolated } from '../middleware/auth';

const router = Router();

// Public telemetry submission
router.post('/telemetry/submit', submitSlideTelemetry);

// Secure routes
router.post('/', authenticateJWT, tenantIsolated, createInvestor);
router.get('/', authenticateJWT, tenantIsolated, getInvestors);
router.patch('/:id', authenticateJWT, tenantIsolated, updateInvestor);
router.post('/:id/meetings', authenticateJWT, tenantIsolated, addMeetingNote);

router.post('/share-link', authenticateJWT, tenantIsolated, generateShareLink);
router.get('/telemetry/report', authenticateJWT, tenantIsolated, getPitchDeckTelemetry);

export default router;
