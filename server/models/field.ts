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
        references: { model: 'databases', key: 'id' },
        onDelete: 'CASCADE'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    required: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    }
}, {
    sequelize,
    underscored: true,
    timestamps: true,
    modelName: 'field',
    indexes: [{
        unique: true,
        fields: ['database_id', 'name'],
        name: 'unique_field_name_per_database'
    }]
})

export default Field
