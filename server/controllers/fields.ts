import { Router, Request, Response } from 'express'
import { Field, Record } from '../models'
import tokenExtractor from '../middleware/tokenExtractor'
import validateBody from '../middleware/validateBody'
import requireDatabaseOwnership from '../middleware/requireDatabaseOwnership'
import { fieldSchema, FieldInput } from '../schemas/field'
import { Op } from 'sequelize'
import requireField from '../middleware/requireField'
import { convertFieldValue } from '../util/fieldConversion'
import { sequelize } from '../util/db'

const router = Router({ mergeParams: true })

router.post('/',
    tokenExtractor,
    requireDatabaseOwnership,
    validateBody(fieldSchema),
    async (
        req: Request<{ databaseId: string }, {}, FieldInput>,
        res: Response
    ) => {
    const databaseId = req.database!.id

    const { name, type, required } = req.body

    const existingField = await Field.findOne({
        where: { name, databaseId }
    })

    if (existingField) {
        return res.status(409).json({
            error: 'A field with this name already exists'
        })
    }

    if (required) {
        const recordCount = await Record.count({
            where: { databaseId }
        })

        if (recordCount > 0) {
            return res.status(400).json({
                error: 'Cannot create a required field when records already exist'
            })
        }
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
    requireDatabaseOwnership,
    async (
        req: Request<{ databaseId: string }>, 
        res: Response
    ) => {
    const databaseId = req.database!.id

    const fields = await Field.findAll({
        where: { databaseId },
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        order: [['createdAt', 'ASC']]
    })

    return res.status(200).json(fields)
})

router.get('/:fieldId', 
    tokenExtractor,
    requireDatabaseOwnership,
    requireField,
    async (
        req: Request<{ databaseId: string, fieldId: string }>,
        res: Response
    ) => {
        return res.status(200).json(req.field)
    }
)

router.put('/:fieldId',
    tokenExtractor,
    requireDatabaseOwnership,
    requireField,
    validateBody(fieldSchema),
    async (
        req: Request<{ databaseId: string, fieldId: string }, {}, FieldInput>,
        res: Response
    ) => {
    const databaseId = req.database!.id
    const field = req.field!

    const { name, type, required } = req.body
    const typeChanged = field.type !== type

    const existingField = await Field.findOne({
        where: { 
            name, 
            databaseId, 
            id: { [Op.ne]: field.id } 
        }
    })

    if (existingField) {
        return res.status(409).json({
            error: 'A field with this name already exists'
        })
    }

    const needsRecordCheck = typeChanged || (!field.required && required)

    const records = needsRecordCheck 
        ? await Record.findAll({ where: { databaseId } })
        : []

    if (!field.required && required) {
        const fieldId = String(field.id)

        for (const record of records) {
            const value = record.data[fieldId]

            if (
                !Object.prototype.hasOwnProperty.call(record.data, fieldId) || 
                value === null
            ) {
                return res.status(400).json({
                    error: 'Cannot make field required: existing records have missing values'
                })
            }
        }
    }

    const conversions: { record: Record; value: string | number | boolean }[] = []

    if (typeChanged) {
        const fieldId = String(field.id)

        for (const record of records) {
            if (!Object.prototype.hasOwnProperty.call(record.data, fieldId)) {
                continue
            }

            const value = record.data[fieldId]

            if (value === null) {
                continue
            }

            const result = convertFieldValue(value, field.type, type)

            if (!result.success) {
                return res.status(400).json({
                    error: result.error
                })
            }

            conversions.push({ record, value: result.value })
        }
    }

    await sequelize.transaction(async (transaction) => {
        for (const { record, value } of conversions) {
            const updatedData = {
                ...record.data,
                [String(field.id)]: value
            }

            await record.update(
                { data: updatedData },
                { transaction }
            )
        }

        field.name = name
        field.type = type
        field.required = required

        await field.save({ transaction })
    })

    return res.status(200).json(field)
})

router.delete('/:fieldId', 
    tokenExtractor, 
    requireDatabaseOwnership,
    requireField,
    async (
        req: Request<{ databaseId: string, fieldId: string }>, 
        res: Response
    ) => {
    const field = req.field!
    const databaseId = req.database!.id
    const fieldId = String(field.id)

    const records = await Record.findAll({
        where: { databaseId }
    })

    await sequelize.transaction(async (transaction) => {
        for (const record of records) {
            if (!Object.prototype.hasOwnProperty.call(record.data, fieldId)) {
                continue
            }

            const updatedData = { ...record.data }

            delete updatedData[fieldId]

            await record.update(
                { data: updatedData },
                { transaction }
            )
        }

        await field.destroy({ transaction })
    })

    return res.status(204).end()
})

export default router