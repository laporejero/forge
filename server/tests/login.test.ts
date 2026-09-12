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
    test('successful login creates a session', async () => {
        const credentials = {
            email: 'test@example.com',
            password: 'password123'
        }

        await api
            .post('/api/login')
            .send(credentials)
            .expect(200)

        const sessions = await Session.findAll()

        expect(sessions).toHaveLength(1)
        expect(sessions[0].token).toBeDefined()
    })
    test('successful login does not return passwordHash', async () => {
        const credentials = {
            email: 'test@example.com',
            password: 'password123'
        }

        const response = await api
            .post('/api/login')
            .send(credentials)
            .expect(200)

        expect(response.body.passwordHash).toBeUndefined()
    })
    test('fails with 401 if password is incorrect', async () => {
        const credentials = {
            email: 'test@example.com',
            password: 'wrongpassword'
        }

        const response = await api
            .post('/api/login')
            .send(credentials)
            .expect(401)
            .expect('Content-Type', /application\/json/)
        
        expect(response.body.error).toBe(
            'Invalid email or password'
        )
    })
    test('fails with 401 if user does not exist', async () => {
        const credentials = {
            email: 'missing@example.com',
            password: 'password123'
        }

        const response = await api
            .post('/api/login')
            .send(credentials)
            .expect(401)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe(
            'Invalid email or password'
        )
    })
    test('fails with 400 if email is missing', async () => {
        const credentials = {
            password: 'password123'
        }

        const response = await api
            .post('/api/login')
            .send(credentials)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe(
            'Email is required'
        )
    })
    test('fails with 400 if email is empty', async () => {
        const credentials = {
            email: '',
            password: 'password123'
        }

        const response = await api
            .post('/api/login')
            .send(credentials)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe(
            'Email is required'
        )
    })
    test('fails with 400 if email contains only whitespace', async () => {
        const credentials = {
            email: '     ',
            password: 'password123'
        }

        const response = await api
            .post('/api/login')
            .send(credentials)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe(
            'Email is required'
        )
    })
    test('fails with 400 if email is invalid type', async () => {
        const credentials = {
            email: 12345,
            password: 'password123'
        }

        const response = await api
            .post('/api/login')
            .send(credentials)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe(
            'Invalid email'
        )
    })
    test('fails with 400 if email is invalid format', async () => {
        const credentials = {
            email: 'not-an-email',
            password: 'password123'
        }

        const response = await api
            .post('/api/login')
            .send(credentials)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe(
            'Must be a valid email address'
        )
    })
    test('fails with 400 if password is missing', async () => {
        const credentials = {
            email: 'test@example.com',
        }

        const response = await api
            .post('/api/login')
            .send(credentials)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe(
            'Password is required'
        )
    })
    test('fails with 400 if password is empty', async () => {
        const credentials = {
            email: 'test@example.com',
            password: ''
        }

        const response = await api
            .post('/api/login')
            .send(credentials)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe(
            'Password is required'
        )
    })
    test('fails with 400 if password is invalid type', async () => {
        const credentials = {
            email: 'test@example.com',
            password: 12345678
        }

        const response = await api
            .post('/api/login')
            .send(credentials)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe(
            'Invalid password'
        )
    })
    test('trim and lowercases email', async () => {
        const credentials = {
            email: ' TEST@EXAMPLE.COM ',
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