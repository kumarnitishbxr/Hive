import { Schema, Document, model, Types } from 'mongoose';

export interface IConversation extends Document {
  workspaceId: Types.ObjectId;
  type: 'direct' | 'group' | 'announcement';
  private: boolean;
  group: boolean;
  announcement: boolean;
  name?: string;
  description?: string;
  createdBy: Types.ObjectId;
  lastMessage?: string;
  lastActivity: Date;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  type: { type: String, enum: ['direct', 'group', 'announcement'], required: true, default: 'direct' },
  private: { type: Boolean, default: true },
  group: { type: Boolean, default: false },
  announcement: { type: Boolean, default: false },
  name: { type: String },
  description: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastMessage: { type: String },
  lastActivity: { type: Date, default: Date.now, index: true },
  isArchived: { type: Boolean, default: false, index: true }
}, { timestamps: true });

export const Conversation = model<IConversation>('Conversation', ConversationSchema);
export default Conversation;
