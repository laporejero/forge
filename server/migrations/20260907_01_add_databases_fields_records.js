const { DataTypes } = require('sequelize')

module.exports = {
    up: async ({ context: queryInterface }) => {
        await queryInterface.createTable('databases', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' }
            }
        }),
        await queryInterface.createTable('fields', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            database_id: {
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
                allowNull: false
            }
        }),
        await queryInterface.createTable('records', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            database_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'databases', key: 'id' }
            },
            data: {
                type: DataTypes.JSONB,
                allowNull: false,
            }
        })
    },
    down: async ({ context: queryInterface }) => {
        await queryInterface.dropTable('records')
        await queryInterface.dropTable('fields')
        await queryInterface.dropTable('databases')
    }
}