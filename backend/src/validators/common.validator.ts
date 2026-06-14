import { z } from 'zod';

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// ID validation schema
export const idSchema = z.object({
  id: z.string().uuid('Invalid ID format'),
});

export type IdInput = z.infer<typeof idSchema>;

// Date range schema
export const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type DateRangeInput = z.infer<typeof dateRangeSchema>;

// Export all validators
export default {
  paginationSchema,
  idSchema,
  dateRangeSchema,
};
