import { Router } from 'express';
import { 
  getMembers, 
  inviteMember, 
  changeRole, 
  removeMember, 
  resendInvite, 
  getMyPendingInvitation, 
  acceptInvite, 
  declineInvite 
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
router.post('/resend-invite', resendInvite);
router.get('/my-pending-invitation', getMyPendingInvitation);
router.post('/accept-invite', acceptInvite);
router.post('/decline-invite', declineInvite);

export default router;
