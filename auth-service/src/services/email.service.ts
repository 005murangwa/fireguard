/**
 * =============================================================================
 * FireGuard LTD — Email Service (Nodemailer)
 * =============================================================================
 * WHAT:  Sends OTP verification emails via SMTP or logs them in dev mode.
 * WHY:  Users must receive a 6-digit code to verify ownership of their email
 *        before login is permitted (isVerified business rule).
 * HOW:  When SMTP_HOST, SMTP_USER, and SMTP_PASS are set, nodemailer delivers
 *        real mail; otherwise `[DEV EMAIL]` is printed to the console.
 * =============================================================================
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { OTP_EXPIRY_MINUTES } from '../utils/otp.util';

/** Lazily initialized SMTP transporter — created once per process. */
let transporter: Transporter | null = null;

/**
 * Returns true when all required SMTP environment variables are present.
 * Partial config is ignored to avoid nodemailer auth errors at runtime.
 */
function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
  );
}

/**
 * Build or reuse the nodemailer SMTP transport from .env settings.
 */
function getTransporter(): Transporter {
  if (!transporter) {
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      auth: {
        user: process.env.SMTP_USER?.trim(),
        pass: process.env.SMTP_PASS?.replace(/\s/g, ''),
      },
    });
  }
  return transporter;
}

/**
 * HTML email body for OTP verification — branded for FireGuard LTD.
 */
function buildOtpEmailHtml(otpCode: string, firstName: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">FireGuard LTD — Email Verification</h2>
      <p>Hello ${firstName},</p>
      <p>Your one-time verification code is:</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111827;">
        ${otpCode}
      </p>
      <p>This code expires in <strong>${OTP_EXPIRY_MINUTES} minutes</strong>.</p>
      <p>If you did not create an account, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #6b7280; font-size: 12px;">FireGuard LTD Authentication Service</p>
    </div>
  `;
}

/**
 * Send OTP verification email to the user.
 *
 * @param to - Recipient email address
 * @param otpCode - 6-digit verification code
 * @param firstName - Used for email greeting personalization
 */
export async function sendOtpEmail(
  to: string,
  otpCode: string,
  firstName: string
): Promise<void> {
  const subject = 'FireGuard LTD — Your verification code';
  const html = buildOtpEmailHtml(otpCode, firstName);

  if (isSmtpConfigured()) {
    const from =
      process.env.SMTP_FROM ||
      process.env.SMTP_USER ||
      'noreply@fireguard.com';

    try {
      const info = await getTransporter().sendMail({
        from,
        to,
        subject,
        html,
      });

      console.log(`[SMTP EMAIL] OTP sent to ${to} (messageId: ${info.messageId})`);
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[SMTP ERROR] Failed to send OTP email: ${message}`);
      console.warn('[SMTP ERROR] Falling back to console OTP log — fix SMTP_USER/SMTP_PASS in auth-service/.env');
    }
  }

  // Dev fallback — no SMTP configured or SMTP send failed
  console.log(`[DEV EMAIL] To: ${to}, Subject: ${subject}`);
  console.log(`[DEV EMAIL] OTP Code: ${otpCode} (expires in ${OTP_EXPIRY_MINUTES} min)`);
  console.log(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}
