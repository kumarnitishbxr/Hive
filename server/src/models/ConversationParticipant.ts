import { Schema, Document, model, Types } from 'mongoose';

export interface IConversationParticipant extends Document {
  conversationId: Types.ObjectId;
  userId: Types.ObjectId;
  role: 'Founder' | 'Co-Founder' | 'Mentor' | 'Team Member' | 'Guest';
  joinedAt: Date;
  leftAt?: Date;
  isActive: boolean;
  lastReadMessageId?: Types.ObjectId;
}

const ConversationParticipantSchema = new Schema<IConversationParticipant>({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  role: { 
    type: String, 
    enum: ['Founder', 'Co-Founder', 'Mentor', 'Team Member', 'Guest'], 
    required: true,
    default: 'Team Member'
  },
  joinedAt: { type: Date, default: Date.now },
  leftAt: { type: Date },
  isActive: { type: Boolean, default: true, index: true },
  lastReadMessageId: { type: Schema.Types.ObjectId, ref: 'Message' }
});

ConversationParticipantSchema.index({ conversationId: 1, userId: 1 }, { unique: true });

export const ConversationParticipant = model<IConversationParticipant>('ConversationParticipant', ConversationParticipantSchema);
export default ConversationParticipant;
