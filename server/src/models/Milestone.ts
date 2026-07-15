import { Schema, Document, model } from 'mongoose';

export interface IMilestone extends Document {
  startupId: Schema.Types.ObjectId;
  title: string;
  description?: string;
  dueDate: Date;
  status: 'Pending' | 'Blocked' | 'Completed';
  progress: number; // 0 - 100
  riskIndicator: 'Low' | 'Medium' | 'High';
  dependencies: Schema.Types.ObjectId[]; // dependent milestones
  associatedTasks: Schema.Types.ObjectId[]; // tasks mapped to this milestone
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneSchema = new Schema<IMilestone>({
  startupId: { type: Schema.Types.ObjectId, ref: 'Startup', required: true, index: true },
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['Pending', 'Blocked', 'Completed'], default: 'Pending' },
  progress: { type: Number, default: 0 },
  riskIndicator: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  dependencies: [{ type: Schema.Types.ObjectId, ref: 'Milestone' }],
  associatedTasks: [{ type: Schema.Types.ObjectId, ref: 'Task' }]
}, { timestamps: true });

export default model<IMilestone>('Milestone', MilestoneSchema);
