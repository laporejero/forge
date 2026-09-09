import { Model, DataTypes } from 'sequelize'
import { sequelize } from '../util/db'

class Record extends Model {}

Record.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    databaseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'databases', key: 'id' }
    },
    data: {
        type: DataTypes.JSONB,
        allowNull: false,
    }
}, {
    sequelize,
    underscored: true,
    timestamps: false,
    modelName: 'record'
})

export default Record
