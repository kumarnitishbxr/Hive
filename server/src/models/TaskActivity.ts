import { Schema, Document, model } from 'mongoose';

export interface ITaskActivity extends Document {
  taskId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  action: string;
  details?: string;
  createdAt: Date;
}

const TaskActivitySchema = new Schema<ITaskActivity>({
  taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  details: { type: String }
}, { timestamps: { createdAt: true, updatedAt: false } });

export default model<ITaskActivity>('TaskActivity', TaskActivitySchema);
