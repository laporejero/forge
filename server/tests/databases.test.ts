import request from 'supertest'
import { beforeEach, describe, test, expect, beforeAll, afterAll } from 'vitest'
import bcrypt from 'bcrypt'

import app from '../app'
import { User, Database, Session } from '../models'
import { connectToDatabase, sequelize } from '../util/db'
import { postDatabase, getDatabaseById, putDatabase, deleteDatabase, clearTestDatabase } from './testHelpers'

const api = request(app)

let token: string

beforeAll(async () => {
    await connectToDatabase()
})

beforeEach(async () => {
    // Clean test database
    await clearTestDatabase()

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
        const response = await postDatabase(token, 'My Database')

        expect(response.status).toBe(201)
        expect(response.headers['content-type']).toMatch(/application\/json/)
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
        const response = await postDatabase(token, '')

        expect(response.status).toBe(400)
        expect(response.headers['content-type']).toMatch(/application\/json/)
        expect(response.body.error).toBe('Database name is required')
    })
    test('fails with 400 if name contains whitespace only', async () => {    
        const response = await postDatabase(token, '   ')
        
        expect(response.status).toBe(400)
        expect(response.headers['content-type']).toMatch(/application\/json/)
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
        const response = await postDatabase(token, 'A'.repeat(31))

        expect(response.status).toBe(400)
        expect(response.headers['content-type']).toMatch(/application\/json/)
        expect(response.body.error).toBe('Database name must be 30 characters or less')
    })
    test('trim database name before saving', async () => {
        const response = await postDatabase(token, '  My Database  ')

        expect(response.status).toBe(201)
        expect(response.headers['content-type']).toMatch(/application\/json/)
        expect(response.body.name).toBe('My Database')
    })
    test('fails with 409 if name already exists', async () => {
        await postDatabase(token, 'My Database')

        const response = await postDatabase(token, 'My Database')

        expect(response.status).toBe(409)
        expect(response.headers['content-type']).toMatch(/application\/json/)
        expect(response.body.error).toBe('A database with this name already exists')
    })
    test('same database name can exist for different users', async () => {
        await postDatabase(token, 'My Database')
        
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

        const response = await postDatabase(loginResponse.body.token, 'My Database')

        expect(response.status).toBe(201)
        expect(response.headers['content-type']).toMatch(/application\/json/)
        expect(response.body.name).toBe('My Database')

        const databases = await Database.findAll({ 
            where: { name: 'My Database' } 
        })

        expect(databases).toHaveLength(2)
    })
})
describe('GET /api/databases', () => {
    beforeEach(async () => {
        await postDatabase(token, 'My Database')
        await postDatabase(token, 'My 2nd Database')
    })

    test('authenticated user gets only their own databases', async () => {
        const response = await api
            .get('/api/databases')
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .expect('Content-Type', /application\/json/)

        expect(response.body).toHaveLength(2)

        const names = response.body.map(
            (database: { name: string }) => database.name
        )

        expect(names).toContain('My Database')
        expect(names).toContain('My 2nd Database')
    })
    test('fails with 401 if user is unauthenticated', async () => {
        const response = await api
            .get('/api/databases')
            .set('Authorization', 'Bearer not-a-valid-token')
            .expect(401)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe('token invalid')
    })
    test('fails with 401 if token is missing', async () => {
        const response = await api
            .get('/api/databases')
            .expect(401)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe('token missing')
    })
})
describe('GET /api/databases/:id', () => {
    test('owner can fetch database by ID', async () => {
        const createdDatabase = await postDatabase(token, 'My Database')

        const id = createdDatabase.body.id

        const response = await getDatabaseById(id, token)
        
        expect(response.status).toBe(200)
        expect(response.headers['content-type']).toMatch(/application\/json/)
        expect(response.body.id).toBe(id)
        expect(response.body.name).toBe('My Database')
    })
    test('fails with 400 if ID is invalid', async () => {
        await postDatabase(token, 'My Database')

        const response = await api
            .get(`/api/databases/abc`)
            .set('Authorization', `Bearer ${token}`)
            .expect(400)
            .expect('Content-Type', /application\/json/)
        
        expect(response.body.error).toBe('Invalid database ID')
    })
    test('fails with 400 if ID is 0', async () => {
        await postDatabase(token, 'My Database')

        const response = await getDatabaseById(0, token)
        
        expect(response.status).toBe(400)
        expect(response.headers['content-type']).toMatch(/application\/json/)
        expect(response.body.error).toBe('Invalid database ID')
    })
    test('fails with 400 if ID is negative', async () => {
        await postDatabase(token, 'My Database')

        const response = await getDatabaseById(-1, token)
        
        expect(response.status).toBe(400)
        expect(response.headers['content-type']).toMatch(/application\/json/)
        expect(response.body.error).toBe('Invalid database ID')
    })
    test('fails with 404 if database does not exist', async () => {
        await postDatabase(token, 'My Database')

        const response = await getDatabaseById(20, token)
        
        expect(response.status).toBe(404)
        expect(response.headers['content-type']).toMatch(/application\/json/)
        expect(response.body.error).toBe('Database not found')
    })
    test('another user cannot fetch other user\'s database', async () => {
        const createdDatabase = await postDatabase(token, 'My Database')

        const id = createdDatabase.body.id

        await User.create({
            name: 'Test User 2',
            email: 'test2@example.com',
            passwordHash: await bcrypt.hash('password456', 10)
        })
        
        const loginResponse = await api
            .post('/api/login')
            .send({
                email: 'test2@example.com',
                password: 'password456'
            })
        
        const response = await getDatabaseById(id, loginResponse.body.token)
        
        expect(response.status).toBe(404)
        expect(response.headers['content-type']).toMatch(/application\/json/)
        expect(response.body.error).toBe('Database not found')
    })
})
describe('PUT /api/databases/:id', () => {
    test('owner can update database name', async () => {
        const createdDatabase = await postDatabase(token, 'My Database')
        const id = createdDatabase.body.id

        const response = await putDatabase(id, token, 'Updated Database')

        expect(response.status).toBe(200)
        expect(response.headers['content-type']).toMatch(/application\/json/)
        expect(response.body.id).toBe(id)
        expect(response.body.name).toBe('Updated Database')
    })
    test('fails with 400 if owner updates database with an invalid name', async () => {
        const createdDatabase = await postDatabase(token, 'My Database')
        const id = createdDatabase.body.id

        const response = await api
            .put(`/api/databases/${id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 123 })
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe('Invalid database name')
    })
    test('fails with 400 if owner updates database with an empty name', async () => {
        const createdDatabase = await postDatabase(token, 'My Database')
        const id = createdDatabase.body.id

        const response = await putDatabase(id, token, '')

        expect(response.status).toBe(400)
        expect(response.headers['content-type']).toMatch(/application\/json/)
        expect(response.body.error).toBe('Database name is required')
    })
    test('fails with 400 if owner updates database name with whitespace only', async () => {
        const createdDatabase = await postDatabase(token, 'My Database')
        const id = createdDatabase.body.id

        const response = await putDatabase(id, token, '   ')

        expect(response.status).toBe(400)
        expect(response.headers['content-type']).toMatch(/application\/json/)
        expect(response.body.error).toBe('Database name is required')
    })
    test('fails with 400 if owner updates database name invalid ID', async () => {
        await postDatabase(token, 'My Database')

        const response = await api
            .put('/api/databases/abc')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Updated Database'})
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe('Invalid database ID')
    })
    test('fails with 404 if owner updates the name of a non-existent database', async () => {
        const createdDatabase = await postDatabase(token, 'My Database')
        const id = createdDatabase.body.id

        const response = await putDatabase(id + 10, token, 'Updated Database')

        expect(response.status).toBe(404)
        expect(response.headers['content-type']).toMatch(/application\/json/)
        expect(response.body.error).toBe('Database not found')
    })
    test('another user cannot update other user\'s database', async () => {
        const createdDatabase = await postDatabase(token, 'My Database')

        const id = createdDatabase.body.id

        await User.create({
            name: 'Test User 2',
            email: 'test2@example.com',
            passwordHash: await bcrypt.hash('password456', 10)
        })
        
        const loginResponse = await api
            .post('/api/login')
            .send({
                email: 'test2@example.com',
                password: 'password456'
            })

        const response = await putDatabase(id, loginResponse.body.token, 'Updated Database')
        
        expect(response.status).toBe(404)
        expect(response.headers['content-type']).toMatch(/application\/json/)
        expect(response.body.error).toBe('Database not found')
    })
    test('fails with 409 if owner updates the name of a existent database name', async () => {
        await postDatabase(token, 'Database #1')

        const createdDatabase = await postDatabase(token, 'Database #2')
        const id = createdDatabase.body.id

        const response = await putDatabase(id, token, 'Database #1')

        expect(response.status).toBe(409)
        expect(response.headers['content-type']).toMatch(/application\/json/)
        expect(response.body.error).toBe('A database with this name already exists')
    })
})
describe('DELETE /api/databases/:id', () => {
    test('owner can delete database', async () => {
        const createdDatabase = await postDatabase(token, 'My Database')
        const id = createdDatabase.body.id

        const response = await deleteDatabase(id, token)
        expect(response.status).toBe(204)

        const database = await Database.findByPk(id)
        expect(database).toBeNull()
    })
    test('fails with 400 if ID is invalid', async () => {
        await postDatabase(token, 'My Database')

        const response = await api
            .delete(`/api/databases/abc`)
            .set('Authorization', `Bearer ${token}`)
            .expect(400)

        expect(response.body.error).toBe('Invalid database ID')
    })
    test('fails with 404 if user deletes non-existent database', async () => {
        const createdDatabase = await postDatabase(token, 'My Database')
        const id = createdDatabase.body.id

        const response = await deleteDatabase(id + 10, token)

        expect(response.status).toBe(404)
        expect(response.body.error).toBe('Database not found')
    })
    test('another user cannot delete other\'s database', async () => {
        const createdDatabase = await postDatabase(token, 'My Database')
        const id = createdDatabase.body.id

        await User.create({
            name: 'Test User 2',
            email: 'test2@example.com',
            passwordHash: await bcrypt.hash('password456', 10)
        })
        
        const loginResponse = await api
            .post('/api/login')
            .send({
                email: 'test2@example.com',
                password: 'password456'
            })

        const response = await deleteDatabase(id, loginResponse.body.token)

        expect(response.status).toBe(404)
        expect(response.body.error).toBe('Database not found')
    })
})