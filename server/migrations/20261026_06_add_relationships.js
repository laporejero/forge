const { DataTypes } = require('sequelize')

module.exports = {
    up: async ({ context: queryInterface }) => {
        await queryInterface.addColumn('fields', 'target_database_id', {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'databases',
                key: 'id'
            },
            onDelete: 'RESTRICT'
        })

        await queryInterface.addColumn('fields', 'inverse_field_id', {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'fields',
                key: 'id'
            },
            onDelete: 'SET NULL'
        })
    },

    down: async ({ context: queryInterface }) => {
        await queryInterface.removeColumn('fields', 'inverse_field_id')
        await queryInterface.removeColumn('fields', 'target_database_id')
    }
}