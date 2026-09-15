import User from './user'
import Database from './database'
import Field from './field'
import Record from './record'
import Session from './session'

User.hasMany(Database)
Database.belongsTo(User)

User.hasMany(Session)
Session.belongsTo(User)

Database.hasMany(Field, {
    foreignKey: 'databaseId',
    onDelete: 'CASCADE'
})
Field.belongsTo(Database, {
    foreignKey: 'databaseId'
})

Database.hasMany(Record)
Record.belongsTo(Database)

export { User, Database, Field, Record, Session }
