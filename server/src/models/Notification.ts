import { Schema, Document, model } from 'mongoose';

export interface INotification extends Document {
  receiverId: Schema.Types.ObjectId;
  senderId: Schema.Types.ObjectId;
  conversationId?: Schema.Types.ObjectId;
  messageId?: Schema.Types.ObjectId;
  type:
    | 'New Message'
    | 'Mention'
    | 'Announcement'
    | 'Task Assigned'
    | 'Task Updated'
    | 'Milestone Completed'
    | 'Feedback Received'
    | 'Idea Approved'
    | 'Investor Comment'
    | 'System Notification';
  title: string;
  description: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation' },
  messageId: { type: Schema.Types.ObjectId, ref: 'Message' },
  type: {
    type: String,
    enum: [
      'New Message',
      'Mention',
      'Announcement',
      'Task Assigned',
      'Task Updated',
      'Milestone Completed',
      'Feedback Received',
      'Idea Approved',
      'Investor Comment',
      'System Notification'
    ],
    required: true
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  isRead: { type: Boolean, default: false, index: true }
}, { timestamps: true });

export const Notification = model<INotification>('Notification', NotificationSchema);
export default Notification;
