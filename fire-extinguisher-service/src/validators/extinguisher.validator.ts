/**
 * =============================================================================
 * FireGuard LTD - Fire Extinguisher Zod Validators
 * =============================================================================
 * Request validation schemas for CRUD, search, filter, and pagination.
 * =============================================================================
 */

import { z } from 'zod';

/** Allowed status enum values matching Prisma ExtinguisherStatus. */
const statusEnum = z.enum(['ACTIVE', 'EXPIRED', 'UNDER_MAINTENANCE', 'INSPECTION_DUE']);

/** ISO date or YYYY-MM-DD string validator. */
const dateField = z
  .string()
  .refine((val) => !Number.isNaN(Date.parse(val)), { message: 'Invalid date format' });

/**
 * Body schema for POST /extinguishers — creates a new unit with QR code.
 */
export const createExtinguisherSchema = z.object({
  extinguisherCode: z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    z.string().trim().min(3).max(50).optional()
  ),
  type: z.string().trim().min(1, 'Type is required').max(100),
  manufacturer: z.string().trim().min(1, 'Manufacturer is required').max(100),
  capacity: z.string().trim().min(1, 'Capacity is required').max(50),
  installationLocation: z.string().trim().min(1, 'Installation location is required').max(255),
  manufacturingDate: dateField,
  expirationDate: dateField,
  status: statusEnum.optional(),
  assignedClientId: z.preprocess(
    (val) => {
      const n = Number(val);
      return val === null || val === undefined || val === '' || Number.isNaN(n) || n <= 0 ? undefined : n;
    },
    z.number().int().positive().optional()
  ),
});

/**
 * Body schema for PATCH /extinguishers/:id — partial update.
 */
export const updateExtinguisherSchema = z
  .object({
    type: z.string().trim().min(1).max(100).optional(),
    manufacturer: z.string().trim().min(1).max(100).optional(),
    capacity: z.string().trim().min(1).max(50).optional(),
    installationLocation: z.string().trim().min(1).max(255).optional(),
    manufacturingDate: dateField.optional(),
    expirationDate: dateField.optional(),
    status: statusEnum.optional(),
    assignedClientId: z.number().int().positive().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

/**
 * Query schema for GET /extinguishers — search, filter, pagination.
 */
export const listExtinguishersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  status: statusEnum.optional(),
  type: z.string().trim().optional(),
  manufacturer: z.string().trim().optional(),
  assignedClientId: z.coerce.number().int().positive().optional(),
});

/** Route param for numeric extinguisher ID. */
export const extinguisherIdParamSchema = z.object({
  id: z.coerce.number().int().positive('Extinguisher ID must be a positive integer'),
});

/** Route param for QR scan by extinguisher code. */
export const scanCodeParamSchema = z.object({
  code: z.string().trim().min(1, 'Extinguisher code is required'),
});

export type CreateExtinguisherInput = z.infer<typeof createExtinguisherSchema>;
export type UpdateExtinguisherInput = z.infer<typeof updateExtinguisherSchema>;
export type ListExtinguishersQuery = z.infer<typeof listExtinguishersQuerySchema>;
