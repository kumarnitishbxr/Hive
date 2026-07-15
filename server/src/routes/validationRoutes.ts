import { Router } from 'express';
import { createSurvey, getSurveys, submitSurveyResponse, getSurveyAnalytics, logInterview, getInterviews, submitFeedback, getFeedbacks, getIdeaScore } from '../controllers/validationController';
import { authenticateJWT, tenantIsolated } from '../middleware/auth';

const router = Router();

// Publicly submit survey responses (no auth header needed for respondents)
router.post('/surveys/respond', submitSurveyResponse);

// Publicly submit feedback (no auth header needed for external stakeholders)
router.post('/feedback/submit-public', submitFeedback);

// Isolated routes
router.post('/surveys', authenticateJWT, tenantIsolated, createSurvey);
router.get('/surveys', authenticateJWT, tenantIsolated, getSurveys);
router.get('/surveys/:surveyId/analytics', authenticateJWT, tenantIsolated, getSurveyAnalytics);

router.post('/interviews', authenticateJWT, tenantIsolated, logInterview);
router.get('/interviews', authenticateJWT, tenantIsolated, getInterviews);

router.post('/feedback', authenticateJWT, tenantIsolated, submitFeedback);
router.get('/feedback', authenticateJWT, tenantIsolated, getFeedbacks);

router.get('/idea-score', authenticateJWT, tenantIsolated, getIdeaScore);

export default router;
