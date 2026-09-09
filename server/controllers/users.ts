import { Router, Request, Response, NextFunction } from 'express'
import bcrypt from 'bcrypt'
import { User } from '../models'

const router = Router()

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await User.findAll()
        res.json(users)
    } catch (error) {
        next(error)
    }
})

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body

        if (!name || !email || !password) {
            return res.status(400).json({
                error: 'name, email and password are required'
            })
        }

        if (password.length < 8) {
            return res.status(400).json({
                error: 'password must be at least 8 characters'
            })
        }

        const passwordHash = await bcrypt.hash(password, 10)

        const user = await User.create({
            name,
            email,
            passwordHash
        })

        res.json(user)
    } catch (error) {
        next(error)
    }
})

export default router
