import { Router, Request, Response } from 'express'
import { Record, Field } from '../models'
import tokenExtractor from '../middleware/tokenExtractor'
import validateBody from '../middleware/validateBody'
import { recordSchema, RecordInput } from '../schemas/record'
import { parseId } from '../util/parseId'
import { validateRecordData } from '../util/validateRecordData'
import requireDatabaseOwnership from '../middleware/requireDatabaseOwnership'

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

    const records: Record[] = await Record.findAll({
        where: { databaseId },
        order: [['id', 'ASC']]
    })

    return res.status(200).json(records)
})

router.get('/:recordId',
    tokenExtractor,
    requireDatabaseOwnership,
    async (
        req: Request<{ databaseId: string, recordId: string }>,
        res: Response
    ) => {
    const recordId = parseId(req.params.recordId)
    const databaseId = req.database!.id

    if (!recordId) {
        return res.status(400).json({
            error: 'Invalid record ID'
        })
    }

    const record = await Record.findOne({
        where: { databaseId, id: recordId }
    })

    if (!record) {
        return res.status(404).json({
            error: 'Record not found'
        })
    }

    return res.status(200).json(record)
})

router.put('/:recordId',
    tokenExtractor,
    requireDatabaseOwnership,
    validateBody(recordSchema),
    async (
        req: Request<{databaseId : string, recordId: string}, {}, RecordInput>,
        res: Response
    ) => {
    const databaseId = req.database!.id
    const recordId = parseId(req.params.recordId)

    if (!recordId) {
        return res.status(400).json({
            error: 'Invalid record ID'
        })
    }

    const record = await Record.findOne({
        where: { databaseId, id: recordId }
    })

    if (!record) {
        return res.status(404).json({
            error: 'Record not found'
        })
    }

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
    validateBody(recordSchema),
    async (
        req: Request<{databaseId: string, recordId: string}, {}, RecordInput>,
        res: Response
    ) => {
    const databaseId = req.database!.id
    const recordId = parseId(req.params.recordId)

    if (!recordId) {
        return res.status(400).json({
            error: 'Invalid record ID'
        })
    }

    const record = await Record.findOne({
        where: { databaseId, id: recordId }
    })

    if (!record) {
        return res.status(404).json({
            error: 'Record not found'
        })
    }

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
    async (
        req: Request<{databaseId: string, recordId: string}>, 
        res: Response
    ) => {
    const databaseId = req.database!.id
    const recordId = parseId(req.params.recordId)

    if (!recordId) {
        return res.status(400).json({
            error: 'Invalid record ID'
        })
    }

    const record = await Record.findOne({
        where: { databaseId, id: recordId }
    })

    if (!record) {
        return res.status(404).json({
            error: 'Record not found'
        })
    }

    await record.destroy()

    return res.status(204).end()
})

export default router