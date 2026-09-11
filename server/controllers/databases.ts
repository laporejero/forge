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

router.get('/', tokenExtractor, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.decodedToken!.id

        const databases = await Database.findAll({
            where: { userId },
            attributes: { exclude: ['userId'] },
            include: {
                model: User,
                attributes: ['id', 'name', 'email']
            }
        })

        return res.json(databases)
    } catch (error) {
        next(error)
    }
})

router.get('/:id', tokenExtractor, async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id)
        const userId = req.decodedToken!.id

        if (Number.isNaN(id) || id <= 0) {
            return res.status(400).json({
                error: 'invalid database ID'
            })
        }

        const database = await Database.findOne({
            where: { 
                id, 
                userId
            },
            attributes: { exclude: ['userId'] },
            include: {
                model: User,
                attributes: ['id', 'name', 'email']
            },
        })

        if (!database) {
            return res.status(404).json({
                error: 'database not found'
            })
        }

        return res.status(200).json(database)
    } catch (error) {
        next(error)
    }
})

router.put('/:id', tokenExtractor, async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id)
        const userId = req.decodedToken!.id

        if (Number.isNaN(id) || id <= 0) {
            return res.status(400).json({
                error: 'invalid database ID'
            })
        }

        const database = await Database.findOne({
            where: { 
                id, 
                userId
            }
        })

        if (!database) {
            return res.status(404).json({
                error: 'database not found'
            })
        }

        const name = req.body.name

        if (typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({
                error: 'invalid name'
            })
        }

        database.name = name

        await database.save()

        return res.status(200).json(database)
    } catch (error) {
        next(error)
    }
})

router.delete('/:id', tokenExtractor, async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
        const id = Number(req.params.id)
        const userId = req.decodedToken!.id

        if (Number.isNaN(id) || id <= 0) {
            return res.status(400).json({
                error: 'invalid database ID'
            })
        }

        const database = await Database.findOne({
            where: { 
                id, 
                userId
            }
        })

        if (!database) {
            return res.status(404).json({
                error: 'database not found'
            })
        }

        await database.destroy()

        return res.status(204).end()
    } catch (error) {
        next(error)
    }
})

export default router