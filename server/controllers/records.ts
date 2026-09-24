import { Router, Request, Response } from 'express'
import { Record, Database, Field } from '../models'
import tokenExtractor from '../middleware/tokenExtractor'
import validateBody from '../middleware/validateBody'
import { recordSchema, RecordInput } from '../schemas/record'
import { parseId } from '../util/parseId'
import { validateRecordData } from '../util/validateRecordData'

const router = Router({ mergeParams: true })

router.post('/', 
    tokenExtractor,
    validateBody(recordSchema), 
    async (
        req: Request<{databaseId: string}, {}, RecordInput>,
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

export default router