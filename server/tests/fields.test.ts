import request from 'supertest'
import { beforeEach, describe, test, expect, beforeAll, afterAll } from 'vitest'
import bcrypt from 'bcrypt'

import app from '../app'
import { User, Database, Field } from '../models'
import { connectToDatabase, sequelize } from '../util/db'
import { clearTestDatabase, deleteField, getFieldById, getFields, postField, updateFieldById } from './testHelpers'

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

        expect(response.body.error).toBe('Authentication required')
    })
    test('fails with 401 if user has invalid token', async () => {
        const newField = {
            name: 'Name',
            type: 'text',
            required: true
        }

        const response = await api
            .post(`/api/databases/${testDatabase.id}/fields`)
            .set('Authorization', `Bearer invalid-token`)
            .send(newField)
            .expect(401)
            .expect('Content-Type', /application\/json/)

        expect(response.body.error).toBe('Invalid token')
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
        
        const firstResponse = await postField(testDatabase.id, token, newField)
        const secondResponse =  await postField(secondDatabase.id, token, newField)

        expect(firstResponse.status).toBe(201)
        expect(secondResponse.status).toBe(201)

        expect(firstResponse.body.name).toBe('Name')
        expect(secondResponse.body.name).toBe('Name')

        expect(firstResponse.body.databaseId).toBe(testDatabase.id)
        expect(secondResponse.body.databaseId).toBe(secondDatabase.id)

        expect(firstResponse.body.id).not.toBe(secondResponse.body.id)
    })
})
describe('GET /api/databases/:databaseId/fields', () => {
    describe('when database has fields', () => {
        beforeEach(async () => {
            const firstField = {
                name: 'Name',
                type: 'text',
                required: true
            }

            const secondField = {
                name: 'Age',
                type: 'number',
                required: true
            }

            const thirdField = {
                name: 'Course',
                type: 'text',
                required: true
            }

            await postField(testDatabase.id, token, firstField)
            await postField(testDatabase.id, token, secondField)
            await postField(testDatabase.id, token, thirdField)
        })
        test('returns all fields belonging to the database', async () => {
            const response = await getFields(testDatabase.id, token)

            expect(response.status).toBe(200)
            expect(response.headers['content-type']).toMatch(/application\/json/)
            expect(response.body).toHaveLength(3)

            expect(response.body).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ name: 'Name' }),
                    expect.objectContaining({ name: 'Age' }),
                    expect.objectContaining({ name: 'Course' })
                ])
            )
        })
        test('returns fields in creation order, oldest first', async () => {
            const response = await getFields(testDatabase.id, token)

            expect(response.status).toBe(200)
            expect(response.headers['content-type']).toMatch(/application\/json/)
            expect(response.body).toHaveLength(3)

            expect(response.body.map((field: { name: string }) => field.name)).toEqual([
                'Name',
                'Age',
                'Course'
            ])
        })
        test('does not return fields belonging to another database', async () => {
            const secondDatabase = await Database.create({
                name: 'Teachers',
                userId: testDatabase.userId
            })

            await postField(secondDatabase.id, token, {
                name: 'Salary',
                type: 'number',
                required: true
            })
            
            const response = await getFields(testDatabase.id, token)

            expect(response.status).toBe(200)
            expect(response.headers['content-type']).toMatch(/application\/json/)
            expect(response.body).toHaveLength(3)

            expect(response.body.map((field: { name: string }) => field.name)).toEqual([
                'Name',
                'Age',
                'Course'
            ])

            expect(response.body.map((field: { name: string }) => field.name)).not.toContain('Salary')
        })
    })
    describe('when database has no fields', () => {
        test('returns []', async () => {
            const response = await api
                .get(`/api/databases/${testDatabase.id}/fields`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200)

            expect(response.body).toEqual([])
        })
    })
    describe('when database is invalid or inaccessible', () => {
        test('fails with 401 if user is without authentication', async () => {
            const response = await api
                .get(`/api/databases/${testDatabase.id}/fields`)
                .expect(401)

            expect(response.body.error).toBe('Authentication required')
        })
        test('fails with 401 if user has invalid token', async () => {
            const response = await getFields(testDatabase.id, 'Bearer invalid-token')

            expect(response.status).toBe(401)
            expect(response.body.error).toBe('Invalid token')
        })
        test('fails with 400 if database ID is invalid', async () => {
            const response = await api
                .get(`/api/databases/abc/fields`)
                .set('Authorization', `Bearer ${token}`)
                .expect(400)

            expect(response.body.error).toBe('Invalid database ID')
        })
        test('fails with 404 if database does not exist', async () => {
            const response = await getFields(testDatabase.id + 10, token)

            expect(response.status).toBe(404)
            expect(response.body.error).toBe('Database not found')
        })
        test('fails with 404 if database belongs to another user', async () => {
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

            const response = await getFields(testDatabase.id, loginResponse.body.token)

            expect(response.status).toBe(404)
            expect(response.body.error).toBe('Database not found')
        })
    })
})
describe('GET /api/databases/:databaseId/fields/:fieldId', () => {
    let testFieldId: number

    beforeEach(async () => {
        const newField = {
            name: 'Name',
            type: 'text',
            required: true
        }
        
        const addedField = await postField(testDatabase.id, token, newField)
        testFieldId = addedField.body.id
    })
    describe('when request is valid', () => {
        test('returns the requested field', async () => {
            const response = await getFieldById(testDatabase.id, testFieldId, token)

            expect(response.status).toBe(200)
            expect(response.headers['content-type']).toMatch(/application\/json/)
            expect(response.body.name).toBe('Name')
        })
    })
    describe('when authentication is invalid', () => {
        test('fails with 401 if user is without authentication', async () => {
            const response = await api
                .get(`/api/databases/${testDatabase.id}/fields/${testFieldId}`)
                .expect(401)

            expect(response.body.error).toBe('Authentication required')
        })
        test('fails with 401 if user has invalid token', async () => {
            const response = await getFieldById(testDatabase.id, testFieldId, 'Bearer invalid-token')

            expect(response.body.error).toBe('Invalid token')
        })
    })
    describe('when databaseId or fieldId is invalid', () => {
        test('fails with 400 if database ID invalid', async () => {
            const response = await api
                .get(`/api/databases/databaseId/fields/${testFieldId}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(400)

            expect(response.body.error).toBe('Invalid database ID')
        })
        test('fails with 400 if field ID is invalid', async () => {
            const response = await api
                .get(`/api/databases/${testDatabase.id}/fields/id`)
                .set('Authorization', `Bearer ${token}`)
                .expect(400)

            expect(response.body.error).toBe('Invalid field ID')
        })
    })
    describe('when the requested resources are not found', () => {
        test('fails with 404 if database does not exist', async () => {
            const response = await getFieldById(testDatabase.id + 10, testFieldId, token)

            expect(response.body.error).toBe('Database not found')
        })
        test('fails with 404 when the database belongs to another user', async () => {
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

            const response = await getFieldById(testDatabase.id, testFieldId, loginResponse.body.token,)

            expect(response.status).toBe(404)
            expect(response.body.error).toBe('Database not found')
        })
        test('fails 404 for nonexistent field', async () => {
            const response = await getFieldById(testDatabase.id, testFieldId + 10, token)

            expect(response.body.error).toBe('Field not found')
        })
        test('fails with 404 when the field belongs to a different database', async () => {
            const secondDatabase = await Database.create({
                name: 'Teachers',
                userId: testDatabase.userId
            })

            const field = await postField(secondDatabase.id, token, {
                name: 'Salary',
                type: 'number',
                required: true
            })
            
            const response = await getFieldById(testDatabase.id, field.body.id, token)
            
            expect(response.status).toBe(404)
            expect(response.body.error).toBe('Field not found')
        })
    })
})
describe('PUT /api/databases/:databaseId/fields/:fieldId', () => {
    describe('when database has a field', () => {
        let fieldId: number

        beforeEach(async () => {
            const field = await Field.create({
                name: 'Name',
                type: 'text',
                required: true,
                databaseId: testDatabase.id
            })

            fieldId = field.id
        })
        test('successfully updates name, type, and required', async () => {
            const updatedField = {
                name: 'Age',
                type: 'number',
                required: false,
            }

            const response = await updateFieldById(testDatabase.id, fieldId, token, updatedField)

            expect(response.status).toBe(200)
            expect(response.body.name).toBe('Age')
            expect(response.body.type).toBe('number')
            expect(response.body.required).toBe(false)
            expect(response.body.id).toBe(fieldId)
        })
        test('allows keeping the field\'s current name', async () => {
            const updatedField = {
                name: 'Name',
                type: 'text',
                required: false
            }

            const response = await updateFieldById(testDatabase.id, fieldId, token, updatedField)
            
            expect(response.status).toBe(200)
            expect(response.body.name).toBe('Name')
            expect(response.body.type).toBe('text')
            expect(response.body.required).toBe(false)
            expect(response.body.id).toBe(fieldId)
        })
        test('fails with 409 if user renames to another field\'s name within the same database', async () => {
            const newField = await Field.create({
                name: 'Age',
                type: 'number',
                required: true,
                databaseId: testDatabase.id
            })

            const updatedField = {
                name: 'Name',
                type: 'text',
                required: true
            }

            const response = await updateFieldById(testDatabase.id, newField.id, token, updatedField)

            expect(response.status).toBe(409)
            expect(response.body.error).toBe('A field with this name already exists')
        })
        test('allows the same field name if it exists in a different database', async () => {
            const secondDatabase = await Database.create({
                name: 'Teachers',
                userId: testDatabase.userId
            })

            await Field.create({
                name: 'Email',
                type: 'text',
                required: false,
                databaseId: secondDatabase.id
            })

            const field = await Field.create({
                name: 'Age',
                type: 'number',
                required: false,
                databaseId: testDatabase.id
            })

            const updatedField = {
                name: 'Email',
                type: 'text',
                required: true
            }

            const response = await updateFieldById(testDatabase.id, field.id, token, updatedField)

            expect(response.status).toBe(200)
            expect(response.body.name).toBe('Email')
            expect(response.body.required).toBe(true)
        })
        describe('when authentication is invalid', () => {
            test('fails with 401 if user is without authentication', async () => {
                const updatedField = {
                    name: 'Name',
                    type: 'text',
                    required: false
                }

                const response = await api
                    .put(`/api/databases/${testDatabase.id}/fields/${fieldId}`)
                    .send(updatedField)
                    .expect(401)

                expect(response.body.error).toBe('Authentication required')
            })
            test('fails with 401 if user\'s token is invalid', async () => {
                const updatedField = {
                    name: 'Name',
                    type: 'text',
                    required: false
                }

                const response = await updateFieldById(testDatabase.id, fieldId, 'Bearer invalid-token', updatedField)

                expect(response.status).toBe(401)
                expect(response.body.error).toBe('Invalid token')
            })
        })
        describe('when databaseId or fieldId is invalid', () => {
            test('fails with 400 if database ID is invalid', async () => {
                const updatedField = {
                    name: 'Name',
                    type: 'text',
                    required: false
                }

                const response = await api
                    .put(`/api/databases/id/fields/${fieldId}`)
                    .set('Authorization', `Bearer ${token}`)
                    .send(updatedField)
                    .expect(400)

                expect(response.body.error).toBe('Invalid database ID')
            })
            test('fails with 400 if field ID is invalid', async () => {
                const updatedField = {
                    name: 'Name',
                    type: 'text',
                    required: false
                }

                const response = await api
                    .put(`/api/databases/${testDatabase.id}/fields/id`)
                    .set('Authorization', `Bearer ${token}`)
                    .send(updatedField)
                    .expect(400)

                expect(response.body.error).toBe('Invalid field ID')
            })
        })
        describe('when user inputs an invalid body', () => {
            test('fails with 400 if name is empty', async () => {
                const updatedField = {
                    name: '',
                    type: 'text',
                    required: false
                }

                const response = await updateFieldById(testDatabase.id, fieldId, token, updatedField)

                expect(response.status).toBe(400)
                expect(response.body.error).toBe('Field name is required')
            })
            test('fails with 400 if name is invalid', async () => {
                const updatedField = {
                    name: 123,
                    type: 'text',
                    required: false
                }

                const response = await updateFieldById(testDatabase.id, fieldId, token, updatedField)

                expect(response.status).toBe(400)
                expect(response.body.error).toBe('Invalid field name')
            })
            test('fails with 400 if user inputs an unsupported field type', async () => {
                const updatedField = {
                    name: 'Age',
                    type: 'string',
                    required: true
                }

                const response = await updateFieldById(testDatabase.id, fieldId, token, updatedField)

                expect(response.status).toBe(400)
                expect(response.body.error).toBe('Field type must be text, number, boolean, or date')
            })
            test('fails with 400 if user inputs non-boolean in required', async () => {
                const updatedField = {
                    name: 'Age',
                    type: 'number',
                    required: 'true'
                }

                const response = await updateFieldById(testDatabase.id, fieldId, token, updatedField)

                expect(response.status).toBe(400)
                expect(response.body.error).toBe('Required must be either true or false')
            })
        })
        describe('when the requested resources are not found', () => {
            test('fails with 404 if database does not exist', async () => {
                const updatedField = {
                    name: 'Age',
                    type: 'number',
                    required: true
                }

                const response = await updateFieldById(testDatabase.id + 99, fieldId, token, updatedField)

                expect(response.status).toBe(404)
                expect(response.body.error).toBe('Database not found')
            })
            test('fails with 404 when database belongs to another user', async () => {
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

                const updatedField = {
                    name: 'Age',
                    type: 'number',
                    required: true
                }

                const response = await updateFieldById(testDatabase.id, fieldId, loginResponse.body.token, updatedField)

                expect(response.status).toBe(404)
                expect(response.body.error).toBe('Database not found')
            })
            test('fails with 404 if field does not exist', async () => {
                const updatedField = {
                    name: 'Age',
                    type: 'number',
                    required: true
                }

                const response = await updateFieldById(testDatabase.id, fieldId + 99, token, updatedField)

                expect(response.status).toBe(404)
                expect(response.body.error).toBe('Field not found')
            })
            test('fails with 404 when field exists but belongs to a different database', async () => {
                const secondDatabase = await Database.create({
                    name: 'Teachers',
                    userId: testDatabase.userId
                })

                const field = await Field.create({
                    name: 'Subject',
                    type: 'text',
                    required: false,
                    databaseId: secondDatabase.id
                })

                const updatedField = {
                    name: 'Age',
                    type: 'number',
                    required: true
                }

                const response = await updateFieldById(testDatabase.id, field.id, token, updatedField)

                expect(response.status).toBe(404)
                expect(response.body.error).toBe('Field not found')
            })
        })
    })
})
describe('DELETE /api/databases/:databaseId/fields/:fieldId', () => {
    let fieldId: number

    beforeEach(async () => {
        const field = await Field.create({
            name: 'Name',
            type: 'text',
            required: true,
            databaseId: testDatabase.id
        })

        fieldId = field.id
    })
    test('successfully deletes an existing field', async () => {
        const response = await deleteField(testDatabase.id, fieldId, token)

        expect(response.status).toBe(204)

        const field = await Field.findByPk(fieldId)
        expect(field).toBeNull()
    })
    test('fails with 401 if user is without authentication', async () => {
        const response = await api
            .delete(`/api/databases/${testDatabase.id}/fields/${fieldId}`)

        expect(response.status).toBe(401)
        expect(response.body.error).toBe('Authentication required')
    })
    test('fails with 400 if database ID is invalid', async () => {
        const response = await api
            .delete(`/api/databases/id/fields/${fieldId}`)
            .set('Authorization', `Bearer ${token}`)

        expect(response.status).toBe(400)
        expect(response.body.error).toBe('Invalid database ID')
    })
    test('fails with 400 if field ID is invalid', async () => {
        const response = await api
            .delete(`/api/databases/${testDatabase.id}/fields/id`)
            .set('Authorization', `Bearer ${token}`)

        expect(response.status).toBe(400)
        expect(response.body.error).toBe('Invalid field ID')
    })
    test('fails with 404 if database does not exist', async () => {
        const response = await deleteField(testDatabase.id + 99, fieldId, token)

        expect(response.status).toBe(404)
        expect(response.body.error).toBe('Database not found')
    })
    test('fails with 404 if field does not exist', async () => {
        const response = await deleteField(testDatabase.id, fieldId + 99, token)

        expect(response.status).toBe(404)
        expect(response.body.error).toBe('Field not found')
    })
    test('fails with 404 when database belongs to another user', async () => {
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

        const response = await deleteField(testDatabase.id, fieldId, loginResponse.body.token)

        expect(response.status).toBe(404)
        expect(response.body.error).toBe('Database not found')
    })
    test('fails with 404 when field exists but belongs to a different database', async () => {
        const secondDatabase = await Database.create({
            name: 'Teachers',
            userId: testDatabase.userId
        })

        const field = await Field.create({
            name: 'Subject',
            type: 'text',
            required: false,
            databaseId: secondDatabase.id
        })

        const response = await deleteField(testDatabase.id, field.id, token)

        expect(response.status).toBe(404)
        expect(response.body.error).toBe('Field not found')
    })
})