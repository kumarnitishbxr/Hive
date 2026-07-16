import { Schema, Document, model } from 'mongoose';

export type InvitationRole = 'Founder' | 'Co-Founder' | 'Mentor' | 'Team Member';
export type InvitationStatus = 'Pending' | 'Accepted' | 'Expired' | 'Cancelled' | 'Rejected';
export type AuditAction =
  | 'INVITATION_SENT'
  | 'INVITATION_RESENT'
  | 'INVITATION_ACCEPTED'
  | 'INVITATION_REJECTED'
  | 'INVITATION_CANCELLED'
  | 'MEMBER_REMOVED'
  | 'MEMBER_SUSPENDED'
  | 'MEMBER_REACTIVATED'
  | 'ROLE_CHANGED'
  | 'PASSWORD_RESET';

export interface IInvitation extends Document {
  startupId: Schema.Types.ObjectId;
  memberId?: Schema.Types.ObjectId;
  invitedUserId?: Schema.Types.ObjectId;
  fullName: string;
  email: string;
  role: InvitationRole;
  phone?: string;
  department?: string;
  designation?: string;
  skills: string[];
  joiningDate?: Date;
  employmentType?: string;
  manager?: string;
  notes?: string;
  temporaryPasswordHash: string;
  invitedBy: Schema.Types.ObjectId;
  token: string;
  expiresAt: Date;
  status: InvitationStatus;
  acceptedAt?: Date;
  lastSentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IIdentityAuditLog extends Document {
  startupId: Schema.Types.ObjectId;
  actorUserId?: Schema.Types.ObjectId;
  targetUserId?: Schema.Types.ObjectId;
  memberId?: Schema.Types.ObjectId;
  invitationId?: Schema.Types.ObjectId;
  action: AuditAction;
  reason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema = new Schema<IInvitation>({
  startupId: { type: Schema.Types.ObjectId, ref: 'Startup', required: true, index: true },
  memberId: { type: Schema.Types.ObjectId, ref: 'Member' },
  invitedUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  fullName: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  role: { type: String, enum: ['Founder', 'Co-Founder', 'Mentor', 'Team Member'], required: true },
  phone: { type: String },
  department: { type: String },
  designation: { type: String },
  skills: { type: [String], default: [] },
  joiningDate: { type: Date },
  employmentType: { type: String },
  manager: { type: String },
  notes: { type: String },
  temporaryPasswordHash: { type: String, required: true },
  invitedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  token: { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date, required: true, index: true },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Expired', 'Cancelled', 'Rejected'],
    default: 'Pending',
    index: true
  },
  acceptedAt: { type: Date },
  lastSentAt: { type: Date, default: Date.now }
}, { timestamps: true });

InvitationSchema.index({ startupId: 1, email: 1, status: 1 });

const IdentityAuditLogSchema = new Schema<IIdentityAuditLog>({
  startupId: { type: Schema.Types.ObjectId, ref: 'Startup', required: true, index: true },
  actorUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  targetUserId: { type: Schema.Types.ObjectId, ref: 'User' },
  memberId: { type: Schema.Types.ObjectId, ref: 'Member' },
  invitationId: { type: Schema.Types.ObjectId, ref: 'Invitation' },
  action: {
    type: String,
    enum: [
      'INVITATION_SENT',
      'INVITATION_RESENT',
      'INVITATION_ACCEPTED',
      'INVITATION_REJECTED',
      'INVITATION_CANCELLED',
      'MEMBER_REMOVED',
      'MEMBER_SUSPENDED',
      'MEMBER_REACTIVATED',
      'ROLE_CHANGED',
      'PASSWORD_RESET'
    ],
    required: true,
    index: true
  },
  reason: { type: String },
  metadata: { type: Schema.Types.Map, of: Schema.Types.Mixed }
}, { timestamps: true });

export const Invitation = model<IInvitation>('Invitation', InvitationSchema);
export const IdentityAuditLog = model<IIdentityAuditLog>('IdentityAuditLog', IdentityAuditLogSchema);
