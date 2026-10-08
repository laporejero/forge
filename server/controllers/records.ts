import { Router, Request, Response } from 'express'
import { Record, Field } from '../models'
import tokenExtractor from '../middleware/tokenExtractor'
import validateBody from '../middleware/validateBody'
import { recordSchema, RecordInput } from '../schemas/record'
import { validateRecordData } from '../util/validateRecordData'
import requireDatabaseOwnership from '../middleware/requireDatabaseOwnership'
import requireRecord from '../middleware/requireRecord'
import { filterQuerySchema } from '../schemas/filterQuery'
import { parseId } from '../util/parseId'
import { buildFilterCondition, validateFilter } from '../util/queryEngine'
import { Op } from 'sequelize'

const router = Router({ mergeParams: true })

router.post('/', 
    tokenExtractor,
    requireDatabaseOwnership,
    validateBody(recordSchema), 
    async (
        req: Request<{databaseId: string}, {}, RecordInput>,
        res: Response
    ) => {
    const databaseId = req.database!.id

    const fields: Field[] = await Field.findAll({
        where: { databaseId }
    })

    if (fields.length === 0) {
        return res.status(400).json({
            error: 'Database must have at least one field before creating records'
        })
    }

    const validationResult = validateRecordData(req.body.data, fields)

    if (!validationResult.valid) {
        return res.status(400).json({
            error: validationResult.error
        })
    }

    const record = await Record.create({
        databaseId,
        data: req.body.data
    })

    return res.status(201).json(record)
})

router.get('/',
    tokenExtractor,
    requireDatabaseOwnership,
    async (
        req: Request<{ databaseId: string }>,
        res: Response
    ) => {
    const databaseId = req.database!.id
    let filterCondition
    
    if (Object.keys(req.query).length > 0) {
        const result = filterQuerySchema.safeParse(req.query)
    
        if (!result.success) {
            return res.status(400).json({
                error: 'Invalid filter query'
            })
        }

        const fieldId = parseId(result.data.field)

        if (!fieldId) {
            return res.status(400).json({
                error: 'Invalid field ID'
            })
        }

        const field = await Field.findOne({
            where: { id: fieldId, databaseId }
        })

        if (!field) {
            return res.status(404).json({
                error: 'Field not found'
            })
        }

        const validationResult = validateFilter(result.data, field)

        if (!validationResult.valid) {
            return res.status(400).json({
                error: validationResult.error
            })
        }

        filterCondition = buildFilterCondition(
            result.data,
            field,
            validationResult.value
        )
    }

    const records: Record[] = await Record.findAll({
        where: { 
            databaseId,
            ...(filterCondition ? { [Op.and]: [filterCondition] } : {})
        },
        order: [['id', 'ASC']]
    })

    return res.status(200).json(records)
})

router.get('/:recordId',
    tokenExtractor,
    requireDatabaseOwnership,
    requireRecord,
    async (
        req: Request<{ databaseId: string, recordId: string }>,
        res: Response
    ) => {    
        return res.status(200).json(req.record)
    }
)

router.put('/:recordId',
    tokenExtractor,
    requireDatabaseOwnership,
    requireRecord,
    validateBody(recordSchema),
    async (
        req: Request<{databaseId : string, recordId: string}, {}, RecordInput>,
        res: Response
    ) => {
    const databaseId = req.database!.id
    const record = req.record!

    const fields = await Field.findAll({
        where: { databaseId }
    })

    if (fields.length === 0) {
        return res.status(400).json({
            error: 'Database must have at least one field before updating records'
        })
    }

    // validate replacement data against dynamic fields
    const validationResult = validateRecordData(req.body.data, fields)

    if (!validationResult.valid) {
        return res.status(400).json({
            error: validationResult.error
        })
    }

    // PUT
    record.data = req.body.data

    await record.save()

    return res.status(200).json(record)
})

router.patch('/:recordId',
    tokenExtractor,
    requireDatabaseOwnership,
    requireRecord,
    validateBody(recordSchema),
    async (
        req: Request<{databaseId: string, recordId: string}, {}, RecordInput>,
        res: Response
    ) => {
    const databaseId = req.database!.id
    const record = req.record!

    const fields = await Field.findAll({
        where: { databaseId }
    })

    if (fields.length === 0) {
        return res.status(400).json({
            error: 'Database must have at least one field before updating records'
        })
    }

    // PATCH
    const mergedData = {
        ...record.data,
        ...req.body.data
    }

    const validationResult = validateRecordData(mergedData, fields)

    if (!validationResult.valid) {
        return res.status(400).json({
            error: validationResult.error
        })
    }

    record.data = mergedData

    await record.save()
    
    return res.status(200).json(record)
})

router.delete('/:recordId', 
    tokenExtractor, 
    requireDatabaseOwnership,
    requireRecord,
    async (
        req: Request<{databaseId: string, recordId: string}>, 
        res: Response
    ) => {
    const record = req.record!

    await record.destroy()

    return res.status(204).end()
})

export default router