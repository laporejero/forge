import { z } from 'zod'

export const sortQuerySchema = z.object({
    sortField: z.string({
            error: (issue) => 
                issue.input === undefined || issue.input === null
                    ? 'Invalid field'
                    : undefined
        })
        .trim()
        .min(1, { error: 'Invalid field' }),

    sortOrder: z.enum(['asc', 'desc'], {
        error: 'Sort order must be either asc or desc'
    }).default('asc')
})

export type SortQuery = z.infer<typeof sortQuerySchema>