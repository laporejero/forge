import Database from '../models/database'
import Record from '../models/record'
import Field from '../models/field'

export interface DecodedToken {
    id: number
}

declare global {
    namespace Express {
        interface Request {
            decodedToken?: DecodedToken
            database?: Database
            record?: Record
            field?: Field
        }
    }
}

export {}