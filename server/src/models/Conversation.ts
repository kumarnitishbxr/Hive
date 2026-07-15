import { Schema, Document, model } from 'mongoose';

export interface IConversation extends Document {
  workspaceId: Schema.Types.ObjectId;
  participants: Schema.Types.ObjectId[];
  type: 'direct' | 'group';
  name?: string;
  description?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  type: { type: String, enum: ['direct', 'group'], required: true },
  name: { type: String },
  description: { type: String },
  lastMessage: { type: String },
  lastMessageTime: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

// Ensure indices for participant query optimization
ConversationSchema.index({ workspaceId: 1, participants: 1 });

export const Conversation = model<IConversation>('Conversation', ConversationSchema);
export default Conversation;
