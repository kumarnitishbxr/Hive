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

const router = Router();

// Apply auth middlewares globally
router.use(authenticateJWT);
router.use(tenantIsolated);

router.post('/chat', aiChatStream);
router.get('/health', getHealthScore);
router.post('/summarize', summarizeWorkspace);
router.post('/sprint', generateSprintSuggestion);
router.post('/pitch', generateInvestorPitch);
router.post('/search', searchWorkspace);
router.post('/recommendations', getProactiveRecommendations);

export default router;
