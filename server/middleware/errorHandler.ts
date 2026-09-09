import { Request, Response, NextFunction } from 'express'

const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
            error: error.errors.map((e: any) => e.message)
        })
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
            error: error.errors.map((e: any) => e.message)
        })
    }

    return res.status(500).json({
        error: 'Internal server error'
    })
}

export default errorHandler
