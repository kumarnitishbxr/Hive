import { Schema, Document, model, Types } from 'mongoose';

export interface IMessageStatus extends Document {
  messageId: Types.ObjectId;
  userId: Types.ObjectId;
  status: 'SENT' | 'DELIVERED' | 'SEEN';
  timestamp: Date;
}

const MessageStatusSchema = new Schema<IMessageStatus>({
  messageId: { type: Schema.Types.ObjectId, ref: 'Message', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['SENT', 'DELIVERED', 'SEEN'], required: true },
  timestamp: { type: Date, default: Date.now }
});

MessageStatusSchema.index({ messageId: 1, userId: 1 }, { unique: true });

export const MessageStatus = model<IMessageStatus>('MessageStatus', MessageStatusSchema);
export default MessageStatus;
