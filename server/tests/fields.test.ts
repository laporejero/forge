import request from 'supertest'
import { beforeEach, describe, test, expect, beforeAll, afterAll } from 'vitest'
import bcrypt from 'bcrypt'

import app from '../app'
import { User, Database } from '../models'
import { connectToDatabase, sequelize } from '../util/db'
import { clearTestDatabase } from './testHelpers'

const api = request(app)

let token: string
let testDatabase: Database

beforeAll(async () => {
    await connectToDatabase()
})

beforeEach(async () => {
    // Clean test database
    await clearTestDatabase()

    // Create test user
    const passwordHash = await bcrypt.hash('password123', 10)

    const testUser = await User.create({
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

    testDatabase = await Database.create({
        name: 'Students',
        userId: testUser.id
    })
})

afterAll(async () => {
    await sequelize.close()
})

describe('POST /api/databases/:databaseId/fields', () => {
    test('creates a valid new field', async () => {
        const newField = {
            name: 'Name',
            type: 'text',
            required: true
        }

        const response = await api
            .post(`/api/databases/${testDatabase.id}/fields`)
            .set('Authorization', `Bearer ${token}`)
            .send(newField)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        expect(response.body.name).toBe('Name')
        expect(response.body.type).toBe('text')
        expect(response.body.required).toBe(true)
        expect(response.body.databaseId).toBe(testDatabase.id)
    })
    test('required defaults to false when omitted', async () => {
        const newField = {
            name: 'Name',
            type: 'text',
        }

        const response = await api
            .post(`/api/databases/${testDatabase.id}/fields`)
            .set('Authorization', `Bearer ${token}`)
            .send(newField)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        expect(response.body.name).toBe('Name')
        expect(response.body.type).toBe('text')
        expect(response.body.required).toBe(false)
        expect(response.body.databaseId).toBe(testDatabase.id)
    })
    test('fails with 401 if user is without authentication', async () => {
        const newField = {
            name: 'Name',
            type: 'text',
            required: true
        }

        const response = await api
            .post(`/api/databases/${testDatabase.id}/fields`)
            .send(newField)
            .expect(401)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe('token missing')
    })
    test('fails with 400 if database ID is invalid', async () => {
        const newField = {
            name: 'Name',
            type: 'text',
            required: true
        }

        const response = await api
            .post(`/api/databases/students/fields`)
            .set('Authorization', `Bearer ${token}`)
            .send(newField)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe('Invalid database ID')
    })
    test('fails with 404 if database does not exist', async () => {
        const newField = {
            name: 'Name',
            type: 'text',
            required: true
        }

        const response = await api
            .post(`/api/databases/${testDatabase.id + 10}/fields`)
            .set('Authorization', `Bearer ${token}`)
            .send(newField)
            .expect(404)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe('Database not found')
    })
    test('fails with 404 if another user tries to add a field to another user\'s database', 
        async () => {
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

        const newField = {
            name: 'Name',
            type: 'text',
            required: true
        }

        const response = await api
            .post(`/api/databases/${testDatabase.id}/fields`)
            .set('Authorization', `Bearer ${loginResponse.body.token}`)
            .send(newField)
            .expect(404)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe('Database not found')
    })
    test('fails with 400 if field name is invalid', async () => {
        const newField = {
            name: 123,
            type: 'text',
            required: true
        }

        const response = await api
            .post(`/api/databases/${testDatabase.id}/fields`)
            .set('Authorization', `Bearer ${token}`)
            .send(newField)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe('Invalid field name')
    })
    test('fails with 400 if field type is invalid', async () => {
        const newField = {
            name: 'Name',
            type: 'string',
            required: true
        }

        const response = await api
            .post(`/api/databases/${testDatabase.id}/fields`)
            .set('Authorization', `Bearer ${token}`)
            .send(newField)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe('Field type must be text, number, boolean, or date')
    })
    test('fails with 400 if field required is not boolean', async () => {
        const newField = {
            name: 'Name',
            type: 'text',
            required: 'true'
        }

        const response = await api
            .post(`/api/databases/${testDatabase.id}/fields`)
            .set('Authorization', `Bearer ${token}`)
            .send(newField)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe('Required must be either true or false')
    })
    test('fails with 409 if field name already exists in the database', async () => {
        const newField = {
            name: 'Name',
            type: 'text',
            required: true
        }

        await api
            .post(`/api/databases/${testDatabase.id}/fields`)
            .set('Authorization', `Bearer ${token}`)
            .send(newField)

        const response = await api
            .post(`/api/databases/${testDatabase.id}/fields`)
            .set('Authorization', `Bearer ${token}`)
            .send(newField)
            .expect(409)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe('A field with this name already exists')
    })
    test('same field name is allowed in different databases', async () => {
        const secondDatabase = await Database.create({
            name: 'Teachers',
            userId: testDatabase.userId
        })

        const newField = {
            name: 'Name',
            type: 'text',
            required: true
        }

        await api
            .post(`/api/databases/${testDatabase.id}/fields`)
            .set('Authorization', `Bearer ${token}`)
            .send(newField)
            .expect(201)

        await api
            .post(`/api/databases/${secondDatabase.id}/fields`)
            .set('Authorization', `Bearer ${token}`)
            .send(newField)
            .expect(201)
    })
})