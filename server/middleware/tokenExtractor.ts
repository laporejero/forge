import { Router, Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

import { SECRET } from '../util/config'
import { DecodedToken } from '../types/express'
import User from '../models/user'
import Session from '../models/session'

const tokenExtractor = async (req: Request, res: Response, next: NextFunction) => {
    const authorization = req.get('authorization')

    if (authorization && authorization.toLocaleLowerCase().startsWith('bearer ')) {
        try {
            req.decodedToken = jwt.verify(authorization.substring(7), SECRET) as DecodedToken
        } catch (error) {
            return res.status(401).json({ error: 'token invalid' })
        }
    } else {
        return res.status(401).json({ error: 'token missing' })
    }

    const user = await User.findByPk(req.decodedToken.id)
    if (!user) {
        return res.status(401).json({ error: 'user not found' })
    }

    const token = authorization.substring(7)
    const session = await Session.findOne({ where: { token } })

    if (!session) {
        return res.status(401).json({ error: 'session not found' })
    }

    if (new Date() > session.expiresAt) {
        return res.status(401).json({ error: 'session expired' })
    }

    next()
}

export default tokenExtractor