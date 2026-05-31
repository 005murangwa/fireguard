/**
 * =============================================================================
 * FireGuard LTD — Auth Request Validators (Zod)
 * =============================================================================
 * WHAT:  Zod schemas that validate and parse incoming JSON request bodies.
 * WHY:  Reject malformed input before it reaches services/DB; produce clear 400
 *        errors with field-level detail for API consumers and Swagger docs.
 * HOW:  Used by validate.middleware.ts via validateBody(schema).
 *        Export both schema and inferred TypeScript types for controllers.
 * =============================================================================
 */

import { z } from 'zod';

/**
 * Password policy: min 8 chars, at least one upper, lower, digit, special.
 * Matches seeded Admin123! pattern used across FireGuard LTD demos.
 */
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

/** Normalize emails to lowercase trimmed strings for consistent DB lookups. */
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Invalid email address');

/** Phone numbers — permissive pattern for international formats. */
const phoneSchema = z
  .string()
  .trim()
  .min(7, 'Phone number is too short')
  .max(20, 'Phone number is too long')
  .regex(/^[+]?[\d\s()-]+$/, 'Invalid phone number format');

/**
 * POST /signup — create account and trigger OTP email.
 */
export const signupSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  email: emailSchema,
  phoneNumber: phoneSchema,
  password: passwordSchema,
  /** Optional role — defaults to CLIENT; only ADMIN seed can create staff in prod. */
  role: z.enum(['ADMIN', 'INSPECTOR', 'CLIENT']).optional().default('CLIENT'),
});

export type SignupInput = z.infer<typeof signupSchema>;

/**
 * POST /login — email + password; blocked server-side if !isVerified.
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * POST /verify-otp — submit 6-digit code received by email.
 */
export const verifyOtpSchema = z.object({
  email: emailSchema,
  otpCode: z
    .string()
    .trim()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

/**
 * POST /resend-otp — request a fresh code for an unverified account.
 */
export const resendOtpSchema = z.object({
  email: emailSchema,
});

export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
