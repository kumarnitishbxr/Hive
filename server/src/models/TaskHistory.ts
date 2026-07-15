import { Schema, Document, model } from 'mongoose';

export interface ITaskHistory extends Document {
  taskId: Schema.Types.ObjectId;
  changedBy: Schema.Types.ObjectId;
  field: string;
  oldValue: string;
  newValue: string;
  createdAt: Date;
}

const TaskHistorySchema = new Schema<ITaskHistory>({
  taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
  changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  field: { type: String, required: true },
  oldValue: { type: String, default: '' },
  newValue: { type: String, default: '' }
}, { timestamps: { createdAt: true, updatedAt: false } });

export default model<ITaskHistory>('TaskHistory', TaskHistorySchema);
