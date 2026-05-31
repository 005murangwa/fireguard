/**
 * =============================================================================
 * FireGuard LTD - User Service Business Logic
 * =============================================================================
 * WHAT: Database operations for admin user management.
 * WHY:  Controllers delegate all persistence logic here (separation of concerns).
 * NOTE: Passwords are hashed with bcrypt before storage — never returned in API.
 * =============================================================================
 */

import bcrypt from 'bcryptjs';
import { Role, Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { formatUser, calculateTotalPages, buildSearchFilter } from '../utils/user.util';
import {
  ListUsersQuery,
  UpdateUserInput,
  AssignRoleInput,
} from '../validators/user.validator';
import { PaginatedUsers, UserResponse, UserStats } from '../types';

/** Custom error with HTTP status for controller error handling. */
export class UserServiceError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
    this.name = 'UserServiceError';
  }
}

/**
 * Lists users with pagination, optional role filter, and email/name search.
 *
 * @param query - Validated query params from listUsersQuerySchema
 */
export async function listUsers(query: ListUsersQuery): Promise<PaginatedUsers> {
  const { page, limit, role, search } = query;
  const skip = (page - 1) * limit;

  // Build dynamic WHERE clause for Prisma
  const where: Prisma.UserWhereInput = {};

  if (role) {
    where.role = role;
  }

  if (search) {
    // Search firstName, lastName, email, and phoneNumber (MySQL contains)
    Object.assign(where, buildSearchFilter(search));
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    data: users.map(formatUser),
    total,
    page,
    limit,
    totalPages: calculateTotalPages(total, limit),
  };
}

/**
 * Retrieves a single user by primary key.
 *
 * @param id - User ID
 * @returns User or null if not found
 */
export async function getUserById(id: number): Promise<UserResponse | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? formatUser(user) : null;
}

/**
 * Partially updates a user record (name, email, password).
 *
 * @param id - User ID to update
 * @param data - Validated update payload
 */
export async function updateUser(id: number, data: UpdateUserInput): Promise<UserResponse> {
  const existing = await prisma.user.findUnique({ where: { id } });

  if (!existing) {
    throw new UserServiceError('User not found', 404, 'USER_NOT_FOUND');
  }

  // Prevent duplicate email when changing email address
  if (data.email && data.email !== existing.email) {
    const duplicate = await prisma.user.findUnique({ where: { email: data.email } });
    if (duplicate) {
      throw new UserServiceError('Email is already in use', 409, 'EMAIL_ALREADY_EXISTS');
    }
  }

  const updateData: Prisma.UserUpdateInput = {};

  if (data.firstName) {
    updateData.firstName = data.firstName;
  }
  if (data.lastName) {
    updateData.lastName = data.lastName;
  }
  if (data.phoneNumber) {
    updateData.phoneNumber = data.phoneNumber;
  }
  if (data.email) {
    updateData.email = data.email;
  }
  if (data.password) {
    // Hash new password — same cost factor as auth-service (12 rounds)
    updateData.password = await bcrypt.hash(data.password, 12);
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  return formatUser(updated);
}

/**
 * Permanently deletes a user account.
 * Prevents admins from deleting their own account while authenticated.
 *
 * @param id - User ID to delete
 * @param requestingAdminId - ID of the admin performing the deletion
 */
export async function deleteUser(id: number, requestingAdminId: number): Promise<void> {
  if (id === requestingAdminId) {
    throw new UserServiceError(
      'You cannot delete your own account',
      400,
      'SELF_DELETE_FORBIDDEN'
    );
  }

  const existing = await prisma.user.findUnique({ where: { id } });

  if (!existing) {
    throw new UserServiceError('User not found', 404, 'USER_NOT_FOUND');
  }

  await prisma.user.delete({ where: { id } });
}

/**
 * Assigns a new role (ADMIN, INSPECTOR, or CLIENT) to an existing user.
 *
 * @param id - Target user ID
 * @param data - Role assignment payload
 */
export async function assignRole(id: number, data: AssignRoleInput): Promise<UserResponse> {
  const existing = await prisma.user.findUnique({ where: { id } });

  if (!existing) {
    throw new UserServiceError('User not found', 404, 'USER_NOT_FOUND');
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role: data.role as Role },
  });

  return formatUser(updated);
}

/**
 * Returns aggregate user statistics for admin dashboard widgets.
 */
export async function getUserStats(): Promise<UserStats> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [total, admins, inspectors, clients, verified, unverified, createdLast30Days] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: Role.ADMIN } }),
      prisma.user.count({ where: { role: Role.INSPECTOR } }),
      prisma.user.count({ where: { role: Role.CLIENT } }),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.user.count({ where: { isVerified: false } }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    ]);

  return { total, admins, inspectors, clients, verified, unverified, createdLast30Days };
}
