import { Router, Request, Response } from 'express'
import { Database, User } from '../models'
import tokenExtractor from '../middleware/tokenExtractor'

const router = Router()

router.post('/', tokenExtractor, async (req: Request, res: Response) => {
    const { name } = req.body

    if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({
            error: 'Database name is required'
        })
    }

    const existingDb = await Database.findOne({
        where: {
            name,
            userId: req.decodedToken!.id
        }
    })

    if (existingDb) {
        return res.status(409).json({
            error: 'A database with this name already exists'
        })
    }

    const database = await Database.create({
        name,
        userId: req.decodedToken!.id
    })

    return res.status(201).json(database)
})

router.get('/', tokenExtractor, async (req: Request, res: Response) => {
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
})

router.get('/:id', tokenExtractor, async (req: Request<{ id: string }>, res: Response) => {
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
})

router.put('/:id', tokenExtractor, async (req: Request<{ id: string }>, res: Response) => {
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
})

router.delete('/:id', tokenExtractor, async (req: Request<{ id: string }>, res: Response) => {
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
})

export default router