import { describe, test, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcrypt'

import app from '../app'
import { User, Database, Field, Record } from '../models'
import { connectToDatabase, sequelize } from '../util/db'
import { clearTestDatabase, getRecordById, getRecords, postRecord, updateRecordById } from './testHelpers'

const api = request(app)

let token: string
let testDatabase: Database
let nameField: Field
let ageField: Field

beforeAll(async () => {
    await connectToDatabase()
})

beforeEach(async () => {
    await clearTestDatabase()

    const passwordHash = await bcrypt.hash('password123', 10)

    const testUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        passwordHash
    })

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

    nameField = await Field.create({
        databaseId: testDatabase.id,
        name: 'Name',
        type: 'text',
        required: true
    })

    ageField = await Field.create({
        databaseId: testDatabase.id,
        name: 'Age',
        type: 'number',
        required: false
    })
})

afterAll(async () => {
    await sequelize.close()
})

describe('POST /api/databases/:databaseId/records', () => {
    test('creates a valid record', async () => {
        const data = {
            [nameField.id]: 'Bob',
            [ageField.id]: 21
        }

        const response = await postRecord(testDatabase.id, token, data)

        expect(response.status).toBe(201)
        expect(response.body.data).toEqual(data)

        const records = await Record.findAll({
            where: { databaseId: testDatabase.id }
        })

        expect(records).toHaveLength(1)
        expect(records[0].data).toEqual(data)
    })
    test('optional Fields may be omitted successfully', async () => {
        const data = {
            [nameField.id]: 'Bob',
        }

        const response = await postRecord(testDatabase.id, token, data)

        expect(response.status).toBe(201)
        expect(response.body.data).toEqual(data)

        const records = await Record.findAll({
            where: { databaseId: testDatabase.id }
        })

        expect(records).toHaveLength(1)
        expect(records[0].data).toEqual(data)
    })
    test('fails with 401 if user is without authentication', async () => {
        const data = {
            [nameField.id]: 'Bob',
            [ageField.id]: 21
        }

        const response = await api
            .post(`/api/databases/${testDatabase.id}/records`)
            .send({ data })
            .expect(401)

        expect(response.body.error).toBe('Authentication required')
    })
    test('fails with 401 if user\'s token is invalid', async () => {
        const data = {
            [nameField.id]: 'Bob',
            [ageField.id]: 21
        }

        const response = await postRecord(testDatabase.id, 'Bearer invalid-token', data)

        expect(response.status).toBe(401)
        expect(response.body.error).toBe('Invalid token')
    })
    test('fails with 400 if database ID is invalid', async () => {
        const data = {
            [nameField.id]: 'Bob',
            [ageField.id]: 21
        }

        const response = await postRecord("invalid-id", token, data)

        expect(response.status).toBe(400)
        expect(response.body.error).toBe('Invalid database ID')
    })
    test('fails with 400 if database does not exist', async () => {
        const data = {
            [nameField.id]: 'Bob',
            [ageField.id]: 21
        }

        const response = await postRecord(testDatabase.id + 99, token, data)

        expect(response.status).toBe(404)
        expect(response.body.error).toBe('Database not found')
    })
    test('fails with 404 if user tries to add a record on another user\'s database', async () => {
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
        
        const data = {
            [nameField.id]: 'Bob',
            [ageField.id]: 21
        }

        const response = await postRecord(testDatabase.id, loginResponse.body.token, data)

        expect(response.status).toBe(404)
        expect(response.body.error).toBe('Database not found')
    })
    test('fails with 400 if database has no fields', async () => {
        const emptyDatabase = await Database.create({
            name: 'Empty Database',
            userId: testDatabase.userId
        })

        const response = await postRecord(emptyDatabase.id, token, {})

        expect(response.status).toBe(400)
        expect(response.body.error).toBe(
            'Database must have at least one field before creating records'
        )
    })
    test('fails with 400 if data is missing', async () => {
        const response = await api
            .post(`/api/databases/${testDatabase.id}/records`)
            .set('Authorization', `Bearer ${token}`)
            .send({})
            
        expect(response.status).toBe(400)
    })
    test('fails with 400 if data is not an object', async () => {
        const response = await api
            .post(`/api/databases/${testDatabase.id}/records`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                data: 'not an object'
            })

        expect(response.status).toBe(400)
    })
    test('fails with 400 if record contains an unknown field ID', async () => {
        const data = {
            [nameField.id]: 'Bob',
            '99999': 'Unknown value'
        }

        const response = await postRecord(testDatabase.id, token, data)

        expect(response.status).toBe(400)
        expect(response.body.error).toBe('Unknown field ID \'99999\'')
    })
    test('fails with 400 if a required field is missing', async () => {
        const data = {
            [ageField.id]: 21
        }

        const response = await postRecord(testDatabase.id, token, data)

        expect(response.status).toBe(400)
        expect(response.body.error).toBe('Required field \'Name\' is missing')
    })
    test('fails with 400 if user inputs a wrong value on a field with a \'text\' type', async () => {
        const data = {
            [nameField.id]: 123,
            [ageField.id]: 21
        }

        const response = await postRecord(testDatabase.id, token, data)

        expect(response.status).toBe(400)
        expect(response.body.error).toBe('Field \'Name\' must be text')
    })
    test('fails with 400 if user inputs a wrong value on a field with a \'number\' type', async () => {
        const data = {
            [nameField.id]: 'Bob',
            [ageField.id]: '21'
        }

        const response = await postRecord(testDatabase.id, token, data)

        expect(response.status).toBe(400)
        expect(response.body.error).toBe('Field \'Age\' must be number')
    })
    test('fails with 400 if user inputs a wrong value on a field with a \'boolean\' type', async () => {
        let booleanField: Field

        booleanField = await Field.create({
            databaseId: testDatabase.id,
            name: 'isEnrolled',
            type: 'boolean',
            required: false
        })
        
        const data = {
            [nameField.id]: 'Bob',
            [ageField.id]: 21,
            [booleanField.id]: 'true'
        }

        const response = await postRecord(testDatabase.id, token, data)

        expect(response.status).toBe(400)
        expect(response.body.error).toBe('Field \'isEnrolled\' must be either true or false')
    })
    test('fails with 400 if user inputs an invalid date format on a field with a \'date\' type', async () => {
        let dateField: Field

        dateField = await Field.create({
            databaseId: testDatabase.id,
            name: 'Birth Date',
            type: 'date',
            required: false
        })
        
        const data = {
            [nameField.id]: 'Bob',
            [ageField.id]: 21,
            [dateField.id]: '02-25-2025'
        }

        const response = await postRecord(testDatabase.id, token, data)

        expect(response.status).toBe(400)
        expect(response.body.error).toBe('Field \'Birth Date\' must be a date in YYYY-MM-DD format')
    })
    test('fails with 400 if user inputs an impossible date on a field with a \'date\' type', async () => {
        let dateField: Field

        dateField = await Field.create({
            databaseId: testDatabase.id,
            name: 'Birth Date',
            type: 'date',
            required: false
        })
        
        const data = {
            [nameField.id]: 'Bob',
            [ageField.id]: 21,
            [dateField.id]: '2025-02-31'
        }

        const response = await postRecord(testDatabase.id, token, data)

        expect(response.status).toBe(400)
        expect(response.body.error).toBe('Field \'Birth Date\' must be a real date')
    })
})
describe('GET /api/databases/:databaseId/records', () => {
    describe('when database has records', () => {
        beforeEach(async () => {
            const firstData = {
                [nameField.id]: 'Bob',
                [ageField.id]: 21
            }

            const secondData = {
                [nameField.id]: 'Alice',
                [ageField.id]: 22
            }

            const thirdData = {
                [nameField.id]: 'Joey',
                [ageField.id]: 20
            }

            await postRecord(testDatabase.id, token, firstData)
            await postRecord(testDatabase.id, token, secondData)
            await postRecord(testDatabase.id, token, thirdData)
        })
        test('returns all records belonging to the database', async () => {
            const response = await getRecords(testDatabase.id, token)
            
            expect(response.status).toBe(200)
            expect(response.body).toHaveLength(3)

            expect(response.body).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ 
                        data: expect.objectContaining({
                            [nameField.id]: 'Bob'
                        }) 
                    }),
                    expect.objectContaining({ 
                        data: expect.objectContaining({
                            [nameField.id]: 'Alice'
                        }) 
                    }),
                    expect.objectContaining({ 
                        data: expect.objectContaining({
                            [nameField.id]: 'Joey'
                        }) 
                    })
                ])
            )
        })
        test('returns records ordered by id in ascending order', async () => {
            const response = await getRecords(testDatabase.id, token)

            expect(response.status).toBe(200)

            const ids = response.body.map((record: Record) => record.id)

            expect(ids).toEqual([...ids].sort((a, b) => a - b))
        })
    })
    describe('when database has no records', () => {
        test('returns []', async () => {
            const response = await getRecords(testDatabase.id, token)

            expect(response.status).toBe(200)
            expect(response.body).toEqual([])
        })
    })
    describe('when database is invalid or inaccessible', () => {
        test('fails with 401 if user is without authentication', async () => {
            const response = await api
                .get(`/api/databases/${testDatabase.id}/records`)
                .expect(401)

            expect(response.body.error).toBe('Authentication required')
        })
        test('fails with 401 if user has invalid token', async () => {
            const response = await getRecords(testDatabase.id, 'invalid-token')

            expect(response.status).toBe(401)
            expect(response.body.error).toBe('Invalid token')
        })
        test('fails with 400 if database ID is invalid', async () => {
            const response = await getRecords('invalid-id', token)

            expect(response.status).toBe(400)
            expect(response.body.error).toBe('Invalid database ID')
        })
        test('fails with 404 if database does not exist', async () => {
            const response = await getRecords(testDatabase.id + 99, token)

            expect(response.status).toBe(404)
            expect(response.body.error).toBe('Database not found')
        })
        test('fails with 404 when accessing another user\'s database', async () => {
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

            const response = await getRecords(testDatabase.id, loginResponse.body.token)

            expect(response.status).toBe(404)
            expect(response.body.error).toBe('Database not found')
        })
        test('must never return Records belonging to another Database', async () => {
            const secondDatabase = await Database.create({
                name: 'Employees',
                userId: testDatabase.userId
            })

            const employeeNameField = await Field.create({
                databaseId: secondDatabase.id,
                name: 'Name',
                type: 'text',
                required: true
            })

            const otherData = {
                [employeeNameField.id]: 'John'
            }

            const otherRecordResponse = await postRecord(
                secondDatabase.id,
                token,
                otherData
            )

            const response = await getRecords(
                testDatabase.id,
                token
            )

            expect(response.status).toBe(200)

            const returnedIds = response.body.map(
                (record: Record) => record.id
            )

            expect(returnedIds).not.toContain(otherRecordResponse.body.id)
        })
    })
})
describe('GET /api/databases/:databaseId/records/:recordId', () => {
    describe('when database has a record', () => {
        let testRecordId: number

        beforeEach(async () => {
            const newData = {
                [nameField.id]: 'Bob',
                [ageField.id]: 21
            }

            const addedData = await postRecord(testDatabase.id, token, newData)
            testRecordId = addedData.body.id
        })
        test('returns the requested record', async () => {
            const response = await getRecordById(testDatabase.id, testRecordId, token)
            
            expect(response.status).toBe(200)
            expect(response.headers['content-type']).toMatch(/application\/json/)
            expect(response.body).toEqual(
                expect.objectContaining({
                    id: testRecordId,
                    databaseId: testDatabase.id,
                    data: expect.objectContaining({
                        [nameField.id]: 'Bob'
                    })
                })
            )
        })
        test('fails with 401 if user is without authentication', async () => {
            const response = await api
                .get(`/api/databases/${testDatabase.id}/records/${testRecordId}`)
                .expect(401)
            
            expect(response.body.error).toBe('Authentication required')
        })
        test('fails with 401 if user has invalid token', async () => {
            const response = await getRecordById(testDatabase.id, testRecordId, 'invalid-token')
            
            expect(response.status).toBe(401)
            expect(response.body.error).toBe('Invalid token')
        })
        test('fails with 400 if database ID is invalid', async () => {
            const response = await getRecordById('invalid-id', testRecordId, token)
            
            expect(response.status).toBe(400)
            expect(response.body.error).toBe('Invalid database ID')
        })
        test('fails with 400 if record ID is invalid', async () => {
            const response = await getRecordById(testDatabase.id, 'invalid-id', token)
            
            expect(response.status).toBe(400)
            expect(response.body.error).toBe('Invalid record ID')
        })
        test('fails with 404 if database does not exist', async () => {
            const response = await getRecordById(testDatabase.id + 99, testRecordId, token)
            
            expect(response.status).toBe(404)
            expect(response.body.error).toBe('Database not found')
        })
        test('fails with 404 when accessing another user\'s database', async () => {
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

            const response = await getRecordById(
                testDatabase.id, 
                testRecordId,
                loginResponse.body.token,
            )

            expect(response.status).toBe(404)
            expect(response.body.error).toBe('Database not found')
        })
        test('fails with 404 if record does not exist', async () => {
            const response = await getRecordById(testDatabase.id, testRecordId + 99, token)

            expect(response.status).toBe(404)
            expect(response.body.error).toBe('Record not found')
        })
        test('must never return a record that belongs to another database', async () => {
            const secondDatabase = await Database.create({
                name: 'Employees',
                userId: testDatabase.userId
            })

            const employeeNameField = await Field.create({
                databaseId: secondDatabase.id,
                name: 'Name',
                type: 'text',
                required: true
            })

            const otherData = {
                [employeeNameField.id]: 'John'
            }

            const otherRecordResponse = await postRecord(secondDatabase.id, token, otherData)

            const response = await getRecordById(testDatabase.id, otherRecordResponse.body.id, token)

            expect(response.status).toBe(404)
            expect(response.body.error).toBe('Record not found')
        })
    })
})
describe('PUT /api/databases/:databaseId/records/:recordId', () => {
    let testRecordId: number

    beforeEach(async () => {
        const data = {
            [nameField.id]: 'Bob',
            [ageField.id]: 21
        }

        const response = await postRecord(testDatabase.id, token, data)
        testRecordId = response.body.id
    })
    test('replaces the record data', async () => {
        const updatedData = {
            [nameField.id]: 'Alice',
            [ageField.id]: 25
        }

        const response = await updateRecordById(testDatabase.id, testRecordId, token, updatedData)

        expect(response.status).toBe(200)
        expect(response.body.id).toBe(testRecordId)
        expect(response.body.databaseId).toBe(testDatabase.id)
        expect(response.body.data).toEqual(updatedData)
    })
    test('fails with 401 if user is without authentication', async () => {
        const updatedData = {
            [nameField.id]: 'Alice',
            [ageField.id]: 25
        }

        const response = await api
            .put(`/api/databases/${testDatabase.id}/records/${testRecordId}`)
            .send({ data: updatedData })

        expect(response.status).toBe(401)
        expect(response.body.error).toBe("Authentication required")
    })
    test('fails with 401 if user\'s token is invalid', async () => {
        const updatedData = {
            [nameField.id]: 'Alice',
            [ageField.id]: 25
        }

        const response = await updateRecordById(testDatabase.id, testRecordId, 'invalid-token', updatedData)

        expect(response.status).toBe(401)
        expect(response.body.error).toBe("Invalid token")
    })
    test('fails with 400 if database ID is invalid', async () => {
        const updatedData = {
            [nameField.id]: 'Alice',
            [ageField.id]: 25
        }

        const response = await updateRecordById('invalid-id', testRecordId, token, updatedData)

        expect(response.status).toBe(400)
        expect(response.body.error).toBe("Invalid database ID")
    })
    test('fails with 400 if record ID is invalid', async () => {
        const updatedData = {
            [nameField.id]: 'Alice',
            [ageField.id]: 25
        }

        const response = await updateRecordById(testDatabase.id, 'invalid-id', token, updatedData)

        expect(response.status).toBe(400)
        expect(response.body.error).toBe("Invalid record ID")
    })
    test('fails with 400 if database does not exist', async () => {
        const updatedData = {
            [nameField.id]: 'Alice',
            [ageField.id]: 25
        }

        const response = await updateRecordById(testDatabase.id + 99, testRecordId, token, updatedData)

        expect(response.status).toBe(404)
        expect(response.body.error).toBe("Database not found")
    })
    test('fails with 404 when accessing another user\'s database', async () => {
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

        const updatedData = {
            [nameField.id]: 'Alice',
            [ageField.id]: 25
        }

        const response = await updateRecordById(
            testDatabase.id, 
            testRecordId, 
            loginResponse.body.token, 
            updatedData
        )

        expect(response.status).toBe(404)
        expect(response.body.error).toBe("Database not found")
    })
    test('fails with 404 if record does not exist', async () => {
        const updatedData = {
            [nameField.id]: 'Alice',
            [ageField.id]: 25
        }

        const response = await updateRecordById(testDatabase.id, testRecordId + 99, token, updatedData)

        expect(response.status).toBe(404)
        expect(response.body.error).toBe("Record not found")
    })
    test('fails with 404 if user tries to update a record that belongs to another database', async () => {
        const secondDatabase = await Database.create({
            name: 'Employees',
            userId: testDatabase.userId
        })

        const employeeNameField = await Field.create({
            databaseId: secondDatabase.id,
            name: 'Name',
            type: 'text',
            required: true
        })

        const otherData = {
            [employeeNameField.id]: 'John'
        }

        const updatedData = {
            [employeeNameField.id]: 'Bob'
        }

        const otherRecordResponse = await postRecord(secondDatabase.id, token, otherData)

        const response = await updateRecordById(
            testDatabase.id, 
            otherRecordResponse.body.id, 
            token,
            updatedData
        )

        expect(response.status).toBe(404)
        expect(response.body.error).toBe('Record not found')
    })
    test('fails with 400 if record field data is invalid', async () => {
        const updatedData = {
            [nameField.id]: 123,
            [ageField.id]: 25
        }

        const response = await updateRecordById(testDatabase.id, testRecordId, token, updatedData)

        expect(response.status).toBe(400)
        expect(response.body.error).toBe(`Field '${nameField.name}' must be text`)
    })
    test('fails with 400 if field ID is unknown', async () => {
        const updatedData = {
            name: 'Alice',
            [ageField.id]: 25
        }

        const response = await updateRecordById(testDatabase.id, testRecordId, token, updatedData)

        expect(response.status).toBe(400)
        expect(response.body.error).toBe("Unknown field ID 'name'")
    })
    test('fails with 400 if record data is missing a required field', async () => {
        const updatedData = {
            [ageField.id]: 25
        }

        const response = await updateRecordById(testDatabase.id, testRecordId, token, updatedData)

        expect(response.status).toBe(400)
        expect(response.body.error).toBe(`Required field '${nameField.name}' is missing`)
    })
    test('fails with 400 if user inputs an invalid date format on a field with a \'date\' type', async () => {
        let dateField: Field

        dateField = await Field.create({
            databaseId: testDatabase.id,
            name: 'Birth Date',
            type: 'date',
            required: false
        })
        
        const updatedData = {
            [nameField.id]: 'Alice',
            [ageField.id]: 21,
            [dateField.id]: '02-25-2025'
        }

        const response = await updateRecordById(testDatabase.id, testRecordId, token, updatedData)

        expect(response.status).toBe(400)
        expect(response.body.error).toBe('Field \'Birth Date\' must be a date in YYYY-MM-DD format')
    })
    test('fails with 400 if database has no fields', async () => {
        const emptyDatabase = await Database.create({
            name: 'Empty Database',
            userId: testDatabase.userId
        })

        const record = await Record.create({
            databaseId: emptyDatabase.id,
            data: {}
        })

        const response = await api
            .put(`/api/databases/${emptyDatabase.id}/records/${record.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                data: {}
            })

        expect(response.status).toBe(400)
        expect(response.body.error).toBe(
            'Database must have at least one field before updating records'
        )
    })
    test('removes optional field values omitted from the update', async () => {
        const updatedData = {
            [nameField.id]: 'Alice'
        }

        const response = await updateRecordById(testDatabase.id, testRecordId, token, updatedData)

        expect(response.status).toBe(200)
        expect(response.body.data).toEqual(updatedData)
        expect(response.body.data).not.toHaveProperty(String(ageField.id))
    })
})