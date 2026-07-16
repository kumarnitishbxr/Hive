import axios from 'axios';
import { retrieveRAGContext } from '../rag/ragRetriever';
import { AGENT_SYSTEM_PROMPTS } from '../prompts/promptTemplates';

const GEMINI_API = process.env.GEMINI_API || '';

export interface PlannerContext {
  workspaceId: string;
  userId: string;
  role: string;
  prompt: string;
  history: { role: string; content: string }[];
}

export const executePlannerWorkflow = async (
  context: PlannerContext,
  onToken: (token: string) => void,
  onComplete: (data: { citations: any[]; suggestedFollowups: string[] }) => void
) => {
  const { workspaceId, userId, role, prompt, history } = context;

  // 1. RAG retrieval merges vector search and live MongoDB datasets
  const ragData = await retrieveRAGContext(workspaceId, prompt, role, userId);
  
  // 2. Select appropriate system prompt based on user query
  let selectedPrompt = AGENT_SYSTEM_PROMPTS.Planner;
  const lowercase = prompt.toLowerCase();
  if (lowercase.includes('task') || lowercase.includes('sprint')) {
    selectedPrompt += '\n' + AGENT_SYSTEM_PROMPTS.Task;
  } else if (lowercase.includes('project') || lowercase.includes('roadmap')) {
    selectedPrompt += '\n' + AGENT_SYSTEM_PROMPTS.Project;
  } else if (lowercase.includes('team') || lowercase.includes('workload')) {
    selectedPrompt += '\n' + AGENT_SYSTEM_PROMPTS.Team;
  } else if (lowercase.includes('analytics') || lowercase.includes('velocity') || lowercase.includes('burn')) {
    selectedPrompt += '\n' + AGENT_SYSTEM_PROMPTS.Analytics;
  } else if (lowercase.includes('pmf') || lowercase.includes('survey') || lowercase.includes('interview')) {
    selectedPrompt += '\n' + AGENT_SYSTEM_PROMPTS.Mentor;
  }

  // 3. Compile prompt blocks
  const systemText = `${selectedPrompt}
  
  ROLE ACCESS POLICIES:
  - Founder has complete metrics visibility.
  - Co-founder gets execution standups.
  - Team members ONLY see tasks assigned to them (do not share financial runway details).
  
  LIVE WORKSPACE TELEMETRY:
  ${ragData.liveDataContext || 'No live data context loaded.'}
  
  RAG DOCUMENTS REFERENCED:
  ${ragData.ragMatches.map(m => `- Segment: "${m.text}"`).join('\n') || 'No documents retrieved.'}`;

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
            parts: [{ text: systemText }]
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
                } catch (e) {}
                chunkBuffer = chunkBuffer.substring(i + 1);
                i = -1;
                startIdx = -1;
              }
            }
          }
        });

        stream.on('end', () => resolve());
        stream.on('error', (err: any) => reject(err));
      });

      onComplete({
        citations: ragData.citations,
        suggestedFollowups: ['Show blocked tasks', 'Suggest next tasks', 'Generate sprint roadmap']
      });
      return;
    } catch (err) {
      console.warn('Gemini stream execution failed in PlannerAgent, fallback triggered:', err);
    }
  }

  // Fallback streaming brief
  const fallbackText = `### AI Co-Founder Audit\n\nI sweeps the workspace context for Hive:\n\n` +
    `- **Execution Status**: Velocity remains consistent. Active items are logged.\n` +
    `- **Recommendations**: Schedule standup task reviews and checklist confirmations.`;

  const words = fallbackText.split(' ');
  let currentIdx = 0;
  const interval = setInterval(() => {
    if (currentIdx >= words.length) {
      clearInterval(interval);
      onComplete({
        citations: ragData.citations,
        suggestedFollowups: ['Show blocked tasks', 'What should we work on next?']
      });
    } else {
      onToken(words.slice(currentIdx, currentIdx + 4).join(' ') + ' ');
      currentIdx += 4;
    }
  }, 100);
};
export default executePlannerWorkflow;
