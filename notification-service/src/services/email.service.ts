/**
 * =============================================================================
 * FireGuard LTD — SMTP Email Service (nodemailer)
 * =============================================================================
 * Sends HTML emails via configurable SMTP credentials.
 * When SMTP is not configured, emails are logged to the console as [DEV EMAIL]
 * so local development works without a mail server.
 * =============================================================================
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/** Lazily initialized nodemailer transporter (reused across sends). */
let smtpTransporter: Transporter | null = null;

/** Payload required to dispatch an email. */
export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

/**
 * Returns true when minimum SMTP env vars are present.
 * SMTP_HOST + SMTP_USER + SMTP_PASS are required for real delivery.
 */
function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/** Build or return cached nodemailer transporter from environment. */
function getSmtpTransporter(): Transporter {
  if (!smtpTransporter) {
    const port = parseInt(process.env.SMTP_PORT || '587', 10);

    smtpTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      auth: {
        user: process.env.SMTP_USER?.trim(),
        pass: process.env.SMTP_PASS?.replace(/\s/g, ''),
      },
    });
  }

  return smtpTransporter;
}

/**
 * Send an email via SMTP or log to console in dev mode.
 * @returns message id from SMTP server or a dev-mode placeholder id.
 */
export async function sendEmail(payload: EmailPayload): Promise<{ id: string }> {
  if (isSmtpConfigured()) {
    const from =
      process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@fireguard.local';

    const info = await getSmtpTransporter().sendMail({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });

    console.log(`[SMTP EMAIL] Sent to ${payload.to} (messageId: ${info.messageId})`);
    return { id: info.messageId || 'smtp-sent' };
  }

  // Dev fallback — no SMTP configured
  console.log(`[DEV EMAIL] To: ${payload.to}, Subject: ${payload.subject}`);
  console.log(payload.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  return { id: 'dev-mode-no-send' };
}

/** Template variables for expiry alert HTML emails. */
export interface AlertEmailDetails {
  recipientName: string;
  extinguisherCode: string;
  extinguisherType: string;
  location: string;
  expirationDate: string;
  alertSummary: string;
}

/**
 * Build branded HTML email body for extinguisher-related alerts.
 * Used by cron jobs for expiry, inspection, and maintenance reminders.
 */
export function buildAlertEmailHtml(details: AlertEmailDetails): string {
  const {
    recipientName,
    extinguisherCode,
    extinguisherType,
    location,
    expirationDate,
    alertSummary,
  } = details;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">FireGuard LTD — Safety Alert</h2>
      <p>Dear ${recipientName},</p>
      <p>${alertSummary}</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr>
          <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Extinguisher Code</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${extinguisherCode}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Type</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${extinguisherType}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Location</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${location}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Expiration Date</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${expirationDate}</td>
        </tr>
      </table>
      <p>Please contact FireGuard LTD to schedule inspection, maintenance, or replacement.</p>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
      <p style="color: #6b7280; font-size: 12px;">FireGuard LTD Fire Extinguisher Management System</p>
    </div>
  `;
}

/** Build email subject line from alert title and extinguisher code. */
export function buildAlertEmailSubject(title: string, extinguisherCode: string): string {
  return `${title} — Extinguisher ${extinguisherCode}`;
}
