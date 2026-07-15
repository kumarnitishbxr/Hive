import { Schema, Document, model } from 'mongoose';

export interface IAICitation {
  source: 'Task' | 'Project' | 'Milestone' | 'Document' | 'Chat' | 'Comment' | 'MeetingNote';
  title: string;
  link?: string;
}

export interface IAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: IAICitation[];
  suggestedFollowups?: string[];
  createdAt: Date;
}

export interface IAIConversation extends Document {
  workspaceId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  messages: IAIMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IAIMemory extends Document {
  workspaceId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  preferences: {
    theme?: string;
    focusArea?: string;
  };
  previousRecommendations: {
    category: string;
    recommendation: string;
    suggestedAt: Date;
    isFollowed: boolean;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IAIVector extends Document {
  workspaceId: Schema.Types.ObjectId;
  category: string; // 'Task' | 'Document' | 'Project' etc.
  refId: Schema.Types.ObjectId;
  text: string;
  vector: number[];
  metadata: Record<string, any>;
  createdAt: Date;
}

const AICitationSchema = new Schema<IAICitation>({
  source: { type: String, required: true },
  title: { type: String, required: true },
  link: { type: String }
});

const AIMessageSchema = new Schema<IAIMessage>({
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  citations: [AICitationSchema],
  suggestedFollowups: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

const AIConversationSchema = new Schema<IAIConversation>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  messages: [AIMessageSchema]
}, { timestamps: true });

const AIMemorySchema = new Schema<IAIMemory>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  preferences: {
    theme: { type: String },
    focusArea: { type: String }
  },
  previousRecommendations: [{
    category: { type: String, required: true },
    recommendation: { type: String, required: true },
    suggestedAt: { type: Date, default: Date.now },
    isFollowed: { type: Boolean, default: false }
  }]
}, { timestamps: true });

const AIVectorSchema = new Schema<IAIVector>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  category: { type: String, required: true, index: true },
  refId: { type: Schema.Types.ObjectId, required: true },
  text: { type: String, required: true },
  vector: { type: [Number], required: true },
  metadata: { type: Schema.Types.Map, of: Schema.Types.Mixed }
}, { timestamps: { createdAt: true, updatedAt: false } });

export const AIConversation = model<IAIConversation>('AIConversation', AIConversationSchema);
export const AIMemory = model<IAIMemory>('AIMemory', AIMemorySchema);
export const AIVectorStore = model<IAIVector>('AIVectorStore', AIVectorSchema);
