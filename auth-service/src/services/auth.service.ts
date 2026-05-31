/**
 * =============================================================================
 * FireGuard LTD — Auth Business Logic Service
 * =============================================================================
 * WHAT:  Core signup, login, OTP verify/resend operations against MySQL.
 * WHY:  Controllers stay thin; all database rules and side effects live here
 *        so they can be tested and reused without HTTP concerns.
 * HOW:  Each exported function maps 1:1 to an auth route handler.
 * =============================================================================
 */

import { User } from '@prisma/client';
import prisma from '../utils/prisma';
import { hashPassword, comparePassword } from '../utils/password.util';
import { signToken } from '../utils/jwt.util';
import {
  generateOtpCode,
  getOtpExpirationTime,
  isOtpExpired,
} from '../utils/otp.util';
import { sendOtpEmail } from './email.service';
import {
  AppError,
  badRequest,
  conflict,
  notFound,
  unauthorized,
} from '../utils/app-error.util';
import {
  AuthResponse,
  JwtPayload,
  PublicUser,
  SignupResponse,
  MessageResponse,
} from '../types';
import {
  SignupInput,
  LoginInput,
  VerifyOtpInput,
  ResendOtpInput,
} from '../validators/auth.validator';

/**
 * Strip password hash before returning user data in API responses.
 */
function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
  };
}

/**
 * Build JWT payload + sign token for a verified user session.
 */
function buildAuthResponse(user: User, message: string): AuthResponse {
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
  };

  return {
    message,
    token: signToken(payload),
    user: toPublicUser(user),
  };
}

/**
 * Persist a new OTP row and email the code to the user.
 * Called from signup and resend-otp flows.
 */
async function createAndSendOtp(email: string, firstName: string): Promise<void> {
  const otpCode = generateOtpCode();
  const expirationTime = getOtpExpirationTime();

  await prisma.oTPVerification.create({
    data: {
      otpCode,
      email,
      expirationTime,
      verified: false,
    },
  });

  await sendOtpEmail(email, otpCode, firstName);
}

/**
 * SIGNUP — Register user, hash password, send OTP, leave isVerified=false.
 */
export async function signup(input: SignupInput): Promise<SignupResponse> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw conflict('An account with this email already exists');
  }

  const hashedPassword = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phoneNumber: input.phoneNumber,
      password: hashedPassword,
      role: input.role,
      isVerified: false,
    },
  });

  await createAndSendOtp(user.email, user.firstName);

  return {
    message: 'Account created. Please verify your email with the OTP sent to your inbox.',
    email: user.email,
  };
}

/**
 * LOGIN — Validate credentials; reject unverified accounts per business rule.
 */
export async function login(input: LoginInput): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw unauthorized('Invalid email or password');
  }

  const passwordMatch = await comparePassword(input.password, user.password);
  if (!passwordMatch) {
    throw unauthorized('Invalid email or password');
  }

  if (!user.isVerified) {
    throw unauthorized(
      'Email not verified. Please verify your account with the OTP sent to your email or request a new code via /resend-otp.'
    );
  }

  return buildAuthResponse(user, 'Login successful');
}

/**
 * VERIFY OTP — Mark OTP used, set user.isVerified=true, return JWT.
 */
export async function verifyOtp(input: VerifyOtpInput): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw notFound('No account found for this email');
  }

  if (user.isVerified) {
    throw badRequest('Account is already verified. You can log in directly.');
  }

  const otpRecord = await prisma.oTPVerification.findFirst({
    where: {
      email: input.email,
      otpCode: input.otpCode,
      verified: false,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otpRecord) {
    throw badRequest('Invalid OTP code');
  }

  if (isOtpExpired(otpRecord.expirationTime)) {
    throw badRequest('OTP has expired. Please request a new code via /resend-otp');
  }

  // Mark OTP consumed and flip user verification flag atomically
  await prisma.$transaction([
    prisma.oTPVerification.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
    }),
  ]);

  const verifiedUser = { ...user, isVerified: true };
  return buildAuthResponse(verifiedUser, 'Email verified successfully');
}

/**
 * RESEND OTP — Issue fresh code for pending verification (not for verified users).
 */
export async function resendOtp(input: ResendOtpInput): Promise<MessageResponse> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw notFound('No account found for this email');
  }

  if (user.isVerified) {
    throw badRequest('Account is already verified. You can log in directly.');
  }

  await createAndSendOtp(user.email, user.firstName);

  return {
    message: 'A new verification code has been sent to your email.',
  };
}

/**
 * GET USER BY ID — helper for internal service-to-service lookups (optional).
 * Throws AppError when user does not exist.
 */
export async function getUserById(userId: number): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw notFound('User not found');
  }

  return toPublicUser(user);
}

/**
 * Re-export AppError for controllers that need instanceof checks (rare).
 */
export { AppError };
