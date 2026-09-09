import { Sequelize } from 'sequelize'
import { DATABASE_URL, TEST_DATABASE_URL } from './config'
import { Umzug, SequelizeStorage } from 'umzug'

const databaseUrl = process.env.TESTING === 'true'
    ? TEST_DATABASE_URL
    : DATABASE_URL

export const sequelize = new Sequelize(databaseUrl as string, { dialect: 'postgres' })

export const connectToDatabase = async (): Promise<void> => {
    try {
        await sequelize.authenticate()
        await runMigrations()
        console.log('connected to the database')
    } catch (error) {
        console.log('failed to connect to database')
        process.exit(1)
    }
}

const migrationConf = {
    migrations: {
        glob: 'migrations/*.js',
    },
    storage: new SequelizeStorage({ sequelize, tableName: 'migrations' }),
    context: sequelize.getQueryInterface(),
    logger: console,
}

const runMigrations = async (): Promise<void> => {
    const migrator = new Umzug(migrationConf)
    const migrations = await migrator.up()

    console.log('Migrations up to date', {
        files: migrations.map((mig) => mig.name),
    })
}

export const rollbackMigration = async (): Promise<void> => {
    await sequelize.authenticate()
    const migrator = new Umzug(migrationConf)
    await migrator.down()
}
