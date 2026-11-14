import { describe, test, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import request from 'supertest'
import bcrypt from 'bcrypt'

import app from '../app'
import { User, Database, Field, Record, RecordLink } from '../models'
import { connectToDatabase, sequelize } from '../util/db'
import { clearTestDatabase, postRecordLinks } from './testHelpers'
import { email } from 'zod'

const api = request(app)

let token: string
let studentsDatabase: Database
let teachersDatabase: Database
let studentRecord: Record
let teacherRecord: Record
let studentsTeacherField: Field
let teachersStudentField: Field

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

    studentsDatabase = await Database.create({
        name: 'Students',
        userId: testUser.id
    })

    teachersDatabase = await Database.create({
        name: 'Teachers',
        userId: testUser.id
    })

    studentsTeacherField = await Field.create({
        databaseId: studentsDatabase.id,
        name: 'Teachers',
        type: 'relation',
        required: false,
        targetDatabaseId: teachersDatabase.id
    })

    teachersStudentField = await Field.create({
        databaseId: teachersDatabase.id,
        name: 'Students',
        type: 'relation',
        required: false,
        targetDatabaseId: studentsDatabase.id,
        inverseFieldId: studentsTeacherField.id
    })

    await studentsTeacherField.update({
        inverseFieldId: teachersStudentField.id
    })

    studentRecord = await Record.create({
        databaseId: studentsDatabase.id,
        data: {}
    })

    teacherRecord = await Record.create({
        databaseId: teachersDatabase.id,
        data: {}
    })
})

afterAll(async () => {
    await sequelize.close()
})

describe('POST /api/databases/:databaseId/records/:recordId/links/:fieldId', () => {
    test('creates a valid record link', async () => {
        const response = await postRecordLinks(
            studentsDatabase.id, 
            studentRecord.id,
            studentsTeacherField.id,
            token,
            teacherRecord.id
        )

        expect(response.status).toBe(201)

        const links = await RecordLink.findAll()

        expect(links).toHaveLength(1)
        expect(links[0].fieldId).toBe(studentsTeacherField.id)
        expect(links[0].sourceRecordId).toBe(studentRecord.id)
        expect(links[0].targetRecordId).toBe(teacherRecord.id)
    })
    test('rejects duplicate record links', async () => {
        const firstResponse = await postRecordLinks(
            studentsDatabase.id, 
            studentRecord.id,
            studentsTeacherField.id,
            token,
            teacherRecord.id
        )

        expect(firstResponse.status).toBe(201)

        const secondResponse = await postRecordLinks(
            studentsDatabase.id, 
            studentRecord.id,
            studentsTeacherField.id,
            token,
            teacherRecord.id
        )

        expect(secondResponse.status).toBe(409)
        expect(secondResponse.body).toEqual({
            error: 'Record link already exists'
        })

        const links = await RecordLink.findAll()

        expect(links).toHaveLength(1)
    })
    test('rejects duplicate links created through the inverse field', async () => {
        const firstResponse = await postRecordLinks(
            studentsDatabase.id,
            studentRecord.id,
            studentsTeacherField.id,
            token,
            teacherRecord.id
        )

        expect(firstResponse.status).toBe(201)

        const secondResponse = await postRecordLinks(
            teachersDatabase.id,
            teacherRecord.id,
            teachersStudentField.id,
            token,
            studentRecord.id
        )

        expect(secondResponse.status).toBe(409)
        expect(secondResponse.body).toEqual({
            error: 'Record link already exists'
        })

        const links = await RecordLink.findAll()

        expect(links).toHaveLength(1)
        expect(links[0].fieldId).toBe(studentsTeacherField.id)
        expect(links[0].sourceRecordId).toBe(studentRecord.id)
        expect(links[0].targetRecordId).toBe(teacherRecord.id)
    })
    test('rejects a nonexistent target record', async () => {
        const response = await postRecordLinks(
            studentsDatabase.id,
            studentRecord.id,
            studentsTeacherField.id,
            token,
            99999
        )

        expect(response.status).toBe(404)
        expect(response.body).toEqual({
            error: 'Target record not found'
        })

        const links = await RecordLink.findAll()

        expect(links).toHaveLength(0)
    })
    test('rejects a target record from the wrong database', async () => {
        // Create another record in Students, not Teachers
        const anotherStudent = await Record.create({
            databaseId: studentsDatabase.id,
            data: {}
        })

        const response = await postRecordLinks(
            studentsDatabase.id,
            studentRecord.id,
            studentsTeacherField.id,
            token,
            anotherStudent.id
        )

        expect(response.status).toBe(404)
        expect(response.body).toEqual({
            error: 'Target record not found'
        })

        const links = await RecordLink.findAll()

        expect(links).toHaveLength(0)
    })
    test('rejects linking records through a non-relationship field', async () => {
        const nameField = await Field.create({
            databaseId: studentsDatabase.id,
            name: 'Name',
            type: 'text',
            required: false
        })

        const response = await postRecordLinks(
            studentsDatabase.id,
            studentRecord.id,
            nameField.id,
            token,
            teacherRecord.id
        )

        expect(response.status).toBe(400)
        expect(response.body).toEqual({
            error: 'Field is not a relationship field'
        })

        const links = await RecordLink.findAll()

        expect(links).toHaveLength(0)
    })
    test('rejects linking to a database owned by another user', async () => {
        const passwordHash = await bcrypt.hash('password456', 10)

        const otherUser = await User.create({
            name: 'Other User',
            email: 'other@example.com',
            passwordHash
        })

        const privateDatabase = await Database.create({
            name: 'Private Database',
            userId: otherUser.id
        })

        const privateRecord = await Record.create({
            databaseId: privateDatabase.id,
            data: {}
        })

        const privateRelationField = await Field.create({
            databaseId: studentsDatabase.id,
            name: 'Private Records',
            type: 'relation',
            required: false,
            targetDatabaseId: privateDatabase.id
        })

        const response = await postRecordLinks(
            studentsDatabase.id,
            studentRecord.id,
            privateRelationField.id,
            token,
            privateRecord.id
        )

        expect(response.status).toBe(404)
        expect(response.body).toEqual({
            error: 'Target database not found'
        })

        const links = await RecordLink.findAll()

        expect(links).toHaveLength(0)
    })
    test('rejects an invalid targetRecordId', async () => {
        const response = await postRecordLinks(
            studentsDatabase.id,
            studentRecord.id,
            studentsTeacherField.id,
            token,
            -1
        )

        expect(response.status).toBe(400)
        expect(response.body.errors).toBeDefined()

        const links = await RecordLink.findAll()

        expect(links).toHaveLength(0)
    })
})