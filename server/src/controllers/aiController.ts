import { Request, Response } from 'express';
import { executePlannerWorkflow } from '../ai/agents/plannerAgent';
import { searchSimilarity } from '../services/ai/vectorStore';
import { AIService } from '../services/AIService';
import { AIConversationRepository } from '../repositories/AIConversationRepository';
import { sendSuccess } from '../utils/responseHandler';
import AppError from '../utils/AppError';

const aiService = new AIService();
const aiConvoRepo = new AIConversationRepository();

/**
 * Streaming Multi-Agent Chat API (Server-Sent Events)
 */
export const aiChatStream = async (req: Request, res: Response) => {
  const { prompt, topic, conversationId } = req.body;
  const workspaceId = req.startupId; 
  const userId = req.user?.id;
  const role = req.role;

  if (!prompt || !workspaceId || !userId) {
    throw new AppError('Prompt, workspaceId, and authentication are required.', 400);
  }

  // Set headers for Server-Sent Events (SSE)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Fetch conversation history
  let chatHistory: { role: string; content: string }[] = [];
  let conversation = conversationId ? await aiConvoRepo.findById(conversationId) : null;
  
  if (conversation) {
    chatHistory = conversation.messages.map(m => ({ role: m.role, content: m.content }));
  } else {
    // Creating shell conversation
    conversation = await aiConvoRepo.create({
      workspaceId: workspaceId as any,
      userId: userId as any,
      messages: []
    });
  }

  // Record user message
  conversation.messages.push({
    role: 'user',
    content: prompt,
    createdAt: new Date()
  });

  let completeResponse = '';

  await executePlannerWorkflow(
    {
      workspaceId: workspaceId as string,
      userId: userId as string,
      role: role || 'Team Member',
      prompt,
      history: chatHistory
    },
    (token: string) => {
      // SSE chunk write
      res.write(`data: ${JSON.stringify({ text: token })}\n\n`);
      completeResponse += token;
    },
    async (completeData) => {
      // Append assistant message response with citations & follow-ups
      conversation!.messages.push({
        role: 'assistant',
        content: completeResponse,
        citations: completeData.citations as any,
        suggestedFollowups: completeData.suggestedFollowups,
        createdAt: new Date()
      });
      await conversation!.save();

      // Write final citation response and closing SSE data chunk
      res.write(`data: ${JSON.stringify({ 
        done: true, 
        conversationId: conversation!._id,
        citations: completeData.citations,
        suggestedFollowups: completeData.suggestedFollowups
      })}\n\n`);
      
      res.end();
    }
  ).catch((error) => {
    console.error('Planner workflow crashed:', error);
    res.write(`data: ${JSON.stringify({ error: error.message || 'Workflow execution error' })}\n\n`);
    res.end();
  });
};

/**
 * Summarize Workspace proactive retro
 */
export const summarizeWorkspace = async (req: Request, res: Response) => {
  const workspaceId = req.startupId;
  if (!workspaceId) throw new AppError('Startup workspace context not resolved.', 400);

  const result = await aiService.summarizeWorkspace(workspaceId);
  return sendSuccess(res, result, 200);
};

/**
 * Generate proposal for today's active sprint
 */
export const generateSprintSuggestion = async (req: Request, res: Response) => {
  const workspaceId = req.startupId;
  if (!workspaceId) throw new AppError('Workspace context unresolved.', 400);

  const result = await aiService.generateSprintSuggestion(workspaceId);
  return sendSuccess(res, result, 200);
};

/**
 * Generate updates draft for investor pitchDeck updates
 */
export const generateInvestorPitch = async (req: Request, res: Response) => {
  const workspaceId = req.startupId;
  if (!workspaceId) throw new AppError('Workspace context unresolved.', 400);

  const result = await aiService.generateInvestorPitch(workspaceId, req.user?.fullName || 'The Founders');
  return sendSuccess(res, result, 200);
};

/**
 * Search similarity indexes (RAG vector similarity search)
 */
export const searchWorkspace = async (req: Request, res: Response) => {
  const { query } = req.body;
  const workspaceId = req.startupId;

  if (!query || !workspaceId) {
    throw new AppError('Query text and workspace context are required.', 400);
  }

  const results = await searchSimilarity(workspaceId, query, undefined, 5);
  return sendSuccess(res, { results }, 200);
};

/**
 * Proactively compile roadmap suggestions and validation checks
 */
export const getProactiveRecommendations = async (req: Request, res: Response) => {
  const workspaceId = req.startupId;
  if (!workspaceId) throw new AppError('Workspace context unresolved.', 400);

  const result = await aiService.getProactiveRecommendations(workspaceId);
  return sendSuccess(res, result, 200);
};

/**
 * Compute Startup Health Score and Risk dial meters
 */
export const getHealthScore = async (req: Request, res: Response) => {
  const startupId = req.startupId;
  if (!startupId) throw new AppError('Startup workspace context not resolved.', 400);

  const result = await aiService.getHealthScore(startupId);
  return sendSuccess(res, result, 200);
};

export default {
  aiChatStream,
  summarizeWorkspace,
  generateSprintSuggestion,
  generateInvestorPitch,
  searchWorkspace,
  getProactiveRecommendations,
  getHealthScore
};
