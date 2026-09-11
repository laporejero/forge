import { Router, Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import { Database, User } from '../models'

const router = Router()

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
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

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password } = req.body

    if (
        typeof name !== 'string' ||
        typeof email !== 'string' ||
        typeof password !== 'string' ||
        !name.trim() ||
        !email.trim() ||
        !password
    ) {
        return res.status(400).json({
            error: 'name, email and password are required'
        })
    }

    if (password.length < 8) {
        return res.status(400).json({
            error: 'password must be at least 8 characters'
        })
    }

    const normalizedName = name.trim()
    const normalizedEmail = email.trim().toLowerCase()

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await User.create({
        name: normalizedName,
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
