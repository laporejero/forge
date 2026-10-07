import Field from "../models/field"
import { FilterQuery } from "../schemas/filterQuery"

type ConversionResult =
    | { valid: true; value: string | number | boolean }
    | { valid: false; error: string }

export const allowedOperators = {
    number: ['eq', 'gt', 'gte', 'lt', 'lte'],
    text: ['eq', 'contains'],
    boolean: ['eq'],
    date: ['eq', 'gt', 'gte', 'lt', 'lte']
}

export const isOperatorAllowed = (
    query: FilterQuery, 
    field: Field
) => {
    return allowedOperators[field.type].includes(query.operator)
}

export const convertFilterValue = (query: FilterQuery, field: Field): ConversionResult => {
    if (field.type === 'text') {
        return {
            valid: true,
            value: query.value
        }
    }

    if (field.type === 'number') {
        if (query.value.trim() === '') {
            return {
                valid: false,
                error: `Field '${field.name}' must be a number`
            }
        }

        const numberValue = Number(query.value)

        if (Number.isNaN(numberValue)) {
            return {
                valid: false,
                error: `Field '${field.name}' must be a number`
            }
        } 

        return {
            valid: true,
            value: numberValue
        }
    }

    if (field.type === 'boolean') {
        if (query.value === 'true') {
            return { valid: true, value: true }
        } else if (query.value === 'false') {
            return { valid: true, value: false }
        } else {
            return { valid: false, error: `Field '${field.name}' must be true or false` }
        }
    }

    if (field.type === 'date') {
        const datePattern = /^\d{4}-\d{2}-\d{2}$/

        if (!datePattern.test(query.value)) {
            return {
                valid: false,
                error: `Field '${field.name}' must be a date in YYYY-MM-DD format`
            }
        }

        const [year, month, day] = query.value.split('-').map(Number)
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

        return {
            valid: true,
            value: query.value
        }
    }

    return {
        valid: false,
        error: `Unsupported field type '${field.type}'`
    }
}

export const validateFilter = (query: FilterQuery, field: Field) => {
    const operatorIsAllowed = isOperatorAllowed(query, field)

    if (!operatorIsAllowed) {
        return {
            valid: false, 
            error: `Operator '${query.operator}' is not supported for ${field.type} fields`
        }
    }

    const conversionResult = convertFilterValue(query, field)

    if (!conversionResult.valid) {
        return {
            valid: false,
            error: conversionResult.error
        }
    }

    return {
        valid: true,
        value: conversionResult.value
    }
}