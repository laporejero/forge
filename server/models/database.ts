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
        validate: {
            notEmpty: {
                msg: 'Database name is required'
            },
            len: {
                args: [1, 30],
                msg: 'Database name should be 30 characters of less'
            }
        }
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' }
    }
}, {
    sequelize,
    underscored: true,
    timestamps: true,
    modelName: 'database',
    indexes: [{
        unique: true,
        fields: ['user_id', 'name'],
        name: 'unique_database_name_per_user'
    }]
})

export default Database
