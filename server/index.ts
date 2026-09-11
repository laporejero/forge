import express, { Express } from 'express'
import { PORT } from './util/config'
import { connectToDatabase } from './util/db'
import usersRouter from './controllers/users'
import loginRouter from './controllers/login'
import databasesRouter from './controllers/databases'
import errorHandler from './middleware/errorHandler'
import unknownEndpoint from './middleware/unknownEndpoint'

const app: Express = express()

app.use(express.json())

app.use('/api/users', usersRouter)
app.use('/api/login', loginRouter)
app.use('/api/databases', databasesRouter)

app.use(unknownEndpoint)
app.use(errorHandler)

const start = async (): Promise<void> => {
    await connectToDatabase()
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`)
    })
}

start()
