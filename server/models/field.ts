import { Model, DataTypes } from 'sequelize'
import { sequelize } from '../util/db'
import { FieldType } from '../schemas/field'

class Field extends Model {
    declare id: number
    declare databaseId: number
    declare name: string
    declare type: FieldType
    declare required: boolean
    declare targetDatabaseId: number | null
    declare inverseFieldId: number | null
}

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
    },
    targetDatabaseId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'databases', key: 'id' },
        onDelete: 'RESTRICT'
    },
    inverseFieldId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'fields', key: 'id' },
        onDelete: 'SET NULL'
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
