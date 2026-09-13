import { z } from 'zod'

export const databaseSchema = z.object({
    name: z
        .string({
            error: (issue) =>
                issue.input === undefined || issue.input === null
                    ? 'Database name is required'
                    : 'Invalid database name'
        })
        .trim()
        .min(1, { error: 'Database name is required' })
        .max(30, { error: 'Database name must be 30 characters or less' })
})

export type DatabaseInput = z.infer<typeof databaseSchema>