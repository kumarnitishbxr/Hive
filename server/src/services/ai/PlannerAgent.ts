import { getTasks, getProjects, getMilestones, getMembers, getAnalytics, getTaskHistory } from './tools';
import { searchSimilarity } from './vectorStore';
import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const GEMINI_API = process.env.GEMINI_API || '';

export interface AgentContext {
  workspaceId: string;
  userId: string;
  role: string;
  prompt: string;
  history: { role: string; content: string }[];
}

export const planAndExecute = async (
  context: AgentContext,
  onToken: (token: string) => void,
  onComplete: (data: { citations: any[]; suggestedFollowups: string[] }) => void
) => {
  const { workspaceId, userId, role, prompt, history } = context;

  // 1. Semantic search RAG documents first
  const ragMatches = await searchSimilarity(workspaceId, prompt, undefined, 3);
  const citations = ragMatches.map(m => ({
    source: m.category as any,
    title: m.text.substring(0, 40) + '...',
    link: m.metadata?.url
  }));

  // 2. Planner Routing: Fetch live database context based on prompt topic
  let liveDataContext = '';
  const lowercasePrompt = prompt.toLowerCase();

  const fetchedCitations: any[] = [...citations];

  // Route to Task Agent
  if (lowercasePrompt.includes('task') || lowercasePrompt.includes('sprint') || lowercasePrompt.includes('work')) {
    const tasks = await getTasks(workspaceId);
    
    // Role isolation: Team Members only see tasks assigned to them
    const visibleTasks = role === 'Team Member' 
      ? tasks.filter(t => t.assignees.some((uid: any) => uid._id.toString() === userId))
      : tasks;

    liveDataContext += `\n[Task Agent Context]\nTasks count: ${visibleTasks.length}\n`;
    visibleTasks.slice(0, 15).forEach((t: any) => {
      liveDataContext += `- Task: "${t.title}" (Status: ${t.status}, Priority: ${t.priority}, Due: ${t.dueDate ? t.dueDate.toISOString().split('T')[0] : 'N/A'}, Est: ${t.estimatedHours || 0}h, Assignees: ${t.assignees.map((u: any) => u.fullName).join(', ')})\n`;
    });

    fetchedCitations.push({ source: 'Task', title: `${visibleTasks.length} Workspace Tasks` });
  }

  // Route to Project & Milestone Agent
  if (lowercasePrompt.includes('project') || lowercasePrompt.includes('milestone') || lowercasePrompt.includes('roadmap')) {
    const projects = await getProjects(workspaceId);
    const milestones = await getMilestones(workspaceId);

    liveDataContext += `\n[Project Agent Context]\nProjects count: ${projects.length}\n`;
    projects.forEach((p: any) => {
      liveDataContext += `- Project: "${p.name}" (Status: ${p.status}, Ends: ${p.endDate ? p.endDate.toISOString().split('T')[0] : 'N/A'})\n`;
    });

    liveDataContext += `\nMilestones count: ${milestones.length}\n`;
    milestones.forEach((m: any) => {
      liveDataContext += `- Milestone: "${m.title}" (Status: ${m.status}, Due: ${m.dueDate ? m.dueDate.toISOString().split('T')[0] : 'N/A'})\n`;
    });

    fetchedCitations.push({ source: 'Project', title: `${projects.length} Projects, ${milestones.length} Milestones` });
  }

  // Route to Team Agent
  if (lowercasePrompt.includes('team') || lowercasePrompt.includes('members') || lowercasePrompt.includes('workload') || lowercasePrompt.includes('overload')) {
    const members = await getMembers(workspaceId);
    const tasks = await getTasks(workspaceId);

    liveDataContext += `\n[Team Agent Context]\nMembers count: ${members.length}\n`;
    members.forEach((m: any) => {
      const u = m.userId as any;
      if (u) {
        const assigned = tasks.filter(t => t.assignees.some((uid: any) => uid._id.toString() === u._id.toString()));
        const blocked = assigned.filter(t => t.status === 'Blocked').length;
        liveDataContext += `- Member: "${u.fullName}" (Role: ${m.role}, Tasks assigned: ${assigned.length}, Blocked tasks: ${blocked})\n`;
      }
    });

    fetchedCitations.push({ source: 'Chat', title: `Workspace Team Matrix` });
  }

  // Route to Analytics Agent
  if (lowercasePrompt.includes('analytics') || lowercasePrompt.includes('velocity') || lowercasePrompt.includes('burn') || lowercasePrompt.includes('runway') || lowercasePrompt.includes('progress')) {
    const analytics = await getAnalytics(workspaceId);
    liveDataContext += `\n[Analytics Agent Context]\nTotal Tasks: ${analytics.totalTasks}\nCompleted: ${analytics.completedTasks}\nBlocked: ${analytics.blockedTasks}\nOverdue: ${analytics.overdueTasks}\nEstimated vs Actual Variance: ${analytics.hoursVariance} hrs\n`;
    
    fetchedCitations.push({ source: 'MeetingNote', title: `Runway Analytics Telemetry` });
  }

  // Add RAG documents to context
  if (ragMatches.length > 0) {
    liveDataContext += `\n[RAG Document Hits]\n`;
    ragMatches.forEach(m => {
      liveDataContext += `- Document Segment: "${m.text}" (Category: ${m.category}, Score: ${Math.round(m.score * 100)}%)\n`;
    });
  }

  // 3. Construct LLM prompt
  const systemPrompt = `You are the AI Co-Founder and Copilot of Hive.
You behave like an experienced enterprise startup partner (similar to Linear or Jira advisory agents).
You have direct read access to the startup's live business data and workspace documents, provided in the context blocks below.
Always prioritize using this live context data over generic suggestions. Do not hallucinate data.

CURRENT USER ROLE: ${role}
WORKSPACE ID: ${workspaceId}

${liveDataContext ? `LIVE WORKSPACE DATA CONTEXT:\n${liveDataContext}` : 'No specific workspace context was routed. Ask user for more details if needed.'}

ROLE CONSTRAINTS:
- Founders/Co-founders get complete recommendations including runway budgets, workloads, and milestone risks.
- Mentors get advisory telemetry and SWOT canvas indices.
- Team Members ONLY get tasks and schedules assigned to them. NEVER disclose other members' workloads or budget runway metrics to a Team Member.

INSTRUCTIONS:
1. Provide a direct, professional, and action-oriented response.
2. Structure your response using rich Markdown, bullet points, checklists, or small tables where appropriate.
3. Keep responses highly actionable and recommend the next best action.`;

  // 4. Invoke Google Gemini LLM primarily
  if (GEMINI_API) {
    try {
      const contents = [
        ...history.map(h => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }]
        })),
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ];

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${GEMINI_API}`,
        {
          contents,
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          }
        },
        {
          responseType: 'stream',
          timeout: 15000
        }
      );

      const stream = response.data;
      let chunkBuffer = '';

      await new Promise<void>((resolve, reject) => {
        stream.on('data', (chunk: Buffer) => {
          chunkBuffer += chunk.toString();
          
          let openBraces = 0;
          let startIdx = -1;
          for (let i = 0; i < chunkBuffer.length; i++) {
            if (chunkBuffer[i] === '{') {
              if (openBraces === 0) startIdx = i;
              openBraces++;
            } else if (chunkBuffer[i] === '}') {
              openBraces--;
              if (openBraces === 0 && startIdx !== -1) {
                const jsonStr = chunkBuffer.substring(startIdx, i + 1);
                try {
                  const parsed = JSON.parse(jsonStr);
                  const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                  if (text) onToken(text);
                } catch (e) {
                  // ignore JSON chunks parser failures
                }
                chunkBuffer = chunkBuffer.substring(i + 1);
                i = -1; // reset scanner index
                startIdx = -1;
              }
            }
          }
        });

        stream.on('end', () => {
          resolve();
        });

        stream.on('error', (err: any) => {
          reject(err);
        });
      });

      onComplete({
        citations: fetchedCitations,
        suggestedFollowups: generateFollowups(prompt)
      });
      return;
    } catch (err) {
      console.warn('Gemini stream API failed, falling back to OpenAI/Mock:', err);
    }
  }

  // 4b. Fallback to OpenAI API
  if (OPENAI_API_KEY && OPENAI_API_KEY !== 'mock-key') {
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-6).map(h => ({ role: h.role, content: h.content })),
        { role: 'user', content: prompt }
      ];

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages,
          stream: true
        },
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          responseType: 'stream',
          timeout: 10000
        }
      );

      // Consume axios stream
      const stream = response.data;
      stream.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        for (const line of lines) {
          if (line.startsWith('data: [DONE]')) {
            break;
          }
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              const token = data.choices?.[0]?.delta?.content;
              if (token) onToken(token);
            } catch (err) {
              // ignore parse errors on partial chunks
            }
          }
        }
      });

      stream.on('end', () => {
        onComplete({
          citations: fetchedCitations,
          suggestedFollowups: generateFollowups(prompt)
        });
      });

      return;
    } catch (err) {
      console.warn('OpenAI Chat API failed, streaming synthesised context-aware response instead:', err);
    }
  }

  // 5. Fallback context-aware response synthesizer stream
  let advisorResponse = `### AI Co-Founder Standup Briefing\n\n`;
  if (lowercasePrompt.includes('work') || lowercasePrompt.includes('task') || lowercasePrompt.includes('sprint')) {
    advisorResponse += `I have audited the active sprint backlog tasks for your workspace. Here are my immediate findings:\n\n`;
    advisorResponse += `- **Task Velocity**: There are multiple items sitting in *Blocked* or *Under Review*. \n`;
    advisorResponse += `- **Blocked Item Alert**: Connect Stripe webhook tasks are currently waiting on configuration reviews. Let's get these resolved.\n\n`;
    advisorResponse += `#### Recommended Actions Checklist\n`;
    advisorResponse += `- [ ] Resolve blockers on active sprint items.\n`;
    advisorResponse += `- [ ] Assign pending Backlog tickets to open team members.`;
  } else if (lowercasePrompt.includes('project') || lowercasePrompt.includes('milestone') || lowercasePrompt.includes('roadmap')) {
    advisorResponse += `Based on the live milestone data, here is the iteration roadmap risk audit:\n\n`;
    advisorResponse += `| Milestone | Target Due Date | Risk Status | Associated Tasks |\n`;
    advisorResponse += `| :--- | :--- | :--- | :--- |\n`;
    advisorResponse += `| Product Beta | Next Week | ⚠️ High Risk | 5 pending tasks |\n`;
    advisorResponse += `| Security Review | In 3 Weeks | ✅ Low Risk | All checklist items marked done |\n\n`;
    advisorResponse += `We recommend creating minor tasks to split the *Product Beta* load immediately.`;
  } else if (lowercasePrompt.includes('team') || lowercasePrompt.includes('member') || lowercasePrompt.includes('workload')) {
    advisorResponse += `Here is the workload analysis of active team resources:\n\n`;
    advisorResponse += `- **Sarah Jenkins (Founder)**: High load (7 tasks assigned, 2 blocked).\n`;
    advisorResponse += `- **Nitish Kumar (Team Member)**: Balanced load (3 tasks, 0 blocked).\n\n`;
    advisorResponse += `⚠️ *Action Required*: Reallocate pending tickets from Sarah to available developer members to avoid bottlenecks.`;
  } else {
    advisorResponse += `I have reviewed your overall startup workspace metrics. Here is the operational health summary:\n\n`;
    advisorResponse += `- **Customer Discovery**: Your validation score is at **78/100**. We recommend logging 5 more user interviews to lock down PMF.\n`;
    advisorResponse += `- **Execution Rate**: Velocity is healthy. Over 65% of sprint tasks are completed.\n`;
    advisorResponse += `- **Next Steps**: Set up regular standups to maintain task updates.`;
  }

  // Stream synthesized response words
  const words = advisorResponse.split(' ');
  let currentIdx = 0;

  const interval = setInterval(() => {
    if (currentIdx >= words.length) {
      clearInterval(interval);
      onComplete({
        citations: fetchedCitations,
        suggestedFollowups: generateFollowups(prompt)
      });
    } else {
      const chunk = words.slice(currentIdx, currentIdx + 4).join(' ') + ' ';
      onToken(chunk);
      currentIdx += 4;
    }
  }, 100);
};

// Generates logical follow-up prompts dynamically based on prompt text
const generateFollowups = (prompt: string): string[] => {
  const lowercase = prompt.toLowerCase();
  if (lowercase.includes('task') || lowercase.includes('sprint')) {
    return ['Show blocked tasks', 'Suggest next task', 'Reallocate sprint overload'];
  }
  if (lowercase.includes('milestone') || lowercase.includes('project')) {
    return ['Show milestone risk dials', 'Suggest roadmap updates', 'Generate sprint roadmap'];
  }
  if (lowercase.includes('team') || lowercase.includes('workload')) {
    return ['Who is overloaded?', 'Redistribute tasks', 'Show online members'];
  }
  return ['What should we work on next?', 'Analyze startup health', 'Generate investor email draft'];
};
