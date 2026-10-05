import Database from '../models/database'

export interface DecodedToken {
    id: number
}

declare global {
    namespace Express {
        interface Request {
            decodedToken?: DecodedToken
            database?: Database
        }
    }
}

export {}