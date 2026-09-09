import dotenv from 'dotenv'

dotenv.config()

export const DATABASE_URL = process.env.DATABASE_URL
export const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL
export const PORT = process.env.PORT || 3001
const secret = process.env.SECRET

if (!secret) {
    throw new Error('SECRET is not defined')
}

export const SECRET = secret