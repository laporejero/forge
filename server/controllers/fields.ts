import { Router, Request, Response } from 'express'
import { Field, Database } from '../models'
import tokenExtractor from '../middleware/tokenExtractor'
import validateBody from '../middleware/validateBody'
import { fieldSchema, FieldInput } from '../schemas/field'
import { parseId } from '../util/parseId'
import { Op } from 'sequelize'

const router = Router({ mergeParams: true })

router.post('/',
    tokenExtractor,
    validateBody(fieldSchema),
    async (
        req: Request<{ databaseId: string }, {}, FieldInput>,
        res: Response
    ) => {
    const databaseId = parseId(req.params.databaseId)
    const userId = req.decodedToken!.id

    const { name, type, required } = req.body

    if (!databaseId) {
        return res.status(400).json({
            error: 'Invalid database ID'
        })
    }

    const database = await Database.findOne({
        where: { id: databaseId, userId }
    })

    if (!database) {
        return res.status(404).json({
            error: 'Database not found'
        })
    }

    const existingField = await Field.findOne({
        where: { name, databaseId }
    })

    if (existingField) {
        return res.status(409).json({
            error: 'A field with this name already exists'
        })
    }

    const field = await Field.create({
        name,
        type,
        required,
        databaseId
    })

    return res.status(201).json(field)
})

router.get('/', 
    tokenExtractor, 
    async (
        req: Request<{ databaseId: string }>, 
        res: Response
    ) => {
    const databaseId = parseId(req.params.databaseId)
    const userId = req.decodedToken!.id

    if (!databaseId) {
        return res.status(400).json({
            error: 'Invalid database ID'
        })
    }

    const database = await Database.findOne({
        where: { id: databaseId, userId }
    })

    if (!database) {
        return res.status(404).json({
            error: 'Database not found'
        })
    }

    const fields = await Field.findAll({
        where: { databaseId },
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        order: [['createdAt', 'ASC']]
    })

    return res.status(200).json(fields)
})

router.get('/:fieldId', 
    tokenExtractor,
    async (
        req: Request<{ databaseId: string, fieldId: string }>,
        res: Response
    ) => {
    const databaseId = parseId(req.params.databaseId)
    const fieldId = parseId(req.params.fieldId)
    const userId = req.decodedToken!.id

    if (!databaseId) {
        return res.status(400).json({
            error: 'Invalid database ID'
        })
    }

    if (!fieldId) {
        return res.status(400).json({
            error: 'Invalid field ID'
        })
    }

    const database = await Database.findOne({
        where: { id: databaseId, userId }
    })

    if (!database) {
        return res.status(404).json({
            error: 'Database not found'
        })
    }

    const field = await Field.findOne({
        where: { databaseId, id: fieldId },
    })

    if (!field) {
        return res.status(404).json({
            error: 'Field not found'
        })
    }

    return res.status(200).json(field)
})

router.put('/:fieldId',
    tokenExtractor,
    validateBody(fieldSchema),
    async (
        req: Request<{ databaseId: string, fieldId: string }, {}, FieldInput>,
        res: Response
    ) => {
    const databaseId = parseId(req.params.databaseId)
    const fieldId = parseId(req.params.fieldId)
    const userId = req.decodedToken!.id

    if (!databaseId) {
        return res.status(400).json({
            error: 'Invalid database ID'
        })
    }

    if (!fieldId) {
        return res.status(400).json({
            error: 'Invalid field ID'
        })
    }

    const database = await Database.findOne({
        where: { id: databaseId, userId }
    })

    if (!database) {
        return res.status(404).json({
            error: 'Database not found'
        })
    }

    const field = await Field.findOne({
        where: { databaseId, id: fieldId },
    })

    if (!field) {
        return res.status(404).json({
            error: 'Field not found'
        })
    }

    const { name, type, required } = req.body

    const existingField = await Field.findOne({
        where: { 
            name, 
            databaseId, 
            id: { [Op.ne]: fieldId } 
        }
    })

    if (existingField) {
        return res.status(409).json({
            error: 'A field with this name already exists'
        })
    }

    field.name = name
    field.type = type
    field.required = required

    await field.save()

    return res.status(200).json(field)
})

router.delete('/:fieldId', 
    tokenExtractor, 
    async (
        req: Request<{ databaseId: string, fieldId: string }, {}, FieldInput>, 
        res: Response
    ) => {
    const databaseId = parseId(req.params.databaseId)
    const fieldId = parseId(req.params.fieldId)
    const userId = req.decodedToken!.id

    if (!databaseId) {
        return res.status(400).json({
            error: 'Invalid database ID'
        })
    }

    if (!fieldId) {
        return res.status(400).json({
            error: 'Invalid field ID'
        })
    }

    const database = await Database.findOne({
        where: { id: databaseId, userId }
    })

    if (!database) {
        return res.status(404).json({
            error: 'Database not found'
        })
    }

    const field = await Field.findOne({
        where: { databaseId, id: fieldId },
    })

    if (!field) {
        return res.status(404).json({
            error: 'Field not found'
        })
    }

    await field.destroy()

    return res.status(204).end()
})

export default router