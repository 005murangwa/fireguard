/**
 * =============================================================================
 * FireGuard LTD — Password Hashing Utilities
 * =============================================================================
 * WHAT:  bcryptjs wrappers for hashing and comparing user passwords.
 * WHY:  Passwords must never be stored in plain text; bcrypt adds salting and
 *        adaptive cost factor to resist brute-force attacks.
 * HOW:  hashPassword() on signup; comparePassword() on login.
 * =============================================================================
 */

import bcrypt from 'bcryptjs';

/** bcrypt cost factor — 12 is a good balance for academic/demo workloads. */
const SALT_ROUNDS = 12;

/**
 * Hash a plain-text password before persisting to the users table.
 *
 * @param plainPassword - Raw password from signup request body
 * @returns bcrypt hash safe to store in MySQL VARCHAR(255)
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Compare a login attempt password against the stored bcrypt hash.
 *
 * @param plainPassword - Password submitted on login
 * @param hashedPassword - Value from User.password column
 * @returns true when credentials match
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
