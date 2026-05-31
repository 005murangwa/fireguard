/**
 * Zod Validation Schemas — Inspection Service
 *
 * WHAT: Request body/param validation for inspection CRUD endpoints.
 * WHY:  Reject malformed payloads before they reach the service layer.
 */
import { z } from 'zod';

/** Allowed physical condition values from field inspection forms. */
export const inspectionConditionSchema = z.enum([
  'EXCELLENT',
  'GOOD',
  'FAIR',
  'POOR',
  'FAILED',
  'REQUIRES_MAINTENANCE',
]);

/** Coerces ISO date strings or timestamps into Date objects. */
const dateField = z.coerce.date();

/** POST /inspections — create a new field inspection record. */
export const createInspectionSchema = z.object({
  extinguisherCode: z.string().trim().min(1, 'Extinguisher code is required').max(50),
  inspectionDate: dateField,
  condition: inspectionConditionSchema,
  remarks: z.string().trim().max(2000).optional().nullable(),
  nextInspectionDate: dateField,
});

/** PATCH /inspections/:id — partial update (at least one field required). */
export const updateInspectionSchema = createInspectionSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

/** Numeric primary key route param. */
export const inspectionIdParamSchema = z.object({
  id: z.coerce.number().int().positive('Inspection ID must be a positive integer'),
});

/** Extinguisher code for GET /inspections/history/:extinguisherCode. */
export const extinguisherCodeParamSchema = z.object({
  extinguisherCode: z.string().trim().min(1).max(50),
});

export type CreateInspectionDto = z.infer<typeof createInspectionSchema>;
export type UpdateInspectionDto = z.infer<typeof updateInspectionSchema>;
