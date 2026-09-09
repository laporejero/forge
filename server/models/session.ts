import { Model, DataTypes } from 'sequelize'
import { sequelize } from '../util/db'

class Session extends Model {
    declare id: number
    declare userId: number
    declare token: string
    declare expiresAt: Date 
}

Session.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
    },
    token: {
        type: DataTypes.STRING,
        allowNull: false
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    sequelize,
    underscored: true,
    timestamps: true,
    modelName: 'session'
})

export default Session