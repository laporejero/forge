export type FieldType = 'text' | 'number' | 'boolean' | 'date'

export type ValidationResult =
  | { valid: true }
  | { valid: false; error: string }