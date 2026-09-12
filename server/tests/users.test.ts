import request from 'supertest'
import { beforeEach, describe, test, expect, beforeAll, afterAll } from 'vitest'

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
})

afterAll(async () => {
    await sequelize.close()
})

describe('POST /api/users', () => {
    test('creates a new user with valid data', async () => {
        const newUser = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
        }

        const response = await api
            .post('/api/users')
            .send(newUser)
            .expect(201)
            .expect('Content-Type', /application\/json/)
        
        expect(response.body.name).toBe(newUser.name)
        expect(response.body.email).toBe(newUser.email)
        expect(response.body.passwordHash).toBeUndefined()
    })
    test('fails with 409 if email already exists', async () => {
        const user = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
        }

        await api
            .post('/api/users')
            .send(user)
            .expect(201)

        const response = await api
            .post('/api/users')
            .send(user)
            .expect(409)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe(
            'An account with this email already exists'
        )
    })
    test('fails with 400 if email is invalid', async () => {
        const user = {
            name: 'Test User',
            email: 'not-an-email',
            password: 'password123'
        }

        const response = await api
            .post('/api/users')
            .send(user)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe(
            'Must be a valid email address'
        )
    })
    test('fails with 400 if email is missing', async () => {
        const response = await api
            .post('/api/users')
            .send({
                name: 'Test User',
                password: 'password123'
            })
            .expect(400)

        expect(response.body.error).toBe('Email is required')
    })
    test('fails with 400 if email is empty', async () => {
        const user = {
            name: 'Test User',
            email: '',
            password: 'password123'
        }

        const response = await api
            .post('/api/users')
            .send(user)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe(
            'Email is required'
        )
    })
    test('fails with 400 if email is invalid type', async () => {
        const response = await api
            .post('/api/users')
            .send({
                name: 'Test User',
                email: 123,
                password: 'password123'
            })
            .expect(400)

        expect(response.body.error).toBe('Invalid email')
    })
    test('fails with 400 if email contains only whitespace', async () => {
        const response = await api
            .post('/api/users')
            .send({
                name: 'Test User',
                email: '   ',
                password: 'password123'
            })
            .expect(400)

        expect(response.body.error).toBe('Email is required')
    })
    test('fails with 400 if name is empty', async () => {
        const user = {
            name: '',
            email: 'test@example.com',
            password: 'password123'
        }

        const response = await api
            .post('/api/users')
            .send(user)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe(
            'Name is required'
        )
    })
    test('fails with 400 if name contains only 1 character', async () => {
        const user = {
            name: 'U',
            email: 'test@example.com',
            password: 'password123'
        }

        const response = await api
            .post('/api/users')
            .send(user)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe(
            'Name must be between 2 and 30 characters'
        )
    })
    test('fails with 400 if name is longer than 30 characters', async () => {
        const response = await api
            .post('/api/users')
            .send({
                name: 'A'.repeat(31),
                email: 'test@example.com',
                password: 'password123'
            })
            .expect(400)

        expect(response.body.error).toBe(
            'Name must be between 2 and 30 characters'
        )
    })
    test('fails with 400 if name is missing', async () => {
        const response = await api
            .post('/api/users')
            .send({
                email: 'test@example.com',
                password: 'password123'
            })
            .expect(400)

        expect(response.body.error).toBe('Name is required')
    })
    test('fails with 400 if name is invalid type', async () => {
        const response = await api
            .post('/api/users')
            .send({
                name: 123,
                email: 'test@example.com',
                password: 'password123'
            })
            .expect(400)

        expect(response.body.error).toBe('Invalid name')
    })
    test('fails with 400 if name contains only whitespace', async () => {
        const response = await api
            .post('/api/users')
            .send({
                name: '   ',
                email: 'test@example.com',
                password: 'password123'
            })
            .expect(400)

        expect(response.body.error).toBe('Name is required')
    })
    test('fails with 400 if password is too short', async () => {
        const user = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'short'
        }

        const response = await api
            .post('/api/users')
            .send(user)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe(
            'Password must be at least 8 characters'
        )
    })
    test('fails with 400 if password is missing', async () => {
        const response = await api
            .post('/api/users')
            .send({
                name: 'Test User',
                email: 'test@example.com'
            })
            .expect(400)

        expect(response.body.error).toBe('Password is required')
    })
    test('fails with 400 if password is invalid type', async () => {
        const response = await api
            .post('/api/users')
            .send({
                name: 'Test User',
                email: 'test@example.com',
                password: 123
            })
            .expect(400)

        expect(response.body.error).toBe('Invalid password')
    })
    test('fails with 400 if password is empty', async () => {
        const response = await api
            .post('/api/users')
            .send({
                name: 'Test User',
                email: 'test@example.com',
                password: ''
            })
            .expect(400)

        expect(response.body.error).toBe('Password is required')
    })
    test('trims name and email', async () => {
        const newUser = {
            name: '  Test User  ',
            email: '  TEST@EXAMPLE.COM  ',
            password: 'password123'
        }

        const response = await api
            .post('/api/users')
            .send(newUser)
            .expect(201)

        expect(response.body.name).toBe('Test User')
        expect(response.body.email).toBe('test@example.com')
    })
})