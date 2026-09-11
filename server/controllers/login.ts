import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'

import { SECRET } from '../util/config'
import User from '../models/user'
import Session from '../models/session'

const router = Router()

router.post('/', async (request: Request, response: Response) => {
    const { email, password } = request.body

    if (
        typeof email !== 'string' || 
        typeof password !== 'string' || 
        !email.trim() || 
        !password
    ) {
        return response.status(400).json({
            error: 'email and password are required'
        })
    }

    const user = await User.findOne({
        where: { email }
    })

    if (!user) {
        return response.status(401).json({
            error: 'invalid email or password'
        })
    }

    const passwordCorrect = await bcrypt.compare(password, user.passwordHash)

    if (!passwordCorrect) {
        return response.status(401).json({
            error: 'invalid username or password'
        })
    }

    const userForToken = {
        user: user.email,
        id: user.id
    }

    const token = jwt.sign(userForToken, SECRET)

    await Session.create({
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hrs from now
    })

    response.status(200).send({
        token,
        email: user.email,
        name: user.name
    })
})

export default router