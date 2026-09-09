const { DataTypes } = require('sequelize')

module.exports = {
    up: async ({ context: queryInterface }) => {
        await queryInterface.createTable('sessions', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'users', key: 'id' },
            },
            token: {
                type: DataTypes.STRING,
                allowNull: false
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW
            },
            expires_at: {
                type: DataTypes.DATE,
                allowNull: false
            }
        }, {
            foreignKeys: [{ 
                name: 'fk_sessions_user_id', 
                columns: ['user_id'], 
                references: { table: 'users', field: 'id' } 
            }]
        })
    },
    down: async ({ context: queryInterface }) => {
        await queryInterface.dropTable('sessions')
    }
}