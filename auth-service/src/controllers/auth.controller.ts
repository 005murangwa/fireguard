/**
 * =============================================================================
 * FireGuard LTD — Auth HTTP Controllers
 * =============================================================================
 * WHAT:  Thin Express handlers that delegate to auth.service and send JSON.
 * WHY:  Separates HTTP transport (status codes, req/res) from business logic
 *        so services remain usable from CLI scripts or other entry points.
 * HOW:  Each handler is async, catches errors via next(error) for the global
 *        error middleware — no try/catch duplication for AppError paths.
 * =============================================================================
 */

import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import {
  SignupInput,
  LoginInput,
  VerifyOtpInput,
  ResendOtpInput,
} from '../validators/auth.validator';

/**
 * POST /signup — Register new user and trigger OTP email.
 */
export async function signup(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body as SignupInput;
    const result = await authService.signup(body);
    res.status(201).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /login — Authenticate verified user and return JWT.
 */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body as LoginInput;
    const result = await authService.login(body);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /verify-otp — Confirm email ownership with 6-digit code.
 */
export async function verifyOtp(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body as VerifyOtpInput;
    const result = await authService.verifyOtp(body);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /resend-otp — Send a fresh OTP to an unverified account.
 */
export async function resendOtp(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body = req.body as ResendOtpInput;
    const result = await authService.resendOtp(body);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /health — Liveness probe (also defined in app.ts for convenience).
 */
export function health(_req: Request, res: Response): void {
  res.json({
    success: true,
    status: 'ok',
    service: 'auth-service',
    port: process.env.PORT || 5001,
  });
}
