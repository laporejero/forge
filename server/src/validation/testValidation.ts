import { Field, FieldType } from '../../types/types' 

const fields: Field[] = [
  { name: 'Name', type: 'string' },
  { name: 'Age', type: 'number' },
  { name: 'Active', type: 'boolean' }
]

const data = {
  Name: 'John',
  Age: 28,
  Active: true,
}

const validator = (fields: Field[], data: object) => {
    const dataKeys = Object.keys(data)
    const fieldKeys = fields.map(field => field.name)

    const isValid = dataKeys.every(key => fieldKeys.includes(key))

    const matchingFields = dataKeys.map(key =>
        fields.find(field => field.name === key)
    )

    const typesAreValid = dataKeys.every(key => {
        const field = fields.find(field => field.name === key)
        const value = data[key as keyof typeof data]

        return typeof value === field?.type
    })

    return isValid && typesAreValid
}

console.log(validator(fields, data))