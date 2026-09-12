import { Router, Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import validateBody from '../middleware/validateBody'
import { loginSchema } from '../schemas/login'

import { SECRET } from '../util/config'
import User from '../models/user'
import Session from '../models/session'

type LoginInput = z.infer<typeof loginSchema>

const router = Router()

router.post(
    '/', 
    validateBody(loginSchema),
    async (
        request: Request<{}, {}, LoginInput>, 
        response: Response
    ) => {
    const { email, password } = request.body

    const normalizedEmail = email.toLowerCase()

    const user = await User.findOne({
        where: { 
            email: normalizedEmail
        }
    })

    if (!user) {
        return response.status(401).json({
            error: 'Invalid email or password'
        })
    }

    const passwordCorrect = await bcrypt.compare(password, user.passwordHash)

    if (!passwordCorrect) {
        return response.status(401).json({
            error: 'Invalid email or password'
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