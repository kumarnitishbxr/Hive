import { Schema, Document, model } from 'mongoose';

export interface ISprint extends Document {
  projectId: Schema.Types.ObjectId;
  name: string;
  goal?: string;
  startDate: Date;
  endDate: Date;
  status: 'Planning' | 'Active' | 'Completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface IProject extends Document {
  workspaceId: Schema.Types.ObjectId;
  departmentId?: Schema.Types.ObjectId;
  name: string;
  description?: string;
  status: 'Planning' | 'Active' | 'Paused' | 'Completed';
  createdBy: Schema.Types.ObjectId;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SprintSchema = new Schema<ISprint>({
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  name: { type: String, required: true },
  goal: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['Planning', 'Active', 'Completed'], default: 'Planning' }
}, { timestamps: true });

const ProjectSchema = new Schema<IProject>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department', index: true },
  name: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['Planning', 'Active', 'Paused', 'Completed'], default: 'Planning' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date },
  endDate: { type: Date }
}, { timestamps: true });

export const Sprint = model<ISprint>('Sprint', SprintSchema);
export const Project = model<IProject>('Project', ProjectSchema);
