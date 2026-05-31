/**
 * =============================================================================
 * FireGuard LTD — User Service Utility Helpers
 * =============================================================================
 * WHAT:  Pure helper functions for formatting users and pagination math.
 * WHY:  Keeps service layer focused on database logic; helpers are easy to test.
 * HOW:  Import formatUser in user.service.ts before returning API responses.
 * =============================================================================
 */

import { User } from '@prisma/client';
import { UserResponse } from '../types';

/**
 * Strips sensitive fields (password hash) before sending user data over HTTP.
 * Maps Prisma User entity to the public UserResponse contract.
 *
 * @param user - Raw Prisma User record from the database
 * @returns Public-safe user object for API responses
 */
export function formatUser(user: User): UserResponse {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Calculates total pages for offset-based pagination.
 *
 * @param total - Total matching records from prisma.user.count()
 * @param limit - Page size from query params
 */
export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit) || 1;
}

/**
 * Builds a Prisma OR filter for name/email search across list endpoints.
 *
 * @param search - Free-text search term from query string
 */
export function buildSearchFilter(search: string) {
  return {
    OR: [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { email: { contains: search.toLowerCase() } },
      { phoneNumber: { contains: search } },
    ],
  };
}
