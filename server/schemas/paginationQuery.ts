import { z } from 'zod'

export const paginationQuerySchema = z.object({
    page: z.coerce.number()
        .int("Page must be a whole number")
        .positive("Page must be greater than 0")
        .default(1),
        
    limit: z.coerce.number()
        .int("Limit must be a whole number")
        .min(1, "Limit must be at least 1")
        .max(100, "Limit cannot exceed 100")
        .default(20)
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>