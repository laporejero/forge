import { FieldType } from "../schemas/field";

export type ConversionResult =
    | { success: true; value: string | number | boolean }
    | { success: false; error: string }

export function convertFieldValue(
    value: unknown,
    fromType: FieldType,
    toType: FieldType
): ConversionResult {
    // unchanged field types
    if (fromType === toType) {
        const isValid =
            (fromType === 'text' && typeof value === 'string') ||
            (fromType === 'number' && typeof value === 'number' && Number.isFinite(value)) ||
            (fromType === 'boolean' && typeof value === 'boolean') ||
            (fromType === 'date' && typeof value === 'string')
        
        if (isValid) {
            return {
                success: true,
                value
            }
        }

        return {
            success: false,
            error: 'Value does not match field type'
        }
    }

    // text to number
    if (fromType === 'text' && toType === 'number') {
        if (typeof value !== 'string' || value.trim() === '') {
            return {
                success: false,
                error: 'Cannot convert value to number'
            }
        }

        const converted = Number(value)

        if (Number.isFinite(converted)) {
            return {
                success: true,
                value: converted
            }
        }

        return {
            success: false,
            error: 'Cannot convert value to number'
        }
    }

    // number to text
    if (fromType === 'number' && toType === 'text') {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return {
                success: false,
                error: 'Cannot convert value to text'
            }
        }

        const converted = String(value)

        return {
            success: true,
            value: converted
        }
    }

    return {
        success: false,
        error: `Conversion from ${fromType} to ${toType} is not supported`
    }
}

// console.log(convertFieldValue('25', 'text', 'number'))
// console.log(convertFieldValue('3.14', 'text', 'number'))
// console.log(convertFieldValue('hello', 'text', 'number'))
// console.log(convertFieldValue('', 'text', 'number'))
// console.log(convertFieldValue('   ', 'text', 'number'))

// console.log(convertFieldValue(25, 'number', 'number'))
// console.log(convertFieldValue("3.14", 'text', 'text'))
// console.log(convertFieldValue(true, 'boolean', 'boolean'))
// console.log(convertFieldValue('2005-04-05', 'date', 'date'))