import { Schema } from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        fullName: string;
      };
      startupId?: string;
      workspaceId?: string;
      role?: 'Founder' | 'Co-Founder' | 'Admin' | 'Team Member' | 'Mentor' | 'Investor' | 'Guest';
    }
  }
}
