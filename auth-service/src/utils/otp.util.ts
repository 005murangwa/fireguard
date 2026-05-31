/**
 * =============================================================================
 * FireGuard LTD — OTP Generation Utilities
 * =============================================================================
 * WHAT:  Helpers for creating 6-digit OTP codes and computing expiry timestamps.
 * WHY:  Email verification requires unpredictable codes with a fixed 10-minute TTL
 *        as specified in the FireGuard LTD auth requirements.
 * HOW:  generateOtpCode() on signup/resend; getOtpExpirationTime() for DB row.
 * =============================================================================
 */

import { randomInt } from 'crypto';

/** OTP validity window in minutes — 10 minutes per FireGuard LTD requirements. */
export const OTP_EXPIRY_MINUTES = 10;

/** OTP length — always 6 numeric digits. */
export const OTP_LENGTH = 6;

/**
 * Generate a cryptographically random 6-digit OTP string.
 * Uses Node crypto.randomInt for unpredictable codes suitable for email verification.
 *
 * @returns Zero-padded string like "042817"
 */
export function generateOtpCode(): string {
  const max = 10 ** OTP_LENGTH;
  const code = randomInt(0, max);
  return code.toString().padStart(OTP_LENGTH, '0');
}

/**
 * Compute the DateTime when an OTP should be considered expired.
 *
 * @param from - Optional anchor time (defaults to now)
 * @returns expirationTime value for OTPVerification row
 */
export function getOtpExpirationTime(from: Date = new Date()): Date {
  return new Date(from.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);
}

/**
 * Check whether an OTP expiration timestamp is still in the future.
 *
 * @param expirationTime - Value stored on OTPVerification.expirationTime
 * @returns false when OTP has expired and must be resent
 */
export function isOtpExpired(expirationTime: Date): boolean {
  return new Date() > expirationTime;
}
