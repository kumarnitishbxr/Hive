import { Schema, Document, model } from 'mongoose';

export interface ITaskReply {
  _id: Schema.Types.ObjectId;
  author: Schema.Types.ObjectId;
  content: string;
  createdAt: Date;
}

export interface ITaskComment extends Document {
  taskId: Schema.Types.ObjectId;
  author: Schema.Types.ObjectId;
  content: string;
  replies: ITaskReply[];
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskReplySchema = new Schema<ITaskReply>({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const TaskCommentSchema = new Schema<ITaskComment>({
  taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  replies: [TaskReplySchema],
  attachments: [{ type: String }]
}, { timestamps: true });

export default model<ITaskComment>('TaskComment', TaskCommentSchema);
