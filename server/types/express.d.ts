import Database from '../models/database'
import Record from '../models/record'

export interface DecodedToken {
    id: number
}

declare global {
    namespace Express {
        interface Request {
            decodedToken?: DecodedToken
            database?: Database
            record?: Record
        }
    }
}

export {}