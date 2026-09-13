import request from 'supertest'
import { beforeEach, describe, test, expect, beforeAll, afterAll } from 'vitest'
import bcrypt from 'bcrypt'

import app from '../app'
import { User, Database, Session } from '../models'
import { connectToDatabase, sequelize } from '../util/db'

const api = request(app)

let token: string

beforeAll(async () => {
    await connectToDatabase()
})

beforeEach(async () => {
    // Clean test database
    await Session.destroy({ where: {} })
    await Database.destroy({ where: {} })
    await User.destroy({ where: {} })

    // Create test user
    const passwordHash = await bcrypt.hash('password123', 10)

    await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash
    })

    // Log in test user and save token
    const loginResponse = await api
        .post('/api/login')
        .send({
            email: 'test@example.com',
            password: 'password123'
        })
    
    token = loginResponse.body.token
})

afterAll(async () => {
    await sequelize.close()
})

describe('POST /api/databases', () => {
    test('creates a database for an authenticated user', async () => {
        const response = await api
            .post('/api/databases')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'My Database' })
            .expect(201)
            .expect('Content-Type', /application\/json/)

        expect(response.body.name).toBe('My Database')
    })
    test('fails with 401 if user is not authenticated', async () => {
        const response = await api
            .post('/api/databases')
            .send({ name: 'My Database' })
            .expect(401)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe('token missing')
    })
    test('fails with 400 if name if missing', async () => {
        const response = await api
            .post('/api/databases')
            .set('Authorization', `Bearer ${token}`)
            .send({})
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe('Database name is required')
    })
    test('fails with 400 if name if empty', async () => {
        const response = await api
            .post('/api/databases')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: '' })
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe('Database name is required')
    })
    test('fails with 400 if name contains whitespace only', async () => {
        const response = await api
            .post('/api/databases')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: '  ' })
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe('Database name is required')
    })
    test('fails with 400 if name is invalid type', async () => {
        const response = await api
            .post('/api/databases')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 123 })
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe('Invalid database name')
    })
    test('fails with 400 if name is longer than 30 characters', async () => {
        const response = await api
            .post('/api/databases')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'A'.repeat(31) })
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe('Database name must be 30 characters or less')
    })
    test('trim database name before saving', async () => {
        const response = await api
            .post('/api/databases')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: '  My Database  ' })
            .expect(201)
            .expect('Content-Type', /application\/json/)

        expect(response.body.name).toBe('My Database')
    })
    test('fails with 409 if name already exists', async () => {
        await api
            .post('/api/databases')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'My Database' })
        
        const response = await api
            .post('/api/databases')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'My Database' })
            .expect(409)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe('A database with this name already exists')
    })
    test('same database name can exist for different users', async () => {
        await api
            .post('/api/databases')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'My Database' })
            .expect(201)
        
        await User.create({
            name: 'Test User 2',
            email: 'test2@example.com',
            passwordHash: await bcrypt.hash('password456', 10)
        })
        
        // Log in 2nd user
        const loginResponse = await api
            .post('/api/login')
            .send({
                email: 'test2@example.com',
                password: 'password456'
            })

        const response = await api
            .post('/api/databases')
            .set('Authorization', `Bearer ${loginResponse.body.token}`)
            .send({ name: 'My Database' })
            .expect(201)
            .expect('Content-Type', /application\/json/)

        expect(response.body.name).toBe('My Database')

        const databases = await Database.findAll({ 
            where: { name: 'My Database' } 
        })

        expect(databases).toHaveLength(2)
    })
})