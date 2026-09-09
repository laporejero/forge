import jwt from 'jsonwebtoken'

export interface DecodedToken {
    id: number
}

declare global {
    namespace Express {
        interface Request {
            decodedToken?: DecodedToken
        }
    }
}

export {}