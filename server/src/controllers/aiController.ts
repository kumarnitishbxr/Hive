import { Request, Response } from 'express';
import Startup from '../models/Startup';
import { Task } from '../models/Task';
import { InterviewLog, Survey } from '../models/Validation';
import { Investor } from '../models/CRM';
import Milestone from '../models/Milestone';

// Streaming Chat API (Server-Sent Events)
export const aiChatStream = async (req: Request, res: Response) => {
  try {
    const { prompt, topic } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendChunk = (chunk: string) => {
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    };

    // Synthesize response based on topic/prompt
    let responseText = '';
    if (topic === 'competitors' || prompt.toLowerCase().includes('competitor')) {
      responseText = `### AI Competitor Intelligence Strategy\n\nBased on your startup profile, here is a custom competitive breakdown:\n\n1. **Legacy Incumbents**: They have distribution, but their UX is rigid. Leverage this by introducing visual 'Liquid Glass' controls.\n2. **Pricing Action**: Offer modular seats ($9/user/mo) instead of flat corporate contract traps ($499/mo minimum).\n3. **USP Alignment**: Focus heavily on mobile productivity widgets that legacy competitors lack.`;
    } else if (topic === 'roadmap' || prompt.toLowerCase().includes('roadmap') || prompt.toLowerCase().includes('okr')) {
      responseText = `### Actionable OKR Alignment Matrix\n\nHere are 3 key OKRs generated for this quarter:\n\n* **Objective 1**: Solidify customer validation metrics.\n  * *Key Result 1.1*: Interview 15 additional prospective users.\n  * *Key Result 1.2*: Achieve an Idea Validation score above 80/100.\n* **Objective 2**: Accelerate developer output velocity.\n  * *Key Result 2.1*: Complete 90% of backlog tasks in the active Sprint.\n  * *Key Result 2.2*: Keep burndown deviation under 15% variance.`;
    } else if (topic === 'gtm' || prompt.toLowerCase().includes('gtm') || prompt.toLowerCase().includes('marketing')) {
      responseText = `### GTM Strategy recommendations\n\n1. **Direct Outreach**: Source 100 founders on LinkedIn and direct them to your public survey.\n2. **Interactive SEO**: Build a free Calculator tool (e.g. "Runway Scenario Planner") and publish it to drive organic leads.\n3. **Founder Communities**: Share weekly retrospective logs on IndieHackers & ProductHunt.`;
    } else {
      responseText = `### AI Co-Founder Advisory\n\nI have reviewed your startup's workspace telemetry. Here are my instant recommendations:\n\n- **Validate Faster**: You have logged less than 5 interviews. Schedule 10 more chats with developers to confirm product-market fit.\n- **Sprint Cleanliness**: There are 3 tasks in 'In Progress' for over 6 days. Inspect blockers on your Kanban board.\n- **Pricing Model**: Ensure your value propositions explicitly match your subscription streams.`;
    }

    // Stream text in small chunks to mimic typing / LLM stream
    const words = responseText.split(' ');
    let currentIdx = 0;

    const interval = setInterval(() => {
      if (currentIdx >= words.length) {
        res.write('data: [DONE]\n\n');
        res.end();
        clearInterval(interval);
      } else {
        const chunk = words.slice(currentIdx, currentIdx + 4).join(' ') + ' ';
        sendChunk(chunk);
        currentIdx += 4;
      }
    }, 150);

  } catch (error) {
    console.error('AI Stream Error:', error);
    res.status(500).json({ error: 'AI processing failed.' });
  }
};

// Startup Health Scoring Algorithm & Risk Meters (Modules 14 & 15)
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
      const completedTasks = tasks.filter(t => t.status === 'Done').length;
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
    if (tasks.length > 0 && (tasks.filter(t => t.status === 'Done').length / tasks.length) < 0.4) {
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
      breakdown: {
        validation: Math.round((validationScore / 25) * 100),
        execution: Math.round((executionScore / 25) * 100),
        planning: Math.round((strategicScore / 25) * 100),
        traction: Math.round((tractionScore / 25) * 100)
      },
      insights,
      metricsSnapshot: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'Done').length,
        totalInterviews: interviews.length,
        pipelineLeads: investors.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate workspace health report.' });
  }
};
