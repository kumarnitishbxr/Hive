export interface ICitation {
  source: 'Task' | 'Project' | 'Milestone' | 'Document' | 'Chat' | 'Comment' | 'MeetingNote';
  title: string;
  link?: string;
}

export interface IMessage {
  _id: string;
  sender: 'ai' | 'user';
  text: string;
  isStreaming?: boolean;
  citations?: ICitation[];
  suggestedFollowups?: string[];
  createdAt: string;
}

export interface IConversation {
  _id: string;
  title: string;
  workspaceId: string;
  messages: IMessage[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IMemoryItem {
  category: string;
  recommendation: string;
  suggestedAt: string;
  isFollowed: boolean;
}

export interface IAIRecommendation {
  title: string;
  category: string;
  description: string;
}
