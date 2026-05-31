import { z } from 'zod';

export const createFollowUpSchema = z.object({
  clientId: z.number().int().positive(),
  extinguisherId: z.number().int().positive(),
  notes: z.string().optional(),
});

export const updateFollowUpSchema = z.object({
  status: z.enum(['PENDING', 'CONTACTED', 'UNREACHABLE', 'ESCALATED', 'RESOLVED']).optional(),
  notes: z.string().optional(),
});

export type CreateFollowUpDto = z.infer<typeof createFollowUpSchema>;
export type UpdateFollowUpDto = z.infer<typeof updateFollowUpSchema>;
