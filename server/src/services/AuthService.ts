import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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

  /**
   * Register a new user and generate a verification OTP
   */
  async register(email: string, passwordHashRaw: string, fullName: string) {
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new AppError('User with this email already exists.', 400);
    }

    const passwordHash = await bcrypt.hash(passwordHashRaw, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    const user = await this.userRepo.create({
      email,
      passwordHash,
      fullName,
      isVerified: false,
      verificationOtp: otp,
      otpExpiry,
      status: 'Onboarding'
    });

    console.log(`[OTP Verification] User: ${email}, OTP: ${otp}`);
    return { email };
  }

  /**
   * Verify verification OTP and generate JWT token
   */
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
        isVerified: user.isVerified
      }
    };
  }

  /**
   * Authenticate credentials and login user
   */
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

    const token = jwt.sign(
      { id: user._id, email: user.email, fullName: user.fullName },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const memberRecord = await this.memberRepo.findByUserId(user._id.toString());

    return {
      token,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        isVerified: user.isVerified
      },
      startupId: memberRecord ? memberRecord.startupId : null,
      role: memberRecord ? memberRecord.role : null
    };
  }

  /**
   * Get user profile along with membership details
   */
  async getProfile(userId: string) {
    const user = await this.userRepo.findById(userId, '', '-passwordHash');
    if (!user) {
      throw new AppError('User not found.', 404);
    }

    const memberRecord = await this.memberRepo.findOne({ userId: user._id }, 'startupId');

    return {
      user,
      membership: memberRecord || null
    };
  }

  /**
   * Invite team member and create active member record
   */
  async inviteTeam(email: string, role: any, departmentId: string, startupId: string) {
    let user = await this.userRepo.findByEmail(email);
    if (!user) {
      user = await this.userRepo.create({
        email,
        fullName: email.split('@')[0],
        isVerified: true, // auto-verified for invites
        status: 'Active'
      });
    }

    const existingMember = await this.memberRepo.findByUserIdAndStartupId(user._id.toString(), startupId);
    if (existingMember) {
      throw new AppError('User is already a member of this startup.', 400);
    }

    const member = await this.memberRepo.create({
      startupId: startupId as any,
      userId: user._id as any,
      role,
      departmentId: departmentId as any,
      permissions: ['read', 'write']
    });

    console.log(`[Invite System] Sent invite link to ${email} with role: ${role}`);
    return member;
  }
}

export default AuthService;
