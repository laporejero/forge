import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../util/db';

class RecordLink extends Model {
    declare id: number
    declare fieldId: number
    declare sourceRecordId: number
    declare targetRecordId: number
}

RecordLink.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    fieldId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'fields', key: 'id' },
        onDelete: 'CASCADE'
    },
    sourceRecordId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'records', key: 'id' },
        onDelete: 'CASCADE'
    },
    targetRecordId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'records', key: 'id' },
        onDelete: 'CASCADE'
    }
}, {
    sequelize,
    underscored: true,
    timestamps: true,
    modelName: 'recordLink'
})

export default RecordLink