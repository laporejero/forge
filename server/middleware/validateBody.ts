import { Request, Response, NextFunction } from 'express'
import { ZodType } from 'zod'

const validateBody = (schema: ZodType) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body)

        if (!result.success) {
            return res.status(400).json({
                error: result.error.issues[0].message
            })
        }

        req.body = result.data

        next()
    }
}

export default validateBody