import { z } from 'zod'

export const newUserSchema = z.object({
    name: z
        .string({ 
            error: (issue) =>
                issue.input === undefined || issue.input === null
                    ? 'Name is required'
                    : 'Invalid name'
        })
        .trim()
        .min(1, { 
            error: 'Name is required' 
        })
        .min(2, {
            error: 'Name must be between 2 and 30 characters'
        })
        .max(30, {
            error: 'Name must be between 2 and 30 characters'
        }),

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
        .min(8, {
            error: 'Password must be at least 8 characters'
        })
})