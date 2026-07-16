import { Schema, Document as MongooseDocument, model } from 'mongoose';

export interface IDocument extends MongooseDocument {
  startupId: Schema.Types.ObjectId;
  name: string;
  category: 'Legal' | 'Incorporation' | 'NDA' | 'Agreements' | 'CapTable' | 'Financials' | 'Invoices' | 'Contracts' | 'General';
  url: string;
  sizeBytes: number;
  uploadedBy: Schema.Types.ObjectId;
  fileVersion: number;
  ocrText?: string;
  ocrStatus: 'Pending' | 'Completed' | 'Failed' | 'Unavailable';
  createdAt: Date;
  updatedAt: Date;
}

export interface IActivityLog extends MongooseDocument {
  startupId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  actionType: 'Create' | 'Update' | 'Delete' | 'Download' | 'Invite' | 'Onboarding';
  entityType: 'Task' | 'Project' | 'Milestone' | 'Document' | 'Investor' | 'Startup' | 'Canvas' | 'Feedback';
  entityId?: Schema.Types.ObjectId;
  description: string;
  createdAt: Date;
}

const DocumentSchema = new Schema<IDocument>({
  startupId: { type: Schema.Types.ObjectId, ref: 'Startup', required: true, index: true },
  name: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Legal', 'Incorporation', 'NDA', 'Agreements', 'CapTable', 'Financials', 'Invoices', 'Contracts', 'General'],
    required: true,
    index: true
  },
  url: { type: String, required: true },
  sizeBytes: { type: Number, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fileVersion: { type: Number, default: 1 },
  ocrText: { type: String },
  ocrStatus: { type: String, enum: ['Pending', 'Completed', 'Failed', 'Unavailable'], default: 'Pending' }
}, { timestamps: true });

// Setup text index for OCR search content
DocumentSchema.index({ name: 'text', ocrText: 'text' });

const ActivityLogSchema = new Schema<IActivityLog>({
  startupId: { type: Schema.Types.ObjectId, ref: 'Startup', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  actionType: { 
    type: String, 
    enum: ['Create', 'Update', 'Delete', 'Download', 'Invite', 'Onboarding'], 
    required: true 
  },
  entityType: { 
    type: String, 
    enum: ['Task', 'Project', 'Milestone', 'Document', 'Investor', 'Startup', 'Canvas', 'Feedback'], 
    required: true 
  },
  entityId: { type: Schema.Types.ObjectId },
  description: { type: String, required: true }
}, { timestamps: true });

export const DocumentModel = model<IDocument>('Document', DocumentSchema);
export const ActivityLog = model<IActivityLog>('ActivityLog', ActivityLogSchema);
