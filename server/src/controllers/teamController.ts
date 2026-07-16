import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { IdentityAuditLog, Invitation } from '../models/Invitation';
import { Member, User } from '../models/User';
import Startup from '../models/Startup';
import { Workspace } from '../models/Workspace';
import { Conversation } from '../models/Conversation';
import { ConversationParticipant } from '../models/ConversationParticipant';
import { Message } from '../models/Message';
import { sendInvitationEmail, sendMemberStatusEmail, sendPasswordResetEmail } from '../utils/mailer';

type WorkspaceRole = 'Founder' | 'Co-Founder' | 'Mentor' | 'Team Member';

const INVITABLE_ROLES: Record<WorkspaceRole, WorkspaceRole[]> = {
  Founder: ['Founder', 'Co-Founder', 'Mentor', 'Team Member'],
  'Co-Founder': ['Mentor', 'Team Member'],
  Mentor: [],
  'Team Member': []
};

const MANAGEABLE_ROLES: Record<WorkspaceRole, WorkspaceRole[]> = {
  Founder: ['Founder', 'Co-Founder', 'Mentor', 'Team Member'],
  'Co-Founder': ['Mentor', 'Team Member'],
  Mentor: [],
  'Team Member': []
};

const ROLE_OPTIONS: WorkspaceRole[] = ['Founder', 'Co-Founder', 'Mentor', 'Team Member'];

const generateTemporaryPassword = () => {
  return crypto.randomBytes(9).toString('base64url') + 'A1!';
};

const generateInvitationToken = () => crypto.randomBytes(32).toString('hex');

const normalizeInvitation = (invitation: any) => ({
  _id: invitation._id,
  name: invitation.fullName,
  email: invitation.email,
  role: invitation.role,
  status: invitation.status,
  createdAt: invitation.createdAt,
  expiresAt: invitation.expiresAt,
  phone: invitation.phone,
  designation: invitation.designation,
  skills: invitation.skills,
  employmentType: invitation.employmentType
});

const logAudit = async (
  startupId: string,
  action: any,
  actorUserId?: string,
  payload?: {
    targetUserId?: string;
    memberId?: string;
    invitationId?: string;
    reason?: string;
    metadata?: Record<string, any>;
  }
) => {
  await IdentityAuditLog.create({
    startupId,
    actorUserId,
    targetUserId: payload?.targetUserId,
    memberId: payload?.memberId,
    invitationId: payload?.invitationId,
    action,
    reason: payload?.reason,
    metadata: payload?.metadata || {}
  });
};

const assertRoleAllowed = (actorRole: string | undefined, targetRole: WorkspaceRole, action: 'invite' | 'manage') => {
  const policy = action === 'invite' ? INVITABLE_ROLES : MANAGEABLE_ROLES;
  const allowed = actorRole && actorRole in policy ? policy[actorRole as WorkspaceRole] : [];
  if (!allowed.includes(targetRole)) {
    throw new Error(`You are not allowed to ${action} role "${targetRole}".`);
  }
};

const markExpiredInvitations = async (startupId: string) => {
  await Invitation.updateMany(
    { startupId, status: 'Pending', expiresAt: { $lt: new Date() } },
    { $set: { status: 'Expired' } }
  );
};

