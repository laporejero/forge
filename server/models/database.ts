import { Model, DataTypes, ForeignKey, CreationOptional } from 'sequelize'
import { sequelize } from '../util/db'
import User from './user'

class Database extends Model {
    declare id: CreationOptional<number>
    declare name: string
    declare userId: ForeignKey<User['id']>
}

Database.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    }
}, {
    sequelize,
    underscored: true,
    timestamps: false,
    modelName: 'database'
})

export default Database
