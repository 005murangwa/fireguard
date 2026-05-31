import { z } from 'zod';

export const createExtinguisherSchema = z.object({
  clientId: z.number().int().positive(),
  serialNumber: z.string().min(1, 'Serial number is required'),
  extinguisherType: z.string().min(1, 'Extinguisher type is required'),
  quantity: z.number().int().min(1).default(1),
  purchaseDate: z.string().min(1),
  expiryDate: z.string().min(1),
});

export const updateExtinguisherSchema = createExtinguisherSchema.partial();

export type CreateExtinguisherDto = z.infer<typeof createExtinguisherSchema>;
export type UpdateExtinguisherDto = z.infer<typeof updateExtinguisherSchema>;
