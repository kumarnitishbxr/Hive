import { Router } from 'express';
import { register, verifyOtp, login, getMe, inviteTeam } from '../controllers/authController';
import { authenticateJWT, tenantIsolated } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/verify-otp', verifyOtp);
router.post('/login', login);
router.get('/me', authenticateJWT, getMe);
router.post('/invite', authenticateJWT, tenantIsolated, inviteTeam);

export default router;
