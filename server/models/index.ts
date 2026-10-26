import User from './user'
import Database from './database'
import Field from './field'
import Record from './record'
import Session from './session'
import RecordLink from './recordLink'

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

Database.hasMany(Record, {
    foreignKey: 'databaseId',
    onDelete: 'CASCADE'
})
Record.belongsTo(Database, {
    foreignKey: 'databaseId'
})

Field.hasMany(RecordLink, {
    foreignKey: 'fieldId',
    onDelete: 'CASCADE'
})
RecordLink.belongsTo(Field, {
    foreignKey: 'fieldId'
})

Record.hasMany(RecordLink, {
    foreignKey: 'sourceRecordId',
    as: 'outgoingLinks',
    onDelete: 'CASCADE'
})
RecordLink.belongsTo(Record, {
    foreignKey: 'sourceRecordId',
    as: 'sourceRecord'
})

Record.hasMany(RecordLink, {
    foreignKey: 'targetRecordId',
    as: 'incomingLinks',
    onDelete: 'CASCADE'
})
RecordLink.belongsTo(Record, {
    foreignKey: 'targetRecordId',
    as: 'targetRecord'
})

export { User, Database, Field, Record, Session, RecordLink }