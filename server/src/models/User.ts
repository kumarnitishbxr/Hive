import { Schema, Document, model } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash?: string;
  googleId?: string;
  githubId?: string;
  fullName: string;
  avatarUrl?: string;
  isVerified: boolean;
  verificationOtp?: string;
  otpExpiry?: Date;
  status: 'Active' | 'Suspended' | 'Onboarding';
  createdAt: Date;
  updatedAt: Date;
}

export interface IMember extends Document {
  startupId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  role: 'Founder' | 'Co-Founder' | 'Admin' | 'Team Member' | 'Mentor' | 'Investor' | 'Guest';
  departmentId?: Schema.Types.ObjectId;
  permissions: string[];
  joinedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String },
  googleId: { type: String, index: true },
  githubId: { type: String, index: true },
  fullName: { type: String, required: true },
  avatarUrl: { type: String },
  isVerified: { type: Boolean, default: false },
  verificationOtp: { type: String },
  otpExpiry: { type: Date },
  status: { type: String, enum: ['Active', 'Suspended', 'Onboarding'], default: 'Onboarding' }
}, { timestamps: true });

const MemberSchema = new Schema<IMember>({
  startupId: { type: Schema.Types.ObjectId, ref: 'Startup', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  role: { 
    type: String, 
    enum: ['Founder', 'Co-Founder', 'Admin', 'Team Member', 'Mentor', 'Investor', 'Guest'], 
    required: true 
  },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department', index: true },
  permissions: { type: [String], default: [] },
  joinedAt: { type: Date, default: Date.now }
});

export const User = model<IUser>('User', UserSchema);
export const Member = model<IMember>('Member', MemberSchema);
