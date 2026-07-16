import { Request, Response } from 'express';
import { Invitation } from '../models/Invitation';
import { AuthService } from '../services/AuthService';
import { sendSuccess } from '../utils/responseHandler';

const authService = new AuthService();

export const register = async (req: Request, res: Response) => {
  const { email, password, fullName } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const result = await authService.register(email, password, fullName);
  return sendSuccess(res, result, 201, 'Registration successful. Verification OTP sent to email.');
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required.' });
  }

  const result = await authService.verifyOtp(email, otp);
  return sendSuccess(res, result, 200, 'OTP verified successfully.');
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const result = await authService.login(email, password);
  return sendSuccess(res, result, 200, 'Login successful.');
};

export const getMe = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  const result = await authService.getProfile(req.user.id);
  return sendSuccess(res, result, 200);
};

export const inviteTeam = async (req: Request, res: Response) => {
  const { email, role, departmentId } = req.body;
  const startupId = req.startupId;

  if (!email || !role) {
    return res.status(400).json({ error: 'Email and role are required.' });
  }

  if (!startupId) {
    return res.status(400).json({ error: 'Startup workspace context not resolved.' });
  }

  const result = await authService.inviteTeam(email, role, departmentId, startupId);
  return sendSuccess(res, result, 200, 'Team member successfully invited and registered.');
};

export const changePassword = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required.' });
  }

  const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
  return sendSuccess(res, result, 200, 'Password changed successfully.');
};

export const verifyInvitationToken = async (req: Request, res: Response) => {
  const token = String(req.query.token || '').trim();

  if (!token) {
    return res.status(400).json({ error: 'Invitation token is required.' });
  }

  const invitation = await Invitation.findOne({ token });
  if (!invitation) {
    return res.status(404).json({ error: 'Invitation not found.' });
  }

  if (invitation.status !== 'Pending') {
    return res.status(400).json({ error: `Invitation is ${invitation.status.toLowerCase()}.` });
  }

  if (invitation.expiresAt < new Date()) {
    invitation.status = 'Expired';
    await invitation.save();
    return res.status(400).json({ error: 'Invitation has expired.' });
  }

  return sendSuccess(res, {
    invitation: {
      email: invitation.email,
      fullName: invitation.fullName,
      role: invitation.role,
      expiresAt: invitation.expiresAt
    }
  }, 200);
};

export default {
  register,
  verifyOtp,
  login,
  getMe,
  inviteTeam,
  changePassword,
  verifyInvitationToken
};
