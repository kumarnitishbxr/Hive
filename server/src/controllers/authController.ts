import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { sendSuccess } from '../utils/responseHandler';

const authService = new AuthService();

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response) => {
  const { email, password, fullName } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const result = await authService.register(email, password, fullName);
  return sendSuccess(res, result, 201, 'Registration successful. Verification OTP sent to email.');
};

/**
 * Verify verification OTP code
 */
export const verifyOtp = async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required.' });
  }

  const result = await authService.verifyOtp(email, otp);
  return sendSuccess(res, result, 200, 'OTP verified successfully.');
};

/**
 * Login user and authenticate password credentials
 */
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const result = await authService.login(email, password);
  return sendSuccess(res, result, 200, 'Login successful.');
};

/**
 * Get active user profile payload
 */
export const getMe = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }

  const result = await authService.getProfile(req.user.id);
  return sendSuccess(res, result, 200);
};

/**
 * Invite new member to startup workspace
 */
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
export default { register, verifyOtp, login, getMe, inviteTeam };
