/**
 * =============================================================================
 * FireGuard LTD — Auth Route Definitions
 * =============================================================================
 * WHAT:  Maps HTTP paths and methods to controller handlers + validators.
 * WHY:  Keeps app.ts focused on global middleware; routes document the public
 *        API surface consumed by the API Gateway at /api/auth/*.
 * HOW:  Each POST route chains validateBody(schema) before the controller.
 * =============================================================================
 */

import { Router } from 'express';
import {
  signup,
  login,
  verifyOtp,
  resendOtp,
} from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate.middleware';
import {
  signupSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
} from '../validators/auth.validator';

const router = Router();

/**
 * @openapi
 * /signup:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new FireGuard LTD account
 *     description: Creates user with isVerified=false and emails a 6-digit OTP.
 */
router.post('/signup', validateBody(signupSchema), signup);

/**
 * @openapi
 * /login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     description: Returns JWT only when isVerified is true.
 */
router.post('/login', validateBody(loginSchema), login);

/**
 * @openapi
 * /verify-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Verify email with OTP code
 *     description: Sets isVerified=true and returns JWT on success.
 */
router.post('/verify-otp', validateBody(verifyOtpSchema), verifyOtp);

/**
 * @openapi
 * /resend-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Resend verification OTP
 *     description: Generates new 6-digit code with 10-minute expiry.
 */
router.post('/resend-otp', validateBody(resendOtpSchema), resendOtp);

export default router;
