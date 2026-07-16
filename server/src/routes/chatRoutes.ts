import { Router } from 'express';
import {
  getConversations,
  getConversationMessages,
  createPrivateChat,
  createGroupChat,
  sendMessage,
  editMessage,
  deleteMessage,
  deleteConversation,
  markRead,
  archiveConversation,
  removeMember,
  addMember,
  searchChat
} from '../controllers/chatController';
import { authenticateJWT, tenantIsolated } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticateJWT);
router.use(tenantIsolated);

router.get('/conversations', asyncHandler(getConversations));
router.get('/search', asyncHandler(searchChat));
router.get('/:conversationId', asyncHandler(getConversationMessages));
router.post('/private', asyncHandler(createPrivateChat));
router.post('/group', asyncHandler(createGroupChat));
router.post('/message', asyncHandler(sendMessage));
router.patch('/message/:id', asyncHandler(editMessage));
router.delete('/message/:id', asyncHandler(deleteMessage));
router.delete('/conversation/:id', asyncHandler(deleteConversation));
router.patch('/read', asyncHandler(markRead));
router.patch('/archive', asyncHandler(archiveConversation));
router.patch('/remove-member', asyncHandler(removeMember));
router.patch('/add-member', asyncHandler(addMember));

export default router;
