import { z } from 'zod'
import { issue } from 'zod/v4/core/util.cjs'

export const loginSchema = z.object({
    email: z
        .string({
            error: (issue) =>
                issue.input === undefined || issue.input === null
                    ? 'Email is required'
                    : 'Invalid email'
        })
        .trim()
        .min(1, {
            error: 'Email is required'
        })
        .pipe(
            z.email({
                error: 'Must be a valid email address'
            })
        ),

    password: z
        .string({
            error: (issue) =>
                issue.input === undefined || issue.input === null
                    ? 'Password is required'
                    : 'Invalid password'
        })
        .min(1, {
            error: 'Password is required'
        })
})