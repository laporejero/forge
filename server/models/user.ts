import { Model, DataTypes, CreationOptional } from 'sequelize'
import { sequelize } from '../util/db'

class User extends Model {
    declare id: CreationOptional<number>
    declare email: string
    declare name: string
    declare passwordHash: string
}

User.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING,
        unique: {
            name: 'unique_email',
            msg: 'An account with this email already exists'
        },
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Email is required'
            },
            isEmail: {
                msg: 'Must be a valid email address'
            }
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Name is required'
            },
            len: {
                args: [2, 30],
                msg: 'Name must be between 2 and 30 characters'
            },
        }
    },
    passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    sequelize,
    underscored: true,
    timestamps: true,
    modelName: 'user'
})

export default User
