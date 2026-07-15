import { Request, Response } from 'express';
import { Survey, SurveyResponse, InterviewLog, Feedback } from '../models/Validation';

// Simple text sentiment analyzer (Mock NLP)
const analyzeTextSentiment = (text: string): { score: number; label: 'Positive' | 'Neutral' | 'Negative' } => {
  const cleanText = text.toLowerCase();
  const positiveWords = ['great', 'awesome', 'perfect', 'innovative', 'love', 'helpful', 'useful', 'need', 'solved', 'buying', 'easy'];
  const negativeWords = ['terrible', 'bad', 'slow', 'expensive', 'useless', 'unhelpful', 'hard', 'hate', 'broke', 'waste', 'pricing'];

  let score = 0;
  positiveWords.forEach(w => {
    if (cleanText.includes(w)) score += 0.25;
  });
  negativeWords.forEach(w => {
    if (cleanText.includes(w)) score -= 0.25;
  });

  // Clamp between -1 and 1
  score = Math.max(-1, Math.min(1, score));

  let label: 'Positive' | 'Neutral' | 'Negative' = 'Neutral';
  if (score > 0.1) label = 'Positive';
  else if (score < -0.1) label = 'Negative';

  return { score, label };
};

// Surveys
export const createSurvey = async (req: Request, res: Response) => {
  try {
    const { title, description, questions } = req.body;
    const startupId = req.startupId;

    if (!title || !questions || !Array.isArray(questions)) {
      return res.status(400).json({ error: 'Title and questions list are required.' });
    }

    const survey = new Survey({ startupId, title, description, questions });
    await survey.save();
    res.status(201).json({ message: 'Survey created successfully.', survey });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create survey.' });
  }
};

export const getSurveys = async (req: Request, res: Response) => {
  try {
    const surveys = await Survey.find({ startupId: req.startupId }).sort({ createdAt: -1 });
    res.status(200).json({ surveys });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve surveys.' });
  }
};

export const submitSurveyResponse = async (req: Request, res: Response) => {
  try {
    const { surveyId, answers, customerSegment, respondentEmail } = req.body;

    if (!surveyId || !answers) {
      return res.status(400).json({ error: 'Survey ID and answers are required.' });
    }

    const response = new SurveyResponse({
      surveyId,
      answers,
      customerSegment,
      respondentEmail
    });

    await response.save();
    res.status(201).json({ message: 'Response recorded.', response });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record response.' });
  }
};

export const getSurveyAnalytics = async (req: Request, res: Response) => {
  try {
    const { surveyId } = req.params;
    const survey = await Survey.findById(surveyId);
    if (!survey) {
      return res.status(404).json({ error: 'Survey not found.' });
    }

    const responses = await SurveyResponse.find({ surveyId });

    // Aggregate answers count
    const analytics: any = {};
    survey.questions.forEach(q => {
      analytics[q.id] = {
        question: q.question,
        type: q.type,
        totalAnswers: 0,
        data: {}
      };
    });

    responses.forEach(resp => {
      resp.answers.forEach(ans => {
        if (analytics[ans.questionId]) {
          analytics[ans.questionId].totalAnswers += 1;
          const val = String(ans.answer);
          analytics[ans.questionId].data[val] = (analytics[ans.questionId].data[val] || 0) + 1;
        }
      });
    });

    res.status(200).json({ survey, totalResponses: responses.length, analytics });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve analytics.' });
  }
};

// Customer Interviews
export const logInterview = async (req: Request, res: Response) => {
  try {
    const { customerName, roleOrIndustry, feedbackText, painPoints } = req.body;
    const startupId = req.startupId;

    if (!customerName || !feedbackText) {
      return res.status(400).json({ error: 'Customer name and feedback are required.' });
    }

    const { score, label } = analyzeTextSentiment(feedbackText);

    const interview = new InterviewLog({
      startupId,
      customerName,
      roleOrIndustry,
      feedbackText,
      painPoints: painPoints || [],
      sentimentScore: score,
      sentimentLabel: label
    });

    await interview.save();
    res.status(201).json({ message: 'Interview logged successfully.', interview });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log interview.' });
  }
};

export const getInterviews = async (req: Request, res: Response) => {
  try {
    const interviews = await InterviewLog.find({ startupId: req.startupId }).sort({ createdAt: -1 });
    res.status(200).json({ interviews });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve interviews.' });
  }
};

// 360 Feedback
export const submitFeedback = async (req: Request, res: Response) => {
  try {
    const { source, authorName, authorEmail, content, rating, suggestions } = req.body;
    const startupId = req.startupId;

    if (!source || !authorName || !content || !rating) {
      return res.status(400).json({ error: 'Source, author, rating and content are required.' });
    }

    const { label } = analyzeTextSentiment(content);

    const feedback = new Feedback({
      startupId,
      source,
      authorName,
      authorEmail,
      content,
      rating,
      sentimentLabel: label,
      suggestions
    });

    await feedback.save();
    res.status(201).json({ message: 'Feedback logged successfully.', feedback });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit feedback.' });
  }
};

export const getFeedbacks = async (req: Request, res: Response) => {
  try {
    const feedbacks = await Feedback.find({ startupId: req.startupId }).sort({ createdAt: -1 });
    res.status(200).json({ feedbacks });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve feedback list.' });
  }
};

// Calculates "Idea Validation Score" out of 100
export const getIdeaScore = async (req: Request, res: Response) => {
  try {
    const startupId = req.startupId;
    const interviews = await InterviewLog.find({ startupId });
    const feedbacks = await Feedback.find({ startupId });
    const surveys = await Survey.find({ startupId });
    
    let totalInterviews = interviews.length;
    let positiveInterviews = interviews.filter(i => i.sentimentLabel === 'Positive').length;
    
    let totalFeedbacks = feedbacks.length;
    let feedbackRatingsSum = feedbacks.reduce((acc, f) => acc + f.rating, 0);

    // Scoring weights
    // Interviews count & positivity: 40%
    // Feedback scores: 40%
    // Survey quantity & setups: 20%
    
    let interviewScore = totalInterviews > 0 ? (positiveInterviews / totalInterviews) * 100 : 50;
    let feedbackScore = totalFeedbacks > 0 ? (feedbackRatingsSum / (totalFeedbacks * 5)) * 100 : 50;
    let surveyScore = surveys.length > 0 ? Math.min(100, surveys.length * 25) : 30;

    // Aggregate weighted score
    const aggregateScore = Math.round(
      (interviewScore * 0.40) + (feedbackScore * 0.40) + (surveyScore * 0.20)
    );

    res.status(200).json({
      score: aggregateScore,
      breakdown: {
        interviews: { count: totalInterviews, positive: positiveInterviews, score: Math.round(interviewScore) },
        feedbacks: { count: totalFeedbacks, averageRating: totalFeedbacks > 0 ? Number((feedbackRatingsSum / totalFeedbacks).toFixed(1)) : 0, score: Math.round(feedbackScore) },
        surveys: { count: surveys.length, score: Math.round(surveyScore) }
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate idea score.' });
  }
};
