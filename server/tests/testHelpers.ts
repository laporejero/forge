import request from 'supertest'
import app from '../app'
import { User, Database, Session, Field } from '../models'

const api = request(app)

export const clearTestDatabase = async () => {
    await Session.destroy({ where: {} })
    await Field.destroy({ where: {} })
    await Database.destroy({ where: {} })
    await User.destroy({ where: {} })
} 

export const postDatabase = async (token: string, name: string) => {
    return await api 
        .post('/api/databases')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `${name}` })
}

export const getDatabaseById = async (id: number, token: string) => {
    return await api
        .get(`/api/databases/${id}`)
        .set('Authorization', `Bearer ${token}`)
}

export const putDatabase = async (id: number, token: string, name: string) => {
    return await api
        .put(`/api/databases/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `${name}` })
}

export const deleteDatabase = async (id: number, token: string) => {
    return await api
        .delete(`/api/databases/${id}`)
        .set('Authorization', `Bearer ${token}`)
}