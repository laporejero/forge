import { Model, DataTypes } from 'sequelize'
import { sequelize } from '../util/db'

class Database extends Model {}

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
