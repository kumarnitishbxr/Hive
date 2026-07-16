import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Member } from '../models/User';
import config from '../config';

const JWT_SECRET = config.jwtSecret;
const USABLE_MEMBERSHIP_STATUSES = ['Active', 'Invited', 'Suspended'] as const;

const buildUsableMembershipFilter = () => ({
  $or: [
    { status: { $in: [...USABLE_MEMBERSHIP_STATUSES] } },
    { status: { $exists: false } },
    { status: null }
  ]
});

export interface TokenPayload {
  id: string;
  email: string;
  fullName: string;
}

export const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    let token = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.headers.cookie) {
      // Direct cookie check (fallback for SSR/Vercel integrations)
      const cookies = req.headers.cookie.split(';').reduce((acc: any, c) => {
        const [key, val] = c.trim().split('=');
        acc[key] = val;
        return acc;
      }, {});
      token = cookies['token'];
    }

    if (!token) {
      return res.status(401).json({ error: 'Access Denied: No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Access Denied: Invalid authentication token' });
  }
};

// Injects the startup context and checks roles inside the startup workspace
export const tenantIsolated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Access Denied: User not authenticated' });
    }

    // Try to retrieve the startupId from request headers or query params
    const startupId = req.headers['x-startup-id'] as string || req.query.startupId as string || req.body.startupId as string;

    const invitedOnlyPaths = new Set([
      '/api/team/my-pending-invitation',
      '/api/team/accept-invite',
      '/api/team/decline-invite'
    ]);

    const ensureMembershipIsUsable = (status?: string | null) => {
      if (status === 'Suspended') {
        return 'Your workspace membership is suspended.';
      }
      if (status === 'Invited' && !invitedOnlyPaths.has(req.originalUrl.split('?')[0])) {
        return 'Invitation acceptance is required before accessing the workspace.';
      }
      return null;
    };

    if (!startupId) {
      // Find the first member startup this user belongs to
      const memberRecord = await Member.findOne({
        userId: req.user.id,
        ...buildUsableMembershipFilter()
      }).sort({ createdAt: -1 });
      if (!memberRecord) {
        return res.status(403).json({ error: 'User is not associated with any startup workspace. Please complete onboarding.' });
      }
      const unusableReason = ensureMembershipIsUsable(memberRecord.status);
      if (unusableReason) {
        return res.status(403).json({ error: unusableReason });
      }
      req.startupId = memberRecord.startupId.toString();
      req.role = memberRecord.role;
      return next();
    }

    // Verify membership of the user in the target startup
    const memberRecord = await Member.findOne({
      userId: req.user.id,
      startupId,
      ...buildUsableMembershipFilter()
    });
    if (!memberRecord) {
      return res.status(403).json({ error: 'Access Denied: You do not belong to this startup tenant' });
    }
    const unusableReason = ensureMembershipIsUsable(memberRecord.status);
    if (unusableReason) {
      return res.status(403).json({ error: unusableReason });
    }

    req.startupId = memberRecord.startupId.toString();
    req.role = memberRecord.role;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error in Tenant Resolution' });
  }
};

// Checks authorization against a list of roles
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.role) {
      return res.status(403).json({ error: 'Forbidden: No role context resolved' });
    }

    if (!allowedRoles.includes(req.role)) {
      return res.status(403).json({ error: `Forbidden: This action requires one of the following roles: [${allowedRoles.join(', ')}]` });
    }

    next();
  };
};
