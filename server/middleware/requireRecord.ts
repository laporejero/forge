import { Request, Response, NextFunction } from 'express'
import { parseId } from '../util/parseId'
import Record from '../models/record'

const requireRecord = async (
    req: Request<{recordId: string}>,
    res: Response,
    next: NextFunction
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

    req.record = record

    next()
}

export default requireRecord