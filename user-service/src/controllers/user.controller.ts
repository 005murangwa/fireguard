/**
 * =============================================================================
 * FireGuard LTD - User Service HTTP Controllers
 * =============================================================================
 * WHAT: Thin request/response handlers — no direct database access here.
 * WHY:  Maps HTTP semantics (status codes, JSON shape) to service layer calls.
 * =============================================================================
 */

import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import {
  listUsers,
  listStaff,
  getUserById,
  updateUser,
  deleteUser,
  assignRole,
  getUserStats,
  UserServiceError,
} from '../services/user.service';
import {
  ListUsersQuery,
  UpdateUserInput,
  AssignRoleInput,
} from '../validators/user.validator';

/** Typed request with validated query from validateQuery middleware. */
type ValidatedQueryRequest<T> = Request & { validatedQuery?: T };
/** Typed request with validated params from validateParams middleware. */
type ValidatedParamsRequest<T> = Request & { validatedParams?: T };

/**
 * GET /users — Paginated user list (ADMIN only).
 */
export async function listUsersHandler(
  req: ValidatedQueryRequest<ListUsersQuery>,
  res: Response
): Promise<void> {
  try {
    const query = req.validatedQuery!;
    const result = await listUsers(query);
    res.json(result);
  } catch (error) {
    handleError(error, res);
  }
}

/**
 * GET /users/staff — FireGuard admins and inspectors (all authenticated roles).
 */
export async function listStaffHandler(_req: Request, res: Response): Promise<void> {
  try {
    const staff = await listStaff();
    res.json(staff);
  } catch (error) {
    handleError(error, res);
  }
}

/**
 * GET /users/stats — Aggregate user statistics (ADMIN only).
 */
export async function getStatsHandler(_req: Request, res: Response): Promise<void> {
  try {
    const stats = await getUserStats();
    res.json(stats);
  } catch (error) {
    handleError(error, res);
  }
}

/**
 * GET /users/:id — Single user detail (ADMIN only).
 */
export async function getUserHandler(
  req: ValidatedParamsRequest<{ id: number }>,
  res: Response
): Promise<void> {
  try {
    const { id } = req.validatedParams!;
    const user = await getUserById(id);

    if (!user) {
      res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
      return;
    }

    res.json(user);
  } catch (error) {
    handleError(error, res);
  }
}

/**
 * PATCH /users/:id — Update user profile fields (ADMIN only).
 */
export async function updateUserHandler(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const data = req.body as UpdateUserInput;
    const user = await updateUser(id, data);
    res.json(user);
  } catch (error) {
    handleError(error, res);
  }
}

/**
 * DELETE /users/:id — Remove user account (ADMIN only).
 */
export async function deleteUserHandler(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const adminId = req.user!.userId;
    await deleteUser(id, adminId);
    res.status(204).send();
  } catch (error) {
    handleError(error, res);
  }
}

/**
 * PATCH /users/:id/role — Assign ADMIN, INSPECTOR, or CLIENT role (ADMIN only).
 */
export async function assignRoleHandler(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    const data = req.body as AssignRoleInput;
    const user = await assignRole(id, data);
    res.json(user);
  } catch (error) {
    handleError(error, res);
  }
}

/**
 * Centralized error mapper — converts service errors to HTTP responses.
 */
function handleError(error: unknown, res: Response): void {
  if (error instanceof UserServiceError) {
    res.status(error.statusCode).json({ error: error.message, code: error.code });
    return;
  }

  console.error('[user-service] Unexpected error:', error);
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
}
