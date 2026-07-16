import { Router } from 'express';
import { 
  getMembers, 
  inviteMember, 
  changeRole, 
  removeMember, 
  suspendMember,
  reactivateMember,
  resetPassword,
  resendInvite, 
  cancelInvite,
  getMyPendingInvitation, 
  acceptInvite, 
  declineInvite,
  getAuditLogs
} from '../controllers/teamController';
import { authenticateJWT, tenantIsolated } from '../middleware/auth';

const router = Router();

// Apply auth middlewares globally
router.use(authenticateJWT);
router.use(tenantIsolated);

router.get('/members', getMembers);
router.post('/invite', inviteMember);
router.patch('/change-role', changeRole);
router.delete('/remove', removeMember);
router.patch('/suspend', suspendMember);
router.patch('/reactivate', reactivateMember);
router.post('/reset-password', resetPassword);
router.post('/resend-invite', resendInvite);
router.post('/cancel-invite', cancelInvite);
router.get('/my-pending-invitation', getMyPendingInvitation);
router.post('/accept-invite', acceptInvite);
router.post('/decline-invite', declineInvite);
router.get('/audit-logs', getAuditLogs);

export default router;
