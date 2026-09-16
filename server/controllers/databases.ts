import { Router, Request, Response } from 'express'
import { Database, User } from '../models'
import tokenExtractor from '../middleware/tokenExtractor'
import validateBody from '../middleware/validateBody'
import { databaseSchema, DatabaseInput } from '../schemas/database'
import { Op } from 'sequelize'
import { parseId } from '../util/parseId'

const router = Router()

router.post('/', 
    tokenExtractor,
    validateBody(databaseSchema),  
    async (
        req: Request<{}, {}, DatabaseInput>, 
        res: Response
    ) => {
    const { name } = req.body

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
        attributes: { exclude: ['userId', 'createdAt', 'updatedAt'] },
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
            error: 'Invalid database ID'
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
            error: 'Database not found'
        })
    }

    return res.status(200).json(database)
})

router.put('/:id', 
    tokenExtractor, 
    validateBody(databaseSchema),
    async (
        req: Request<{ id: string }, {}, DatabaseInput>, 
        res: Response
    ) => {
    const id = parseId(req.params.id)
    const userId = req.decodedToken!.id

    if (!id) {
        return res.status(400).json({
            error: 'Invalid database ID'
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
            error: 'Database not found'
        })
    }

    const name = req.body.name

    const existingDb = await Database.findOne({
        where: {
            name,
            userId: req.decodedToken!.id,
            id: { [Op.ne]: id }
        }
    })

    if (existingDb) {
        return res.status(409).json({
            error: 'A database with this name already exists'
        })
    }

    database.name = name

    await database.save()

    return res.status(200).json(database)
})

router.delete('/:id', tokenExtractor, async (req: Request<{ id: string }>, res: Response) => {
    const id = parseId(req.params.id)
    const userId = req.decodedToken!.id

    if (!id) {
        return res.status(400).json({
            error: 'Invalid database ID'
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
            error: 'Database not found'
        })
    }

    await database.destroy()

    return res.status(204).end()
})

export default router