import express, { Express } from 'express'

import usersRouter from './controllers/users'
import loginRouter from './controllers/login'
import databasesRouter from './controllers/databases'
import fieldsRouter from './controllers/fields'
import errorHandler from './middleware/errorHandler'
import unknownEndpoint from './middleware/unknownEndpoint'

const app: Express = express()

app.use(express.json())

app.use('/api/users', usersRouter)
app.use('/api/login', loginRouter)
app.use('/api/databases', databasesRouter)
app.use('/api/databases/:databaseId/fields', fieldsRouter)

app.use(unknownEndpoint)
app.use(errorHandler)

export default app