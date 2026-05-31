/**
 * Zod Validation Schemas — Maintenance Service
 *
 * WHAT: Request validation for maintenance CRUD and complete workflow.
 * WHY:  ADMIN-only endpoints still need strict input validation.
 */
import { z } from 'zod';

/** Maintenance work order lifecycle states. */
export const maintenanceStatusSchema = z.enum([
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);

const dateField = z.coerce.date();

/** POST /maintenance — schedule a new maintenance work order. */
export const createMaintenanceSchema = z.object({
  extinguisherCode: z.string().trim().min(1).max(50),
  maintenanceDate: dateField,
  description: z.string().trim().min(3, 'Description is required').max(5000),
  technician: z.string().trim().min(2).max(100),
  status: maintenanceStatusSchema.default('SCHEDULED'),
});

/** PATCH /maintenance/:id — update an existing work order. */
export const updateMaintenanceSchema = createMaintenanceSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

/** POST /maintenance/:id/complete — mark work order as completed. */
export const completeMaintenanceSchema = z.object({
  description: z.string().trim().max(2000).optional(),
  maintenanceDate: dateField.optional(),
});

/** Numeric primary key route param. */
export const maintenanceIdParamSchema = z.object({
  id: z.coerce.number().int().positive('Maintenance ID must be a positive integer'),
});

/** Extinguisher code for history endpoint. */
export const extinguisherCodeParamSchema = z.object({
  extinguisherCode: z.string().trim().min(1).max(50),
});

export type CreateMaintenanceDto = z.infer<typeof createMaintenanceSchema>;
export type UpdateMaintenanceDto = z.infer<typeof updateMaintenanceSchema>;
export type CompleteMaintenanceDto = z.infer<typeof completeMaintenanceSchema>;
