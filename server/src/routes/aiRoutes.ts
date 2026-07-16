import { Router } from 'express';
import { 
  aiChatStream, 
  getHealthScore, 
  summarizeWorkspace, 
  generateSprintSuggestion, 
  generateInvestorPitch, 
  searchWorkspace, 
  getProactiveRecommendations 
} from '../controllers/aiController';
import { authenticateJWT, tenantIsolated } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Apply auth middlewares globally
router.use(authenticateJWT);
router.use(tenantIsolated);

router.post('/chat', asyncHandler(aiChatStream));
router.get('/health', asyncHandler(getHealthScore));
router.post('/summarize', asyncHandler(summarizeWorkspace));
router.post('/sprint', asyncHandler(generateSprintSuggestion));
router.post('/pitch', asyncHandler(generateInvestorPitch));
router.post('/search', asyncHandler(searchWorkspace));
router.post('/recommendations', asyncHandler(getProactiveRecommendations));

export default router;
