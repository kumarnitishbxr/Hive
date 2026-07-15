import { Request, Response } from 'express';
import Startup from '../models/Startup';
import { Task } from '../models/Task';
import { InterviewLog, Survey } from '../models/Validation';
import { Investor } from '../models/CRM';
import Milestone from '../models/Milestone';
import { AIConversation, AIMemory } from '../models/AI';
import { executePlannerWorkflow } from '../ai/agents/plannerAgent';
import { searchSimilarity, addVector } from '../services/ai/vectorStore';
import { getAnalytics, getTasks } from '../services/ai/tools';

// 1. Streaming Multi-Agent Chat API (Server-Sent Events)
export const aiChatStream = async (req: Request, res: Response) => {
  try {
    const { prompt, topic, conversationId } = req.body;
    const workspaceId = req.startupId; // maps startupId context
    const userId = req.user?.id;
    const role = req.role;

    if (!prompt || !workspaceId || !userId) {
      return res.status(400).json({ error: 'Prompt, workspaceId, and authentication are required.' });
    }

    // Set headers for Server-Sent Events (SSE)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Fetch conversation history
    let chatHistory: { role: string; content: string }[] = [];
    let conversation = conversationId ? await AIConversation.findById(conversationId) : null;
    
    if (conversation) {
      chatHistory = conversation.messages.map(m => ({ role: m.role, content: m.content }));
    } else {
      conversation = new AIConversation({
        workspaceId,
        userId,
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
        // SSE formatting chunk write
        res.write(`data: ${JSON.stringify({ text: token })}\n\n`);
        completeResponse += token;
      },
      async (completeData) => {
        // Append AI response with citations & follow-ups
        conversation.messages.push({
          role: 'assistant',
          content: completeResponse,
          citations: completeData.citations,
          suggestedFollowups: completeData.suggestedFollowups,
          createdAt: new Date()
        });
        await conversation.save();

        // Write final citations and done event
        res.write(`data: ${JSON.stringify({ 
          done: true, 
          conversationId: conversation._id,
          citations: completeData.citations,
          suggestedFollowups: completeData.suggestedFollowups
        })}\n\n`);
        
        res.end();
      }
    );

  } catch (error: any) {
    console.error('AI Chat Stream Error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message || 'AI processing failed' })}\n\n`);
    res.end();
  }
};

// 2. Summarize Workspace (Module 14 / Proactive standup summary)
export const summarizeWorkspace = async (req: Request, res: Response) => {
  try {
    const workspaceId = req.startupId;
    if (!workspaceId) return res.status(400).json({ error: 'Startup workspace context not resolved.' });

    const analytics = await getAnalytics(workspaceId);
    const tasks = await getTasks(workspaceId);

    const activeTasks = tasks.filter(t => t.status === 'In Progress');
    const blockedTasks = tasks.filter(t => t.status === 'Blocked');

    const summary = `### Workspace Retrospective Standup\n\n` +
      `- **Completion Velocity**: Completed **${analytics.completedTasks}** out of **${analytics.totalTasks}** tasks (**${analytics.completionRate}%** execution score).\n` +
      `- **Active Sprint Work**: There are currently **${activeTasks.length}** tasks in progress.\n` +
      `- **Blockers Checklist**: There are **${blockedTasks.length}** blocked sprint cards requiring founder reviews.\n` +
      `- **Runway Hours Status**: Variance is sitting at **${analytics.hoursVariance} hours** against estimates.`;

    res.status(200).json({ summary });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Generate Sprintsuggestion
export const generateSprintSuggestion = async (req: Request, res: Response) => {
  try {
    const workspaceId = req.startupId;
    if (!workspaceId) return res.status(400).json({ error: 'Workspace context unresolved.' });
    const tasks = await Task.find({ workspaceId, status: 'Todo' }).limit(5);

    let proposal = `### Proposed Sprint Backlog\n\nBased on due dates and priorities, we recommend locking in these tasks for the next sprint:\n\n`;
    tasks.forEach((t, i) => {
      proposal += `${i + 1}. **${t.title}** (Priority: ${t.priority}, Est: ${t.estimatedHours || 4}h)\n`;
    });

    res.status(200).json({ sprintSuggestion: proposal });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Generate Investor Pitch Updates
export const generateInvestorPitch = async (req: Request, res: Response) => {
  try {
    const workspaceId = req.startupId;
    if (!workspaceId) return res.status(400).json({ error: 'Workspace context unresolved.' });
    const startup = await Startup.findById(workspaceId);
    if (!startup) return res.status(404).json({ error: 'Startup not found.' });

    const analytics = await getAnalytics(workspaceId);
    const closedDeals = await Investor.countDocuments({ startupId: workspaceId, stage: 'Closed' });

    const pitchDraft = `Dear Investors,\n\nHere is our brief operational update for **${startup.name}**:\n\n` +
      `- **Product Execution**: Our development velocity is strong, completing **${analytics.completedTasks}** tasks with an overall **${analytics.completionRate}%** execution rating.\n` +
      `- **Investor CRM Status**: We have locked down **${closedDeals}** commitments in this rounding iteration.\n\n` +
      `Thank you for your continuous support!\n\nBest,\n${req.user?.fullName || 'The Founders'}`;

    res.status(200).json({ pitchDraft });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 5. Search Workspace (RAG similarity fetcher)
export const searchWorkspace = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    const workspaceId = req.startupId;

    if (!query || !workspaceId) {
      return res.status(400).json({ error: 'Query text and workspace context are required.' });
    }

    const results = await searchSimilarity(workspaceId, query, undefined, 5);
    res.status(200).json({ results });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 6. Get Next Proactive Actions & Recommendations
export const getProactiveRecommendations = async (req: Request, res: Response) => {
  try {
    const workspaceId = req.startupId;
    if (!workspaceId) return res.status(400).json({ error: 'Workspace context unresolved.' });

    const tasks = await Task.find({ workspaceId });
    const milestones = await Milestone.find({ startupId: workspaceId });
    const interviews = await InterviewLog.find({ startupId: workspaceId });

    const recommendations: { title: string; category: string; description: string }[] = [];

    // Trigger rules
    if (interviews.length < 5) {
      recommendations.push({
        title: 'Schedule customer interviews',
        category: 'Validation',
        description: `You have only logged ${interviews.length} customer interviews. Reach out to 5 users to validate PMF.`
      });
    }

    const blocked = tasks.filter(t => t.status === 'Blocked');
    if (blocked.length > 0) {
      recommendations.push({
        title: `Resolve ${blocked.length} blocked tasks`,
        category: 'Execution',
        description: `You have ${blocked.length} tasks blocked in the active sprint. Review assignee logs to unblock them.`
      });
    }

    if (milestones.length === 0) {
      recommendations.push({
        title: 'Configure Roadmap Milestones',
        category: 'Planning',
        description: 'Roadmap roadmap list is empty. Set your first milestone to track progress.'
      });
    }

    // Default recommendation if workspace is healthy
    if (recommendations.length === 0) {
      recommendations.push({
        title: 'Conduct weekly sprint standup',
        category: 'Execution',
        description: 'Operational metrics look solid. Run your standup to check task timelines.'
      });
    }

    res.status(200).json({ recommendations });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// 7. Startup Health Scoring Algorithm & Risk Meters (Modules 14 & 15)
export const getHealthScore = async (req: Request, res: Response) => {
  try {
    const startupId = req.startupId;

    const startup = await Startup.findById(startupId);
    if (!startup) {
      return res.status(404).json({ error: 'Startup workspace not found.' });
    }

    // Queries to calculate scores
    const tasks = await Task.find({ workspaceId: { $in: await Task.distinct('workspaceId', { startupId }) } });
    const interviews = await InterviewLog.find({ startupId });
    const surveys = await Survey.find({ startupId });
    const investors = await Investor.find({ startupId });
    const milestones = await Milestone.find({ startupId });

    // 1. Validation Rating (Interviews & Surveys) - Max 25 pts
    let validationScore = 0;
    if (interviews.length >= 10) validationScore += 15;
    else validationScore += interviews.length * 1.5;

    if (surveys.length >= 2) validationScore += 10;
    else validationScore += surveys.length * 5;

    // 2. Execution Rating (Task Completion rate) - Max 25 pts
    let executionScore = 0;
    if (tasks.length > 0) {
      const completedTasks = tasks.filter(t => ['Completed', 'Approved', 'Done'].includes(t.status)).length;
      executionScore = Math.round((completedTasks / tasks.length) * 25);
    } else {
      executionScore = 15; // default starting execution credit
    }

    // 3. Strategic Planning (Milestone completions) - Max 25 pts
    let strategicScore = 0;
    if (milestones.length > 0) {
      const completedMilestones = milestones.filter(m => m.status === 'Completed').length;
      strategicScore = Math.round((completedMilestones / milestones.length) * 25);
    } else {
      strategicScore = 12;
    }

    // 4. Traction / Capital Pipeline (Investors logged) - Max 25 pts
    let tractionScore = 0;
    if (investors.length >= 5) tractionScore += 15;
    else tractionScore += investors.length * 3;

    const closedDeals = investors.filter(i => i.stage === 'Closed').length;
    if (closedDeals > 0) tractionScore += 10;

    // Aggregate Score
    const overallScore = Math.min(100, Math.round(validationScore + executionScore + strategicScore + tractionScore));

    // Risk Meter Dial
    let riskLevel: 'Low' | 'Moderate' | 'High' = 'High';
    let riskColor = '#ef4444'; // Red
    if (overallScore >= 75) {
      riskLevel = 'Low';
      riskColor = '#10b981'; // Green
    } else if (overallScore >= 50) {
      riskLevel = 'Moderate';
      riskColor = '#f59e0b'; // Amber
    }

    // Compile dynamic alerts (AI Insights - Module 14)
    const insights: string[] = [];
    if (interviews.length < 10) {
      insights.push('Customer validation is weak. We recommend interviewing at least 10 users to check fit.');
    }
    if (tasks.length > 0 && (tasks.filter(t => ['Completed', 'Approved', 'Done'].includes(t.status)).length / tasks.length) < 0.4) {
      insights.push('Execution bottleneck detected: under 40% of backlog tasks are completed.');
    }
    if (milestones.length === 0) {
      insights.push('Milestones list is empty. Break down goals into structured deadlines.');
    }
    if (investors.length === 0) {
      insights.push('Investor pipeline inactive. Add leads to start seed tracking.');
    }
    if (startup.elevatorPitch && startup.elevatorPitch.length < 20) {
      insights.push('Company elevator pitch is too brief. Refine value statement in strategic canvas.');
    }

    if (insights.length === 0) {
      insights.push('Operational flow is healthy. Maintain current velocity parameters!');
    }

    res.status(200).json({
      startupName: startup.name,
      overallScore,
      riskLevel,
      riskColor,
      insights,
      metricsSnapshot: {
        totalTasks: tasks.length,
        totalInterviews: interviews.length,
        totalMilestones: milestones.length,
        totalInvestors: investors.length
      }
    });
  } catch (error) {
    console.error('Failed to compute health dials:', error);
    res.status(500).json({ error: 'Failed to compile burndown health metrics.' });
  }
};
