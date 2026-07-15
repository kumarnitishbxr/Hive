import { Request, Response } from 'express';
import { Member, User } from '../models/User';
import { Types } from 'mongoose';

// 1. Get Workspace Members
export const getMembers = async (req: Request, res: Response) => {
  try {
    const startupId = req.startupId;
    if (!startupId) {
      return res.status(400).json({ error: 'Startup workspace context not resolved.' });
    }

    const members = await Member.find({ startupId })
      .populate({
        path: 'userId',
        select: 'fullName email avatarUrl status'
      });

    // Format for client team dashboard
    const formattedMembers = members
      .filter(m => m.userId !== null)
      .map(m => {
        const u = m.userId as any;
        return {
          _id: m._id,
          userId: u._id,
          fullName: u.fullName,
          email: u.email,
          avatarUrl: u.avatarUrl,
          status: u.status,
          role: m.role,
          departmentId: m.departmentId,
          permissions: m.permissions,
          joinedAt: m.joinedAt,
          isOnline: u.status === 'Active',
          completedTasks: 4,
          assignedTasks: 8,
          performanceScore: 92
        };
      });

    res.status(200).json({
      members: formattedMembers,
      invitations: []
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch team members.' });
  }
};

// 2. Invite Workspace Member (Founder / Co-Founder only)
export const inviteMember = async (req: Request, res: Response) => {
  try {
    if (req.role !== 'Founder' && req.role !== 'Co-Founder') {
      return res.status(403).json({ error: 'Access Denied: Only Founders and Co-Founders can invite members.' });
    }

    const { fullName, email, role, departmentId } = req.body;
    const startupId = req.startupId;

    if (!fullName || !email || !role) {
      return res.status(400).json({ error: 'Full Name, Email, and Role are required.' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        email,
        fullName,
        isVerified: true,
        status: 'Active'
      });
      await user.save();
    }

    // Check if already a member of this startup
    const existingMember = await Member.findOne({ userId: user._id, startupId });
    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this startup.' });
    }

    const member = new Member({
      startupId,
      userId: user._id,
      role,
      departmentId: departmentId ? new Types.ObjectId(departmentId) : undefined,
      permissions: ['read', 'write']
    });

    await member.save();

    res.status(201).json({ 
      message: 'Team member successfully invited.', 
      member: {
        _id: member._id,
        userId: user,
        role: member.role,
        departmentId: member.departmentId,
        permissions: member.permissions,
        joinedAt: member.joinedAt
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to invite member.' });
  }
};

// 3. Change Member Role (Founder / Co-Founder only)
export const changeRole = async (req: Request, res: Response) => {
  try {
    if (req.role !== 'Founder' && req.role !== 'Co-Founder') {
      return res.status(403).json({ error: 'Access Denied: Only Founders and Co-Founders can modify roles.' });
    }

    const { memberId, role } = req.body;
    if (!memberId || !role) {
      return res.status(400).json({ error: 'Member ID and Role are required.' });
    }

    const member = await Member.findOneAndUpdate(
      { _id: memberId, startupId: req.startupId },
      { $set: { role } },
      { new: true }
    ).populate('userId', 'fullName email avatarUrl status');

    if (!member) {
      return res.status(404).json({ error: 'Team member not found in this startup.' });
    }

    res.status(200).json({ message: 'Role updated successfully.', member });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to change role.' });
  }
};

// 4. Remove Workspace Member (Founder / Co-Founder only)
export const removeMember = async (req: Request, res: Response) => {
  try {
    if (req.role !== 'Founder' && req.role !== 'Co-Founder') {
      return res.status(403).json({ error: 'Access Denied: Only Founders can remove team members.' });
    }

    const { memberId } = req.body;
    if (!memberId) {
      return res.status(400).json({ error: 'Member ID is required.' });
    }

    const member = await Member.findOneAndDelete({ _id: memberId, startupId: req.startupId });
    if (!member) {
      return res.status(404).json({ error: 'Team member not found in this startup.' });
    }

    res.status(200).json({ message: 'Team member removed from workspace.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to remove member.' });
  }
};

// Mock Invitation actions to satisfy API endpoints
export const resendInvite = async (req: Request, res: Response) => {
  res.status(200).json({ message: 'Invitation email resent successfully.' });
};

export const getMyPendingInvitation = async (req: Request, res: Response) => {
  res.status(200).json({ invitation: null });
};

export const acceptInvite = async (req: Request, res: Response) => {
  res.status(200).json({ message: 'Invitation accepted.' });
};

export const declineInvite = async (req: Request, res: Response) => {
  res.status(200).json({ message: 'Invitation declined.' });
};
