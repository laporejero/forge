import { Request, Response } from 'express'

const unknownEndpoint = (req: Request, res: Response) => {
    res.status(404).json({
        error: 'Unknown endpoint'
    })
}

export default unknownEndpoint
