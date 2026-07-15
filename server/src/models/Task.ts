import { Schema, Document, model } from 'mongoose';

export interface ITimeLog extends Document {
  taskId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  hoursSpent: number;
  description?: string;
  loggedAt: Date;
}

export interface ITaskAttachment {
  name: string;
  url: string;
  uploadedBy: Schema.Types.ObjectId;
  createdAt: Date;
}

export interface ITaskChecklistItem {
  item: string;
  isCompleted: boolean;
  completedBy?: Schema.Types.ObjectId;
  completedAt?: Date;
}

export interface ITask extends Document {
  workspaceId: Schema.Types.ObjectId;
  projectId: Schema.Types.ObjectId;
  milestoneId?: Schema.Types.ObjectId;
  sprintId?: Schema.Types.ObjectId;
  title: string;
  description?: string;
  status: 'Backlog' | 'Todo' | 'To Do' | 'In Progress' | 'Blocked' | 'In Review' | 'Under Review' | 'Done' | 'Completed' | 'Approved' | 'Rejected';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assignees: Schema.Types.ObjectId[];
  reporter: Schema.Types.ObjectId;
  startDate?: Date;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  parentTaskId?: Schema.Types.ObjectId;
  labels: string[];
  tags: string[];
  dependencies: Schema.Types.ObjectId[]; // Array of taskIds this task depends on
  checklist: ITaskChecklistItem[];
  attachments: ITaskAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

const TimeLogSchema = new Schema<ITimeLog>({
  taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  hoursSpent: { type: Number, required: true },
  description: { type: String },
  loggedAt: { type: Date, default: Date.now }
});

const TaskSchema = new Schema<ITask>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  milestoneId: { type: Schema.Types.ObjectId, ref: 'Milestone', index: true },
  sprintId: { type: Schema.Types.ObjectId, ref: 'Sprint', index: true },
  title: { type: String, required: true },
  description: { type: String },
  status: { 
    type: String, 
    enum: ['Backlog', 'Todo', 'To Do', 'In Progress', 'Blocked', 'In Review', 'Under Review', 'Done', 'Completed', 'Approved', 'Rejected'], 
    default: 'Todo',
    index: true
  },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Urgent'], 
    default: 'Medium',
    index: true
  },
  assignees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date },
  dueDate: { type: Date },
  estimatedHours: { type: Number },
  actualHours: { type: Number, default: 0 },
  parentTaskId: { type: Schema.Types.ObjectId, ref: 'Task', index: true },
  labels: [{ type: String }],
  tags: [{ type: String }],
  dependencies: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
  checklist: [{
    item: { type: String, required: true },
    isCompleted: { type: Boolean, default: false },
    completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    completedAt: { type: Date }
  }],
  attachments: [{
    name: { type: String, required: true },
    url: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export const TimeLog = model<ITimeLog>('TimeLog', TimeLogSchema);
export const Task = model<ITask>('Task', TaskSchema);
