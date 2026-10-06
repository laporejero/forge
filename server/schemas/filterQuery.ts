import { z } from 'zod'

export const filterQuerySchema = z.object({
    field: z.string({
            error: (issue) =>
                issue.input === undefined || issue.input === null
                    ? 'Invalid field'
                    : undefined
        })
        .trim()
        .min(1, { error: 'Invalid field' }),
    
    operator: z.enum(['eq', 'gt', 'gte', 'lt', 'lte', 'contains']),
    
    value: z.string({
        error: (issue) =>
            issue.input === undefined || issue.input === null
                ? 'Invalid value'
                : undefined
    })
})

export type FilterQuery = z.infer<typeof filterQuerySchema>