import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Member } from '../models/User';
import Startup from '../models/Startup';
import config from '../config';

const JWT_SECRET = config.jwtSecret;

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    const user = new User({
      email,
      passwordHash,
      fullName,
      isVerified: false,
      verificationOtp: otp,
      otpExpiry,
      status: 'Onboarding'
    });

    await user.save();
    console.log(`[OTP Verification] User: ${email}, OTP: ${otp}`);

    res.status(201).json({ 
      message: 'Registration successful. Verification OTP sent to email.',
      email 
    });
  } catch (error: any) {
    console.error('Registration error details:', error);
    res.status(500).json({ error: `Registration failed: ${error.message || error}` });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.verificationOtp !== otp || (user.otpExpiry && user.otpExpiry < new Date())) {
      return res.status(400).json({ error: 'Invalid or expired OTP.' });
    }

    user.isVerified = true;
    user.verificationOtp = undefined;
    user.otpExpiry = undefined;
    user.status = 'Active';
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({ 
      message: 'OTP verified successfully.',
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'OTP verification failed.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: 'Email is not verified. Please verify your OTP.' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Get their startup workspace info if it exists
    const memberRecord = await Member.findOne({ userId: user._id });

    res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        isVerified: user.isVerified
      },
      startupId: memberRecord ? memberRecord.startupId : null,
      role: memberRecord ? memberRecord.role : null
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed.' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Find any member records
    const memberRecord = await Member.findOne({ userId: user._id }).populate('startupId');

    res.status(200).json({
      user,
      membership: memberRecord || null
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
};

export const inviteTeam = async (req: Request, res: Response) => {
  try {
    const { email, role, departmentId } = req.body;
    const startupId = req.startupId;

    if (!email || !role) {
      return res.status(400).json({ error: 'Email and role are required.' });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (!user) {
      // Create a shell user
      user = new User({
        email,
        fullName: email.split('@')[0],
        isVerified: true, // Auto-verified for invites
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
      departmentId,
      permissions: ['read', 'write']
    });

    await member.save();

    console.log(`[Invite System] Sent invite link to ${email} with role: ${role}`);

    res.status(200).json({
      message: 'Team member successfully invited and registered.',
      member
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to invite team member.' });
  }
};
