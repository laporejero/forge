import { Request, Response, NextFunction } from 'express'
import { parseId } from '../util/parseId'
import Field from '../models/field'

const requireField = async (
    req: Request<{fieldId: string}>,
    res: Response,
    next: NextFunction
) => {
    const fieldId = parseId(req.params.fieldId)
    const databaseId = req.database!.id

    if (!fieldId) {
        return res.status(400).json({
            error: 'Invalid field ID'
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

    req.field = field

    next()
}

export default requireField