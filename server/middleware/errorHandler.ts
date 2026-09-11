import { Request, Response, NextFunction } from 'express'
import { UniqueConstraintError, ValidationError } from 'sequelize'

const errorHandler = (error: unknown, req: Request, res: Response, next: NextFunction) => {
    if (error instanceof Error) {
        if (error instanceof UniqueConstraintError) {
            return res.status(409).json({
                error: error.errors[0].message
            })
        }

        if (error instanceof ValidationError) {
            return res.status(400).json({
                error: error.errors[0].message
            })
        }
    }

    console.error(error)

    return res.status(500).json({
        error: 'Internal server error'
    })
}

export default errorHandler
