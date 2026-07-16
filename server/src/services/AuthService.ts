import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Member } from '../models/User';
import { UserRepository } from '../repositories/UserRepository';
import { MemberRepository } from '../repositories/MemberRepository';
import AppError from '../utils/AppError';
import config from '../config';

const JWT_SECRET = config.jwtSecret;

export class AuthService {
  private userRepo: UserRepository;
  private memberRepo: MemberRepository;

  constructor() {
    this.userRepo = new UserRepository();
    this.memberRepo = new MemberRepository();
  }

  async register(email: string, passwordHashRaw: string, fullName: string) {
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new AppError('User with this email already exists.', 400);
    }

    const passwordHash = await bcrypt.hash(passwordHashRaw, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

    const user = await this.userRepo.create({
      email,
      passwordHash,
      fullName,
      isVerified: false,
      verificationOtp: otp,
      otpExpiry,
      invitationAccepted: true,
      status: 'Onboarding'
    });

    console.log(`[OTP Verification] User: ${email}, OTP: ${otp}`);
    return { email: user.email };
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    if (user.verificationOtp !== otp || (user.otpExpiry && user.otpExpiry < new Date())) {
      throw new AppError('Invalid or expired OTP.', 400);
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

    return {
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        isVerified: user.isVerified,
        firstLogin: user.firstLogin || false,
        status: user.status,
        invitationAccepted: user.invitationAccepted || false
      }
    };
  }

  async login(email: string, passwordRaw: string) {
    const user = await this.userRepo.findOne({ email });
    if (!user || !user.passwordHash) {
      throw new AppError('Invalid credentials.', 400);
    }

    const isMatch = await bcrypt.compare(passwordRaw, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid credentials.', 400);
    }

    if (!user.isVerified) {
      throw new AppError('Email is not verified. Please verify your OTP.', 403);
    }
    if (user.status === 'Suspended') {
      throw new AppError('This account is suspended. Contact your workspace administrator.', 403);
    }
    if (user.status === 'Removed') {
      throw new AppError('This account has been removed.', 403);
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const memberRecord = await Member.findOne({
      userId: user._id,
      status: { $ne: 'Removed' }
    }).sort({ createdAt: -1 });

    return {
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        isVerified: user.isVerified,
        firstLogin: user.firstLogin || false,
        status: user.status,
        invitationAccepted: user.invitationAccepted || false
      },
      startupId: memberRecord ? memberRecord.startupId : null,
      role: memberRecord ? memberRecord.role : null
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findById(userId, '', '-passwordHash');
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const memberRecord = await this.memberRepo.findOne({ userId: user._id }, '', 'startupId role');

    return {
      user,
      membership: memberRecord || null
    };
  }

  async inviteTeam(email: string, role: any, departmentId: string, startupId: string) {
    throw new AppError('Use the /team/invite workflow for production invitations.', 410);
  }

  async changePassword(userId: string, currentPasswordRaw: string, newPasswordRaw: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    if (!user.passwordHash) {
      throw new AppError('Password login is not configured for this user.', 400);
    }

    const isMatch = await bcrypt.compare(currentPasswordRaw, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Incorrect current or temporary password.', 400);
    }

    const newPasswordHash = await bcrypt.hash(newPasswordRaw, 10);
    user.passwordHash = newPasswordHash;
    user.firstLogin = false;
    if (user.status === 'Invited') {
      user.status = 'Active';
    }
    await user.save();

    return { success: true };
  }
}

export default AuthService;
