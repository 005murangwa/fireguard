import { z } from 'zod';

export const createClientSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  nationalId: z.string().min(5, 'National ID is required'),
  phoneNumber: z.string().min(7, 'Phone number is required'),
  email: z.string().email('Invalid email address'),
  companyName: z.string().min(2, 'Company name is required'),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientDto = z.infer<typeof createClientSchema>;
export type UpdateClientDto = z.infer<typeof updateClientSchema>;
