import { Schema, Document, model, Types } from 'mongoose';

export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'voice';
  text?: string;
  image?: string;
  file?: string;
  voice?: string;
  replyTo?: Types.ObjectId;
  edited: boolean;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  content: { type: String, required: true },
  messageType: { 
    type: String, 
    enum: ['text', 'image', 'file', 'voice'], 
    required: true, 
    default: 'text' 
  },
  text: { type: String },
  image: { type: String },
  file: { type: String },
  voice: { type: String },
  replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
  edited: { type: Boolean, default: false },
  deleted: { type: Boolean, default: false }
}, { timestamps: true });

MessageSchema.index({ conversationId: 1, createdAt: 1 });

MessageSchema.virtual('message').get(function(this: any) {
  return this.content;
});

MessageSchema.set('toObject', { virtuals: true });
MessageSchema.set('toJSON', { virtuals: true });

export const Message = model<IMessage>('Message', MessageSchema);
export default Message;
