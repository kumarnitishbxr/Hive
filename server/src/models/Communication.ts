import { Schema, Document, model } from 'mongoose';

export interface IChannel extends Document {
  workspaceId: Schema.Types.ObjectId;
  name: string;
  description?: string;
  isPrivate: boolean;
  members: Schema.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage extends Document {
  channelId?: Schema.Types.ObjectId; // Empty if Direct Message
  workspaceId: Schema.Types.ObjectId;
  senderId: Schema.Types.ObjectId;
  recipientId?: Schema.Types.ObjectId; // Empty if Channel Message
  body: string;
  attachments: { name: string; url: string }[];
  createdAt: Date;
}

const ChannelSchema = new Schema<IChannel>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  isPrivate: { type: Boolean, default: false },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

const MessageSchema = new Schema<IMessage>({
  channelId: { type: Schema.Types.ObjectId, ref: 'Channel', index: true },
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  body: { type: String, required: true },
  attachments: [{
    name: { type: String, required: true },
    url: { type: String, required: true }
  }]
}, { timestamps: true });

export const Channel = model<IChannel>('Channel', ChannelSchema);
export const Message = model<IMessage>('Message', MessageSchema);
