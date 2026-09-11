import { Request, Response, NextFunction } from 'express'

const errorHandler = (error: unknown, req: Request, res: Response, next: NextFunction) => {
    if (error instanceof Error) {
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                error: error.message
            })
        }

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                error: 'Resource already exists'
            })
        }
    }

    console.error(error)

    return res.status(500).json({
        error: 'Internal server error'
    })
}

export default errorHandler
