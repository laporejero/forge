import { z } from 'zod'

export const createRecordLinkSchema = z.object({
    targetRecordId: z.number().int().positive()
})

export type CreateRecordLinkInput = z.infer<typeof createRecordLinkSchema>