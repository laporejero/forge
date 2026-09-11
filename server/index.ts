import app from './app'
import { PORT } from './util/config'
import { connectToDatabase } from './util/db'

const start = async (): Promise<void> => {
    await connectToDatabase()
    
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`)
    })
}

start()
