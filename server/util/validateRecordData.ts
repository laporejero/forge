import { Field } from "../models";
import { ValidationResult } from "../types/types";

export const validateRecordData = (data: object, fields: Field[]): ValidationResult => {
    const fieldIds = Object.keys(data)

    for (const fieldId of fieldIds) {
        const fieldExists = fields.some(field => field.id === Number(fieldId))

        if (!fieldExists) {
            return {
                valid: false,
                error: `Unknown field ID '${fieldId}'`
            }
        }
    }

    for (const field of fields) {
        if (field.required === true) {
            const targetKey = String(field.id)

            if (!(targetKey in data)) {
                return {
                    valid: false,
                    error: `Required field '${field.name}' is missing`
                }
            }
        }
    }

    for (const [fieldId, value] of Object.entries(data)) {
        const field = fields.find(field => field.id === Number(fieldId))

        if (!field) {
            return {
                valid: false,
                error: `Unknown field ID '${fieldId}'`
            }
        }

        if (field.type === 'text' && typeof value !== 'string') {
            return {
                valid: false,
                error: `Field '${field.name}' must be text`
            }
        }

        if (field.type === 'number' && (typeof value !== 'number' || Number.isNaN(value))) {
            return {
                valid: false,
                error: `Field '${field.name}' must be number`
            }
        }

        if (field.type === 'boolean' && typeof value !== 'boolean') {
            return {
                valid: false,
                error: `Field '${field.name}' must be either true or false`
            }
        }

        if (field.type === 'date') {
            const datePattern = /^\d{4}-\d{2}-\d{2}$/

            if (typeof value !== 'string' || !datePattern.test(value)) {
                return {
                    valid: false,
                    error: `Field '${field.name}' must be a date in YYYY-MM-DD format`
                }
            }

            const [year, month, day] = value.split('-').map(Number)
            const date = new Date(year, month - 1, day)

            const isRealDate =
                date.getFullYear() === year &&
                date.getMonth() === month - 1 &&
                date.getDate() === day

            if (!isRealDate) {
                return {
                    valid: false,
                    error: `Field '${field.name}' must be a real date`
                }
            }
        }
    }

    return { valid: true }
}