// 1. Get Workspace Members + Invitation History + Audit Logs
export const getMembers = async (req: Request, res: Response) => {
  try {
    const startupId = req.startupId;
    if (!startupId) {
      return res.status(400).json({ error: 'Startup workspace context not resolved.' });
    }

    await markExpiredInvitations(startupId);

    const members = await Member.find({ startupId, status: { $ne: 'Removed' } })
      .populate({
        path: 'userId',
        select: 'fullName email avatarUrl status phone skills location invitationAccepted'
      })
      .sort({ joinedAt: -1 });

    const invitations = await Invitation.find({ startupId })
      .sort({ createdAt: -1 })
      .limit(100);

    const auditLogs = await IdentityAuditLog.find({ startupId })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('actorUserId', 'fullName email')
      .populate('targetUserId', 'fullName email');

    const formattedMembers = members
      .filter(m => m.userId !== null)
      .map((m) => {
        const u = m.userId as any;
        const isOnline = m.status === 'Active' && u.status === 'Active';
        return {
          _id: m._id,
          userId: u._id,
          fullName: u.fullName,
          email: u.email,
          avatarUrl: u.avatarUrl,
          phone: u.phone,
          skills: u.skills || [],
          location: u.location,
          status: m.status,
          userStatus: u.status,
          role: m.role,
          departmentId: m.departmentId,
          permissions: m.permissions,
          joinedAt: m.joinedAt,
          invitedAt: m.invitedAt,
          invitationAccepted: u.invitationAccepted,
          isOnline,
          completedTasks: 0,
          assignedTasks: 0,
          performanceScore: 0
        };
      });

    res.status(200).json({
      members: formattedMembers,
      invitations: invitations.map(normalizeInvitation),
      auditLogs
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch team members.' });
  }
};

// 2. Invite Workspace Member
export const inviteMember = async (req: Request, res: Response) => {
  try {
    const startupId = req.startupId;
    const actorId = req.user?.id;
    const actorRole = req.role as WorkspaceRole | undefined;

    if (!startupId || !actorId || !actorRole) {
      return res.status(401).json({ error: 'Invitation context not resolved.' });
    }

    const {
      fullName,
      email,
      role,
      phone,
      department,
      designation,
      skills,
      joiningDate,
      employmentType,
      manager,
      notes
    } = req.body;

    if (!fullName || !email || !role) {
      return res.status(400).json({ error: 'Full Name, Email, and Role are required.' });
    }

    if (!ROLE_OPTIONS.includes(role)) {
      return res.status(400).json({ error: 'Unsupported invitation role.' });
    }

    assertRoleAllowed(actorRole, role, 'invite');

    const normalizedEmail = String(email).trim().toLowerCase();
    const startup = await Startup.findById(startupId);
    if (!startup) {
      return res.status(404).json({ error: 'Workspace not found.' });
    }

    await markExpiredInvitations(startupId);

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser?.status === 'Removed') {
      return res.status(400).json({ error: 'Cannot invite a removed user record.' });
    }
    if (existingUser?.status === 'Suspended') {
      return res.status(400).json({ error: 'Cannot invite a suspended user record.' });
    }

    const existingInvitation = await Invitation.findOne({
      startupId,
      email: normalizedEmail,
      status: 'Pending'
    });
    if (existingInvitation) {
      return res.status(400).json({ error: 'A pending invitation already exists for this email.' });
    }

    const existingMember = existingUser
      ? await Member.findOne({ startupId, userId: existingUser._id, status: { $ne: 'Removed' } })
      : null;
    if (existingMember) {
      return res.status(400).json({ error: 'User is already associated with this workspace.' });
    }

    if (role === 'Founder') {
      const founderExists = await Member.exists({ startupId, role: 'Founder', status: { $ne: 'Removed' } });
      if (founderExists) {
        return res.status(400).json({ error: 'Founder already exists for this workspace.' });
      }
    }

    const temporaryPassword = generateTemporaryPassword();
    const temporaryPasswordHash = await bcrypt.hash(temporaryPassword, 10);
    const token = generateInvitationToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    let user;
    if (existingUser) {
      user = existingUser;
    } else {
      user = new User({
        email: normalizedEmail,
        fullName,
        phone,
        skills: Array.isArray(skills) ? skills : [],
        isVerified: true,
        passwordHash: temporaryPasswordHash,
        firstLogin: true,
        invitationAccepted: false,
        status: 'Invited'
      });
      await user.save();
    }

    const member = await Member.create({
      startupId,
      userId: user._id,
      role,
      status: 'Invited',
      permissions: ['read'],
      invitedAt: new Date(),
      joinedAt: new Date()
    });

    const invitation = await Invitation.create({
      startupId,
      memberId: member._id,
      invitedUserId: user._id,
      fullName,
      email: normalizedEmail,
      role,
      phone,
      department,
      designation,
      skills: Array.isArray(skills) ? skills : [],
      joiningDate: joiningDate ? new Date(joiningDate) : undefined,
      employmentType,
      manager,
      notes,
      temporaryPasswordHash,
      invitedBy: actorId,
      token,
      expiresAt,
      status: 'Pending',
      lastSentAt: new Date()
    });

    await logAudit(startupId, 'INVITATION_SENT', actorId, {
      targetUserId: user._id.toString(),
      memberId: member._id.toString(),
      invitationId: invitation._id.toString(),
      metadata: { email: normalizedEmail, role }
    });

    await sendInvitationEmail({
      email: normalizedEmail,
      fullName,
      role,
      startupName: startup.name,
      temporaryPassword,
      invitationToken: token,
      expiresAt
    });

    return res.status(201).json({
      message: 'Invitation sent successfully.',
      invitation: normalizeInvitation(invitation),
      member: {
        _id: member._id,
        userId: user._id,
        role: member.role,
        status: member.status
      }
    });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Failed to invite member.';
    const status = message.includes('not allowed') ? 403 : 500;
    res.status(status).json({ error: message });
  }
};

// 3. Change Member Role
export const changeRole = async (req: Request, res: Response) => {
  try {
    const startupId = req.startupId;
    const actorRole = req.role as WorkspaceRole | undefined;
    const actorId = req.user?.id;
    const { memberId, role } = req.body;

    if (!startupId || !actorRole || !actorId) {
      return res.status(401).json({ error: 'Role change context not resolved.' });
    }
    if (!memberId || !role || !ROLE_OPTIONS.includes(role)) {
      return res.status(400).json({ error: 'Member ID and a valid role are required.' });
    }

    const member = await Member.findOne({ _id: memberId, startupId }).populate('userId', 'fullName email');
    if (!member) {
      return res.status(404).json({ error: 'Team member not found in this workspace.' });
    }

    const currentRole = member.role as WorkspaceRole;
    assertRoleAllowed(actorRole, currentRole, 'manage');
    assertRoleAllowed(actorRole, role, 'invite');

    if (currentRole === 'Founder' && actorRole !== 'Founder') {
      return res.status(403).json({ error: 'Only a Founder can change the Founder role.' });
    }

    member.role = role;
    await member.save();

    await logAudit(startupId, 'ROLE_CHANGED', actorId, {
      targetUserId: ((member.userId as any)?._id || member.userId).toString(),
      memberId: member._id.toString(),
      metadata: { previousRole: currentRole, nextRole: role }
    });

    res.status(200).json({ message: 'Role updated successfully.', member });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Failed to change role.';
    const status = message.includes('not allowed') ? 403 : 500;
    res.status(status).json({ error: message });
  }
};

// 4. Remove Workspace Member (soft delete)
export const removeMember = async (req: Request, res: Response) => {
  try {
    const startupId = req.startupId;
    const actorRole = req.role as WorkspaceRole | undefined;
    const actorId = req.user?.id;
    const { memberId, reason } = req.body;

    if (!startupId || !actorRole || !actorId) {
      return res.status(401).json({ error: 'Removal context not resolved.' });
    }
    if (!memberId) {
      return res.status(400).json({ error: 'Member ID is required.' });
    }

    const member = await Member.findOne({ _id: memberId, startupId }).populate('userId');
    if (!member) {
      return res.status(404).json({ error: 'Team member not found in this workspace.' });
    }

    const user = member.userId as any;
    if (user._id.toString() === actorId) {
      return res.status(400).json({ error: 'You cannot remove yourself.' });
    }

    const targetRole = member.role as WorkspaceRole;
    assertRoleAllowed(actorRole, targetRole, 'manage');

    member.status = 'Removed';
    member.removedAt = new Date();
    await member.save();

    await User.findByIdAndUpdate(user._id, {
      $set: {
        status: 'Removed',
        invitationAccepted: false
      }
    });

    await Invitation.updateMany(
      { startupId, invitedUserId: user._id, status: 'Pending' },
      { $set: { status: 'Cancelled' } }
    );

    // Soft-deactivate conversation memberships in this workspace and post system message
    try {
      const workspace = await Workspace.findOne({ startupId }).sort({ createdAt: 1 });
      if (workspace) {
        const workspaceConvos = await Conversation.find({ workspaceId: workspace._id });
        const convoIds = workspaceConvos.map(c => c._id);

        await ConversationParticipant.updateMany(
          { conversationId: { $in: convoIds }, userId: user._id, isActive: true },
          { $set: { isActive: false, leftAt: new Date() } }
        );

        const generalChat = workspaceConvos.find(c => c.type === 'group' && c.name === 'General');
        if (generalChat) {
          const leaveMsg = new Message({
            conversationId: generalChat._id,
            senderId: actorId, // Admin/Founder who did the removal
            content: `${user.fullName} left the workspace.`,
            messageType: 'text'
          });
          await leaveMsg.save();

          generalChat.lastMessage = `${user.fullName} left the workspace.`;
          generalChat.lastActivity = new Date();
          await generalChat.save();

          const io = req.app.get('io');
          if (io) {
            const populatedMsg = await Message.findById(leaveMsg._id).populate('senderId', 'fullName email avatarUrl');
            io.to(generalChat._id.toString()).emit('receive-message', populatedMsg);
          }
        }
      }
    } catch (chatError) {
      console.error('Failed to update conversation memberships or post leave message:', chatError);
    }

    await logAudit(startupId, 'MEMBER_REMOVED', actorId, {
      targetUserId: user._id.toString(),
      memberId: member._id.toString(),
      reason
    });

    await sendMemberStatusEmail({
      email: user.email,
      fullName: user.fullName,
      startupName: (await Startup.findById(startupId))?.name || 'StartupOps',
      subject: 'Your StartupOps access has been removed',
      heading: 'Workspace access removed',
      message: reason || 'Your access to the workspace has been removed by an administrator.'
    });

    res.status(200).json({ message: 'Team member removed from workspace.' });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Failed to remove member.';
    const status = message.includes('not allowed') ? 403 : 500;
    res.status(status).json({ error: message });
  }
};

export const suspendMember = async (req: Request, res: Response) => {
  try {
    const startupId = req.startupId;
    const actorRole = req.role as WorkspaceRole | undefined;
    const actorId = req.user?.id;
    const { memberId, reason } = req.body;

    if (!startupId || !actorRole || !actorId || !memberId) {
      return res.status(400).json({ error: 'Suspension context not resolved.' });
    }

    const member = await Member.findOne({ _id: memberId, startupId }).populate('userId');
    if (!member) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    const user = member.userId as any;
    if (user._id.toString() === actorId) {
      return res.status(400).json({ error: 'You cannot suspend yourself.' });
    }

    assertRoleAllowed(actorRole, member.role as WorkspaceRole, 'manage');

    member.status = 'Suspended';
    member.suspendedAt = new Date();
    await member.save();

    await User.findByIdAndUpdate(user._id, { $set: { status: 'Suspended' } });
    await logAudit(startupId, 'MEMBER_SUSPENDED', actorId, {
      targetUserId: user._id.toString(),
      memberId: member._id.toString(),
      reason
    });

    await sendMemberStatusEmail({
      email: user.email,
      fullName: user.fullName,
      startupName: (await Startup.findById(startupId))?.name || 'StartupOps',
      subject: 'Your StartupOps account has been suspended',
      heading: 'Workspace access suspended',
      message: reason || 'Your account has been suspended. Contact the workspace administrator for details.'
    });

    res.status(200).json({ message: 'Member suspended successfully.' });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Failed to suspend member.';
    const status = message.includes('not allowed') ? 403 : 500;
    res.status(status).json({ error: message });
  }
};

export const reactivateMember = async (req: Request, res: Response) => {
  try {
    const startupId = req.startupId;
    const actorRole = req.role as WorkspaceRole | undefined;
    const actorId = req.user?.id;
    const { memberId } = req.body;

    if (!startupId || !actorRole || !actorId || !memberId) {
      return res.status(400).json({ error: 'Reactivation context not resolved.' });
    }

    const member = await Member.findOne({ _id: memberId, startupId }).populate('userId');
    if (!member) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    assertRoleAllowed(actorRole, member.role as WorkspaceRole, 'manage');

    member.status = 'Active';
    member.suspendedAt = undefined;
    await member.save();

    const user = member.userId as any;
    await User.findByIdAndUpdate(user._id, { $set: { status: 'Active' } });

    await logAudit(startupId, 'MEMBER_REACTIVATED', actorId, {
      targetUserId: user._id.toString(),
      memberId: member._id.toString()
    });

    res.status(200).json({ message: 'Member reactivated successfully.' });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Failed to reactivate member.';
    const status = message.includes('not allowed') ? 403 : 500;
    res.status(status).json({ error: message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const startupId = req.startupId;
    const actorRole = req.role as WorkspaceRole | undefined;
    const actorId = req.user?.id;
    const { memberId } = req.body;

    if (!startupId || !actorRole || !actorId || !memberId) {
      return res.status(400).json({ error: 'Password reset context not resolved.' });
    }

    const member = await Member.findOne({ _id: memberId, startupId }).populate('userId');
    if (!member) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    assertRoleAllowed(actorRole, member.role as WorkspaceRole, 'manage');

    const user = member.userId as any;
    const temporaryPassword = generateTemporaryPassword();
    const hash = await bcrypt.hash(temporaryPassword, 10);

    user.passwordHash = hash;
    user.firstLogin = true;
    user.status = member.status === 'Suspended' ? 'Suspended' : 'Active';
    await user.save();

    await logAudit(startupId, 'PASSWORD_RESET', actorId, {
      targetUserId: user._id.toString(),
      memberId: member._id.toString()
    });

    await sendPasswordResetEmail({
      email: user.email,
      fullName: user.fullName,
      temporaryPassword,
      startupName: (await Startup.findById(startupId))?.name || 'StartupOps'
    });

    res.status(200).json({ message: 'Temporary password generated and emailed successfully.' });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Failed to reset password.';
    const status = message.includes('not allowed') ? 403 : 500;
    res.status(status).json({ error: message });
  }
};

// 5. Resend Invitation
export const resendInvite = async (req: Request, res: Response) => {
  try {
    const startupId = req.startupId;
    const actorId = req.user?.id;
    const actorRole = req.role as WorkspaceRole | undefined;
    const { invitationId } = req.body;

    if (!startupId || !actorId || !actorRole || !invitationId) {
      return res.status(400).json({ error: 'Invitation resend context not resolved.' });
    }

    await markExpiredInvitations(startupId);

    const invitation = await Invitation.findOne({ _id: invitationId, startupId }).populate('invitedUserId');
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found.' });
    }
    if (invitation.status !== 'Pending' && invitation.status !== 'Expired') {
      return res.status(400).json({ error: 'Only pending or expired invitations can be resent.' });
    }

    assertRoleAllowed(actorRole, invitation.role as WorkspaceRole, 'invite');

    const temporaryPassword = generateTemporaryPassword();
    const temporaryPasswordHash = await bcrypt.hash(temporaryPassword, 10);
    const token = generateInvitationToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    invitation.temporaryPasswordHash = temporaryPasswordHash;
    invitation.token = token;
    invitation.expiresAt = expiresAt;
    invitation.lastSentAt = new Date();
    invitation.status = 'Pending';
    await invitation.save();

    if (invitation.invitedUserId) {
      await User.findByIdAndUpdate((invitation.invitedUserId as any)._id || invitation.invitedUserId, {
        $set: {
          passwordHash: temporaryPasswordHash,
          firstLogin: true,
          status: 'Invited',
          invitationAccepted: false
        }
      });
    }

    await logAudit(startupId, 'INVITATION_RESENT', actorId, {
      invitationId: invitation._id.toString(),
      targetUserId: invitation.invitedUserId ? (((invitation.invitedUserId as any)._id || invitation.invitedUserId).toString()) : undefined
    });

    await sendInvitationEmail({
      email: invitation.email,
      fullName: invitation.fullName,
      role: invitation.role,
      startupName: (await Startup.findById(startupId))?.name || 'StartupOps',
      temporaryPassword,
      invitationToken: token,
      expiresAt
    });

    res.status(200).json({ message: 'Invitation email resent successfully.' });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Failed to resend invitation.';
    const status = message.includes('not allowed') ? 403 : 500;
    res.status(status).json({ error: message });
  }
};

export const cancelInvite = async (req: Request, res: Response) => {
  try {
    const startupId = req.startupId;
    const actorId = req.user?.id;
    const actorRole = req.role as WorkspaceRole | undefined;
    const { invitationId } = req.body;

    if (!startupId || !actorId || !actorRole || !invitationId) {
      return res.status(400).json({ error: 'Cancellation context not resolved.' });
    }

    const invitation = await Invitation.findOne({ _id: invitationId, startupId });
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found.' });
    }
    assertRoleAllowed(actorRole, invitation.role as WorkspaceRole, 'invite');

    invitation.status = 'Cancelled';
    await invitation.save();

    await Member.findOneAndUpdate({ _id: invitation.memberId, startupId }, { $set: { status: 'Removed', removedAt: new Date() } });
    await User.findByIdAndUpdate(invitation.invitedUserId, { $set: { status: 'Removed', invitationAccepted: false } });

    await logAudit(startupId, 'INVITATION_CANCELLED', actorId, {
      invitationId: invitation._id.toString(),
      targetUserId: invitation.invitedUserId?.toString()
    });

    res.status(200).json({ message: 'Invitation cancelled successfully.' });
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Failed to cancel invitation.';
    const status = message.includes('not allowed') ? 403 : 500;
    res.status(status).json({ error: message });
  }
};

export const getMyPendingInvitation = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.startupId) {
      return res.status(401).json({ error: 'Authentication context not resolved.' });
    }

    await markExpiredInvitations(req.startupId);

    const invitation = await Invitation.findOne({
      startupId: req.startupId,
      invitedUserId: req.user.id,
      status: 'Pending'
    }).sort({ createdAt: -1 });

    if (!invitation) {
      return res.status(200).json({ invitation: null });
    }

    return res.status(200).json({
      invitation: {
        _id: invitation._id,
        fullName: invitation.fullName,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch pending invitation.' });
  }
};

const getOrCreateGeneralChat = async (workspaceId: string, createdById: string) => {
  let generalChat = await Conversation.findOne({
    workspaceId,
    type: 'group',
    name: 'General'
  });

  if (!generalChat) {
    generalChat = new Conversation({
      workspaceId,
      type: 'group',
      private: false,
      group: true,
      announcement: false,
      name: 'General',
      createdBy: createdById,
      lastMessage: 'Channel initialized.',
      lastActivity: new Date()
    });
    await generalChat.save();

    await ConversationParticipant.findOneAndUpdate(
      { conversationId: generalChat._id, userId: createdById },
      {
        $setOnInsert: {
          role: 'Founder',
          joinedAt: new Date(),
          isActive: true
        }
      },
      { upsert: true }
    );
  }

  return generalChat;
};

export const acceptInvite = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.startupId) {
      return res.status(401).json({ error: 'Authentication context not resolved.' });
    }

    await markExpiredInvitations(req.startupId);

    const invitation = await Invitation.findOne({
      startupId: req.startupId,
      invitedUserId: req.user.id,
      status: 'Pending'
    });
    if (!invitation) {
      return res.status(404).json({ error: 'Pending invitation not found.' });
    }
    if (invitation.expiresAt < new Date()) {
      invitation.status = 'Expired';
      await invitation.save();
      return res.status(400).json({ error: 'Invitation has expired.' });
    }

    invitation.status = 'Accepted';
    invitation.acceptedAt = new Date();
    await invitation.save();

    await User.findByIdAndUpdate(req.user.id, {
      $set: {
        status: 'Active',
        invitationAccepted: true
      }
    });

    await Member.findOneAndUpdate(
      { _id: invitation.memberId, startupId: req.startupId },
      { $set: { status: 'Active' } }
    );

    // Automatically add to default General workspace chat
    try {
      const workspace = await Workspace.findOne({ startupId: req.startupId }).sort({ createdAt: 1 });
      if (workspace) {
        const generalChat = await getOrCreateGeneralChat(workspace._id.toString(), req.user.id);
        
        const memberRecord = await Member.findOne({ userId: req.user.id, startupId: req.startupId });
        const roleMapping = memberRecord?.role === 'Founder' || memberRecord?.role === 'Co-Founder'
          ? memberRecord.role
          : (memberRecord?.role === 'Mentor' ? 'Mentor' : 'Team Member');

        await ConversationParticipant.findOneAndUpdate(
          { conversationId: generalChat._id, userId: req.user.id },
          {
            $set: {
              role: roleMapping,
              isActive: true,
              joinedAt: new Date()
            }
          },
          { upsert: true }
        );

        const joinMsg = new Message({
          conversationId: generalChat._id,
          senderId: req.user.id,
          content: `${invitation.fullName} joined the workspace.`,
          messageType: 'text'
        });
        await joinMsg.save();

        generalChat.lastMessage = `${invitation.fullName} joined the workspace.`;
        generalChat.lastActivity = new Date();
        await generalChat.save();

        const io = req.app.get('io');
        if (io) {
          const populatedMsg = await Message.findById(joinMsg._id).populate('senderId', 'fullName email avatarUrl');
          io.to(generalChat._id.toString()).emit('receive-message', populatedMsg);
        }
      }
    } catch (chatError) {
      console.error('Failed to automatically add user to General chat room:', chatError);
    }

    await logAudit(req.startupId, 'INVITATION_ACCEPTED', req.user.id, {
      invitationId: invitation._id.toString(),
      targetUserId: req.user.id
    });

    res.status(200).json({ message: 'Invitation accepted.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to accept invitation.' });
  }
};

