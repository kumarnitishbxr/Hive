import { Router } from 'express';
import { 
  aiChatStream, 
  getConversations,
  getHealthScore, 
  summarizeWorkspace, 
  generateSprintSuggestion, 
  generateInvestorPitch, 
  searchWorkspace,
  deleteConversation,
  getProactiveRecommendations 
} from '../controllers/aiController';
import { authenticateJWT, tenantIsolated } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Apply auth middlewares globally
router.use(authenticateJWT);
router.use(tenantIsolated);

router.get('/conversations', asyncHandler(getConversations));
router.delete('/conversations/:id', asyncHandler(deleteConversation));
router.post('/chat', asyncHandler(aiChatStream));
router.get('/health', asyncHandler(getHealthScore));
router.post('/summarize', asyncHandler(summarizeWorkspace));
router.post('/sprint', asyncHandler(generateSprintSuggestion));
router.post('/pitch', asyncHandler(generateInvestorPitch));
router.post('/search', asyncHandler(searchWorkspace));
router.post('/recommendations', asyncHandler(getProactiveRecommendations));

export default router;
