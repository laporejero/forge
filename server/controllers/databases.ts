import { Router, Request, Response, NextFunction } from 'express'
import { Database, User } from '../models'
import tokenExtractor from '../middleware/tokenExtractor'

const router = Router()

router.post('/', tokenExtractor, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const name = req.body.name?.trim()

        if (!name || name.length === 0) {
            return res.status(400).json({
                error: 'Database name is required'
            })
        }

        const database = await Database.create({
            name,
            userId: req.decodedToken!.id
        })

        return res.status(201).json(database)
    } catch (error) {
        next(error)
    }
})

export default router