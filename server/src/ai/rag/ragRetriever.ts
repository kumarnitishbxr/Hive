import { getGeminiEmbedding } from '../embeddings/embeddingsService';
import { searchQdrant } from '../vector/qdrantClient';
import { getTasks, getProjects, getMilestones, getMembers } from '../../services/ai/tools';

export interface RAGMergedContext {
  liveDataContext: string;
  citations: { source: string; title: string; link?: string }[];
  ragMatches: any[];
}

export const retrieveRAGContext = async (
  workspaceId: string,
  query: string,
  role: string,
  userId: string
): Promise<RAGMergedContext> => {
  const queryVector = await getGeminiEmbedding(query);
  const citations: { source: string; title: string; link?: string }[] = [];

  // 1. Fetch RAG matches from vector store (collection 'Documents')
  const ragMatches = await searchQdrant(workspaceId, 'Documents', queryVector, 3);
  ragMatches.forEach(m => {
    citations.push({
      source: 'Document',
      title: m.text.substring(0, 35) + '...',
      link: m.metadata?.url
    });
  });

  // 2. Fetch live workspace metrics based on search query triggers
  let liveDataContext = '';
  const lowercaseQuery = query.toLowerCase();

  if (lowercaseQuery.includes('task') || lowercaseQuery.includes('sprint') || lowercaseQuery.includes('work')) {
    const tasks = await getTasks(workspaceId);
    // Role based check: Team members only see assigned tasks
    const filteredTasks = role === 'Team Member'
      ? tasks.filter((t: any) => t.assignees.some((uid: any) => uid._id.toString() === userId))
      : tasks;

    liveDataContext += `\n[Live Task Agent Telemetry]\nTotal tasks count: ${filteredTasks.length}\n`;
    filteredTasks.slice(0, 10).forEach((t: any) => {
      liveDataContext += `- Task: "${t.title}" (Status: ${t.status}, Priority: ${t.priority}, Due: ${t.dueDate ? t.dueDate.toISOString().split('T')[0] : 'N/A'})\n`;
    });
    citations.push({ source: 'Task', title: `${filteredTasks.length} Active Tasks` });
  }

  if (lowercaseQuery.includes('project') || lowercaseQuery.includes('milestone') || lowercaseQuery.includes('roadmap')) {
    const projects = await getProjects(workspaceId);
    const milestones = await getMilestones(workspaceId);

    liveDataContext += `\n[Live Project & Milestone Agent Telemetry]\nProjects:\n`;
    projects.forEach((p: any) => {
      liveDataContext += `- Project: "${p.name}" (Status: ${p.status})\n`;
    });

    liveDataContext += `Milestones:\n`;
    milestones.forEach((m: any) => {
      liveDataContext += `- Milestone: "${m.title}" (Status: ${m.status}, Due: ${m.dueDate ? m.dueDate.toISOString().split('T')[0] : 'N/A'})\n`;
    });
    citations.push({ source: 'Project', title: `${projects.length} Projects, ${milestones.length} Milestones` });
  }

  if (lowercaseQuery.includes('team') || lowercaseQuery.includes('members') || lowercaseQuery.includes('workload')) {
    const members = await getMembers(workspaceId);
    liveDataContext += `\n[Live Team Agent Telemetry]\nMembers:\n`;
    members.forEach((m: any) => {
      const u = m.userId as any;
      if (u) {
        liveDataContext += `- Member: "${u.fullName}" (Role: ${m.role}, Status: ${u.status})\n`;
      }
    });
    citations.push({ source: 'Chat', title: `Workspace Team List` });
  }

  return {
    liveDataContext,
    citations,
    ragMatches
  };
};
