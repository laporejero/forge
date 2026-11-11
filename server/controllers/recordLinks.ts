import { Router, Request, Response } from 'express'
import tokenExtractor from '../middleware/tokenExtractor'
import requireDatabaseOwnership from '../middleware/requireDatabaseOwnership'
import requireRecord from '../middleware/requireRecord'
import requireField from '../middleware/requireField'
import validateBody from '../middleware/validateBody'
import { CreateRecordLinkInput, createRecordLinkSchema } from '../schemas/recordLink'
import { Database, Record, RecordLink } from '../models'
import { UniqueConstraintError } from 'sequelize'

const router = Router({ mergeParams: true })

router.post('/', 
    tokenExtractor, 
    requireDatabaseOwnership,
    requireRecord,
    requireField,
    validateBody(createRecordLinkSchema),
    async(
        req: Request<
            { databaseId: string; recordId: string; fieldId: string },
            {},
            CreateRecordLinkInput  
        >, 
        res: Response
    ) => {
        const field = req.field!
        const { targetRecordId } = req.body

        if (field.type !== 'relation') {
            return res.status(400).json({
                error: 'Field is not a relationship field'
            })
        }

        const targetDatabase = await Database.findOne({
            where: {
                id: field.targetDatabaseId,
                userId: req.decodedToken!.id
            }
        })

        if (!targetDatabase) {
            return res.status(404).json({
                error: 'Target database not found'
            })
        }

        const targetRecord = await Record.findOne({
            where: {
                id: targetRecordId,
                databaseId: targetDatabase.id
            }
        })

        if (!targetRecord) {
            return res.status(404).json({
                error: 'Target record not found'
            })
        }

        const inverseFieldId = field.inverseFieldId

        if (inverseFieldId === null) {
            return res.status(400).json({
                error: 'Relationship field is missing its inverse'
            })
        }

        const isCanonical = field.id < inverseFieldId

        const canonicalFieldId = isCanonical
            ? field.id
            : inverseFieldId

        const sourceRecordId = isCanonical
            ? req.record!.id
            : targetRecordId

        const canonicalTargetRecordId = isCanonical
            ? targetRecordId
            : req.record!.id

        const existingLink = await RecordLink.findOne({
            where: {
                fieldId: canonicalFieldId,
                sourceRecordId,
                targetRecordId: canonicalTargetRecordId
            }
        })

        if (existingLink) {
            return res.status(409).json({
                error: 'Record link already exists'
            })
        }

        try {
            const link = await RecordLink.create({
                fieldId: canonicalFieldId,
                sourceRecordId,
                targetRecordId: canonicalTargetRecordId
            })

            return res.status(201).json(link)
        } catch (error) {
            if (error instanceof UniqueConstraintError) {
                return res.status(409).json({
                    error: 'Record link already exists'
                })
            }

            throw error
        }
    }
)

export default router