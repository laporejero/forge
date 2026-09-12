import { Router, Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import  { z } from 'zod'

import { Database, User } from '../models'
import validateBody from '../middleware/validateBody'
import { newUserSchema } from '../schemas/user'

type NewUserInput = z.infer<typeof newUserSchema>

const router = Router()

router.get('/', async (req: Request, res: Response) => {
    const users = await User.findAll({
        include: {
            model: Database,
            attributes: {
                exclude: ['userId']
            }
        },
        attributes: {
            exclude: ['passwordHash']
        }
    })
    res.json(users)
})

router.post(
    '/', 
    validateBody(newUserSchema), 
    async (
        req: Request<{}, {}, NewUserInput>, 
        res: Response
    ) => {
    const { name, email, password } = req.body

    const normalizedEmail = email.trim().toLowerCase()

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await User.create({
        name,
        email: normalizedEmail,
        passwordHash
    })

    return res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email
    })
})

export default router