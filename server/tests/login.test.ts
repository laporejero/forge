import request from 'supertest'
import bcrypt from 'bcrypt'
import { beforeAll, beforeEach, afterAll, describe, test, expect } from 'vitest'

import app from '../app'
import { User, Session } from '../models'
import { connectToDatabase, sequelize } from '../util/db'

const api = request(app)

beforeAll(async () => {
    await connectToDatabase()
})

beforeEach(async () => {
    await Session.destroy({
        where: {}
    })

    await User.destroy({
        where: {}
    })

    const passwordHash = await bcrypt.hash('password123', 10)

    await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash
    })
})

afterAll(async () => {
    await sequelize.close()
})

describe('POST /api/login', () => {
    test('logs in with valid credentials', async () => {
        const credentials = {
            email: 'test@example.com',
            password: 'password123'
        }

        const response = await api
            .post('/api/login')
            .send(credentials)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        expect(response.body.token).toBeDefined()
        expect(response.body.email).toBe('test@example.com')
        expect(response.body.name).toBe('Test User')
    })
})