export const declineInvite = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.startupId) {
      return res.status(401).json({ error: 'Authentication context not resolved.' });
    }

    const invitation = await Invitation.findOne({
      startupId: req.startupId,
      invitedUserId: req.user.id,
      status: 'Pending'
    });
    if (!invitation) {
      return res.status(404).json({ error: 'Pending invitation not found.' });
    }

    invitation.status = 'Rejected';
    await invitation.save();

    await Member.findOneAndUpdate(
      { _id: invitation.memberId, startupId: req.startupId },
      { $set: { status: 'Removed', removedAt: new Date() } }
    );
    await User.findByIdAndUpdate(req.user.id, {
      $set: {
        status: 'Removed',
        invitationAccepted: false
      }
    });

    await logAudit(req.startupId, 'INVITATION_REJECTED', req.user.id, {
      invitationId: invitation._id.toString(),
      targetUserId: req.user.id
    });

    res.status(200).json({ message: 'Invitation declined.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to decline invitation.' });
  }
};

export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    if (!req.startupId) {
      return res.status(400).json({ error: 'Startup workspace context not resolved.' });
    }

    const logs = await IdentityAuditLog.find({ startupId: req.startupId })
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('actorUserId', 'fullName email')
      .populate('targetUserId', 'fullName email');

    res.status(200).json({ auditLogs: logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch audit logs.' });
  }
};
