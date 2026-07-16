import { Router } from 'express';
import {
  register,
  verifyOtp,
  verifyInvitationToken,
  login,
  getMe,
  inviteTeam,
  changePassword
} from '../controllers/authController';
import { authenticateJWT, tenantIsolated } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/verify-otp', asyncHandler(verifyOtp));
router.get('/verify-invitation', asyncHandler(verifyInvitationToken));
router.post('/login', asyncHandler(login));
router.get('/me', authenticateJWT, asyncHandler(getMe));
router.post('/invite', authenticateJWT, tenantIsolated, asyncHandler(inviteTeam));
router.post('/change-password', authenticateJWT, asyncHandler(changePassword));

export default router;
