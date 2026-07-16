import { Schema, Document, model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash?: string;
  googleId?: string;
  githubId?: string;
  fullName: string;
  avatarUrl?: string;
  phone?: string;
  bio?: string;
  skills?: string[];
  linkedInUrl?: string;
  githubUrl?: string;
  experience?: string;
  location?: string;
  isVerified: boolean;
  verificationOtp?: string;
  otpExpiry?: Date;
  firstLogin?: boolean;
  invitationAccepted?: boolean;
  status: 'Active' | 'Invited' | 'Suspended' | 'Removed' | 'Onboarding';
  createdAt: Date;
  updatedAt: Date;
}

export interface IMember extends Document {
  startupId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  role: 'Founder' | 'Co-Founder' | 'Admin' | 'Team Member' | 'Mentor' | 'Investor' | 'Guest';
  status: 'Active' | 'Invited' | 'Suspended' | 'Removed';
  departmentId?: Schema.Types.ObjectId;
  permissions: string[];
  joinedAt: Date;
  invitedAt?: Date;
  removedAt?: Date;
  suspendedAt?: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String },
  googleId: { type: String, index: true },
  githubId: { type: String, index: true },
  fullName: { type: String, required: true },
  avatarUrl: { type: String },
  phone: { type: String },
  bio: { type: String },
  skills: { type: [String], default: [] },
  linkedInUrl: { type: String },
  githubUrl: { type: String },
  experience: { type: String },
  location: { type: String },
  isVerified: { type: Boolean, default: false },
  verificationOtp: { type: String },
  otpExpiry: { type: Date },
  firstLogin: { type: Boolean, default: false },
  invitationAccepted: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['Active', 'Invited', 'Suspended', 'Removed', 'Onboarding'],
    default: 'Onboarding'
  }
}, { timestamps: true });

const MemberSchema = new Schema<IMember>({
  startupId: { type: Schema.Types.ObjectId, ref: 'Startup', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  role: {
    type: String,
    enum: ['Founder', 'Co-Founder', 'Admin', 'Team Member', 'Mentor', 'Investor', 'Guest'],
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Invited', 'Suspended', 'Removed'],
    default: 'Active',
    index: true
  },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department', index: true },
  permissions: { type: [String], default: [] },
  joinedAt: { type: Date, default: Date.now },
  invitedAt: { type: Date },
  removedAt: { type: Date },
  suspendedAt: { type: Date }
});

export const User = model<IUser>('User', UserSchema);
export const Member = model<IMember>('Member', MemberSchema);
