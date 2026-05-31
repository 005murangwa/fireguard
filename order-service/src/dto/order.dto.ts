import { z } from 'zod';

const orderItemSchema = z.object({
  extinguisherType: z.string().min(1, 'Extinguisher type is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const createOrderSchema = z.object({
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
});

export const rejectOrderSchema = z.object({
  rejectionReason: z.string().min(3, 'Rejection reason is required'),
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;
export type RejectOrderDto = z.infer<typeof rejectOrderSchema>;
