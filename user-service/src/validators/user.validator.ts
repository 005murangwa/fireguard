/**
 * =============================================================================
 * FireGuard LTD - User Service Zod Validators
 * =============================================================================
 * WHAT: Request validation schemas for user admin endpoints.
 * WHY:  Reject malformed input before it reaches the service/database layer.
 * =============================================================================
 */

import { z } from 'zod';

/** Normalizes email to lowercase trimmed string — consistent with auth-service. */
const emailField = z
  .string()
  .trim()
  .email('Invalid email address')
  .transform((value) => value.toLowerCase());

/**
 * Query params for GET /users — supports pagination and optional role filter.
 */
export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(['ADMIN', 'INSPECTOR', 'CLIENT']).optional(),
  search: z.string().trim().optional(),
});

/**
 * Body for PATCH /users/:id — all fields optional (partial update).
 */
export const updateUserSchema = z
  .object({
    firstName: z.string().trim().min(2, 'First name must be at least 2 characters').optional(),
    lastName: z.string().trim().min(2, 'Last name must be at least 2 characters').optional(),
    phoneNumber: z.string().trim().min(7, 'Phone number is too short').optional(),
    email: emailField.optional(),
    password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

/**
 * Body for PATCH /users/:id/role — assign ADMIN, INSPECTOR, or CLIENT role.
 */
export const assignRoleSchema = z.object({
  role: z.enum(['ADMIN', 'INSPECTOR', 'CLIENT'], {
    errorMap: () => ({ message: 'Role must be ADMIN, INSPECTOR, or CLIENT' }),
  }),
});

/** Route param validator for numeric user IDs. */
export const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive('User ID must be a positive integer'),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
