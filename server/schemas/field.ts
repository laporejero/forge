import { z } from 'zod'

export const fieldSchema = z.object({
    name: z.string({
            error: (issue) =>
                issue.input === undefined || issue.input === null
                    ? 'Field name is required'
                    : 'Invalid field name'
        })
        .trim()
        .min(1, { error: 'Field name is required' })
        .max(30, { error: 'Field name must be 30 characters or less' }),
    
    type: z.enum(['text', 'number', 'boolean', 'date'], {
        error: 'Field type must be text, number, boolean, or date'
    }),
    
    required: z.boolean({
        error: (issue) =>
            issue.code === 'invalid_type'
                ? 'Required must be either true or false'
                : 'Invalid value'
    }).default(false)
})

export type FieldInput = z.infer<typeof fieldSchema>
export type FieldType = z.infer<typeof fieldSchema>['type']