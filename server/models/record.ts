import { Model, DataTypes } from 'sequelize'
import { sequelize } from '../util/db'

class Record extends Model {
    declare id: number
    declare databaseId: number
    declare data: object
}

Record.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    databaseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'databases', key: 'id' },
        onDelete: 'CASCADE'
    },
    data: {
        type: DataTypes.JSONB,
        allowNull: false,
    }
}, {
    sequelize,
    underscored: true,
    timestamps: true,
    modelName: 'record'
})

export default Record