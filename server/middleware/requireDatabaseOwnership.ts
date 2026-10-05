import { Request, Response, NextFunction } from 'express'
import { parseId } from '../util/parseId'
import { Database } from '../models'

const requireDatabaseOwnership = async (
    req: Request<{databaseId: string}>, 
    res: Response, 
    next: NextFunction
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
    
    req.database = database

    next()
}

export default requireDatabaseOwnership