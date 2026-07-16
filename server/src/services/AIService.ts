import Startup from '../models/Startup';
import { Task } from '../models/Task';
import { InterviewLog, Survey } from '../models/Validation';
import { Investor } from '../models/CRM';
import Milestone from '../models/Milestone';
import { getAnalytics, getTasks } from './ai/tools';
import AppError from '../utils/AppError';

export class AIService {
  /**
   * Proactively summarize workspace status
   */
  async summarizeWorkspace(workspaceId: string) {
    const analytics = await getAnalytics(workspaceId);
    const tasks = await getTasks(workspaceId);

    const activeTasks = tasks.filter(t => t.status === 'In Progress');
    const blockedTasks = tasks.filter(t => t.status === 'Blocked');

    const summary = `### Workspace Retrospective Standup\n\n` +
      `- **Completion Velocity**: Completed **${analytics.completedTasks}** out of **${analytics.totalTasks}** tasks (**${analytics.completionRate}%** execution score).\n` +
      `- **Active Sprint Work**: There are currently **${activeTasks.length}** tasks in progress.\n` +
      `- **Blockers Checklist**: There are **${blockedTasks.length}** blocked sprint cards requiring founder reviews.\n` +
      `- **Runway Hours Status**: Variance is sitting at **${analytics.hoursVariance} hours** against estimates.`;

    return { summary };
  }

  /**
   * Suggest active sprint tasks backlog proposal
   */
  async generateSprintSuggestion(workspaceId: string) {
    const tasks = await Task.find({ workspaceId, status: 'Todo' }).limit(5);

    let proposal = `### Proposed Sprint Backlog\n\nBased on due dates and priorities, we recommend locking in these tasks for the next sprint:\n\n`;
    tasks.forEach((t, i) => {
      proposal += `${i + 1}. **${t.title}** (Priority: ${t.priority}, Est: ${t.estimatedHours || 4}h)\n`;
    });

    return { sprintSuggestion: proposal };
  }

  /**
   * Draft updates for investor pitch deck updates
   */
  async generateInvestorPitch(workspaceId: string, authorName: string) {
    const startup = await Startup.findById(workspaceId);
    if (!startup) {
      throw new AppError('Startup not found.', 404);
    }

    const analytics = await getAnalytics(workspaceId);
    const closedDeals = await Investor.countDocuments({ startupId: workspaceId, stage: 'Closed' });

    const pitchDraft = `Dear Investors,\n\nHere is our brief operational update for **${startup.name}**:\n\n` +
      `- **Product Execution**: Our development velocity is strong, completing **${analytics.completedTasks}** tasks with an overall **${analytics.completionRate}%** execution rating.\n` +
      `- **Investor CRM Status**: We have locked down **${closedDeals}** commitments in this rounding iteration.\n\n` +
      `Thank you for your continuous support!\n\nBest,\n${authorName || 'The Founders'}`;

    return { pitchDraft };
  }

  /**
   * Fetch proactive operational alerts & milestones warnings
   */
  async getProactiveRecommendations(workspaceId: string) {
    const tasks = await Task.find({ workspaceId });
    const milestones = await Milestone.find({ startupId: workspaceId });
    const interviews = await InterviewLog.find({ startupId: workspaceId });

    const recommendations: { title: string; category: string; description: string }[] = [];

    // Trigger recommendations based on conditions
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

    // Default if workspace has no warnings
    if (recommendations.length === 0) {
      recommendations.push({
        title: 'Conduct weekly sprint standup',
        category: 'Execution',
        description: 'Operational metrics look solid. Run your standup to check task timelines.'
      });
    }

    return { recommendations };
  }

  /**
   * Compute Startup Health Score out of 100 with dynamic advisory alerts
   */
  async getHealthScore(startupId: string) {
    const startup = await Startup.findById(startupId);
    if (!startup) {
      throw new AppError('Startup workspace not found.', 404);
    }

    // Queries
    const tasks = await Task.find({ workspaceId: { $in: await Task.distinct('workspaceId', { startupId }) } });
    const interviews = await InterviewLog.find({ startupId });
    const surveys = await Survey.find({ startupId });
    const investors = await Investor.find({ startupId });
    const milestones = await Milestone.find({ startupId });

    // 1. Validation rating (Max 25 pts)
    let validationScore = 0;
    if (interviews.length >= 10) validationScore += 15;
    else validationScore += interviews.length * 1.5;

    if (surveys.length >= 2) validationScore += 10;
    else validationScore += surveys.length * 5;

    // 2. Execution rating (Max 25 pts)
    let executionScore = 0;
    if (tasks.length > 0) {
      const completedTasks = tasks.filter(t => ['Completed', 'Approved', 'Done'].includes(t.status)).length;
      executionScore = Math.round((completedTasks / tasks.length) * 25);
    } else {
      executionScore = 15;
    }

    // 3. Strategic planning (Max 25 pts)
    let strategicScore = 0;
    if (milestones.length > 0) {
      const completedMilestones = milestones.filter(m => m.status === 'Completed').length;
      strategicScore = Math.round((completedMilestones / milestones.length) * 25);
    } else {
      strategicScore = 12;
    }

    // 4. Traction / Capital Pipeline (Max 25 pts)
    let tractionScore = 0;
    if (investors.length >= 5) tractionScore += 15;
    else tractionScore += investors.length * 3;

    const closedDeals = investors.filter(i => i.stage === 'Closed').length;
    if (closedDeals > 0) tractionScore += 10;

    // Aggregate
    const overallScore = Math.min(100, Math.round(validationScore + executionScore + strategicScore + tractionScore));

    // Risk Meter Dial
    let riskLevel: 'Low' | 'Moderate' | 'High' = 'High';
    let riskColor = '#ef4444';
    if (overallScore >= 75) {
      riskLevel = 'Low';
      riskColor = '#10b981';
    } else if (overallScore >= 50) {
      riskLevel = 'Moderate';
      riskColor = '#f59e0b';
    }

    // Compile dynamic alerts
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

    return {
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
    };
  }
}

export default AIService;
