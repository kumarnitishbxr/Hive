import { Schema, Document, model } from 'mongoose';

export interface IMessage extends Document {
  conversationId: Schema.Types.ObjectId;
  senderId: Schema.Types.ObjectId;
  message: string;
  attachments: {
    name: string;
    url: string;
    fileType: string;
  }[];
  replyTo?: Schema.Types.ObjectId;
  seenBy: Schema.Types.ObjectId[];
  deliveredTo: Schema.Types.ObjectId[];
  edited: boolean;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  message: { type: String, required: true },
  attachments: [{
    name: { type: String, required: true },
    url: { type: String, required: true },
    fileType: { type: String, default: 'file' }
  }],
  replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
  seenBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  deliveredTo: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  edited: { type: Boolean, default: false },
  deleted: { type: Boolean, default: false }
}, { timestamps: true });

// Index for getting message history for a conversation chronologically
MessageSchema.index({ conversationId: 1, createdAt: 1 });

export const Message = model<IMessage>('Message', MessageSchema);
export default Message;
