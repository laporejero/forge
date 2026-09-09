import { Model, DataTypes } from 'sequelize'
import { sequelize } from '../util/db'

class Field extends Model {}

Field.init({
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
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    sequelize,
    underscored: true,
    timestamps: false,
    modelName: 'field'
})

export default Field
