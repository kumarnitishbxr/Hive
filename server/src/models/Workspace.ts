import { Schema, Document, model } from 'mongoose';

export interface IWorkspace extends Document {
  startupId: Schema.Types.ObjectId;
  name: string;
  description?: string;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDepartment extends Document {
  workspaceId: Schema.Types.ObjectId;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPage extends Document {
  workspaceId: Schema.Types.ObjectId;
  title: string;
  content: string; // Stored as markdown or JSON block string
  blocks?: any; // Rich TipTap node object structure
  parentPageId?: Schema.Types.ObjectId; // Hierarchical nesting
  isFolder: boolean;
  createdBy: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>({
  startupId: { type: Schema.Types.ObjectId, ref: 'Startup', required: true, index: true },
  name: { type: String, required: true },
  description: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const DepartmentSchema = new Schema<IDepartment>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  name: { type: String, required: true },
  description: { type: String }
}, { timestamps: true });

const PageSchema = new Schema<IPage>({
  workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true, index: true },
  title: { type: String, required: true, default: 'Untitled Page' },
  content: { type: String, default: '' },
  blocks: { type: Schema.Types.Mixed, default: {} },
  parentPageId: { type: Schema.Types.ObjectId, ref: 'Page', index: true },
  isFolder: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const Workspace = model<IWorkspace>('Workspace', WorkspaceSchema);
export const Department = model<IDepartment>('Department', DepartmentSchema);
export const Page = model<IPage>('Page', PageSchema);
