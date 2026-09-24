import { z } from 'zod'

export const recordSchema = z.object({
    data: z.record(
        z.string(),
        z.union([z.string(), z.number(), z.boolean()])
    )
})

export type RecordInput = z.infer<typeof recordSchema>