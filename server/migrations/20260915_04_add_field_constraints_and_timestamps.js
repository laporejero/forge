const { DataTypes } = require('sequelize')

module.exports = {
    up: async ({ context: queryInterface }) => {
        await queryInterface.addIndex(
            'fields',
            ['database_id', 'name'],
            {
                unique: true,
                name: 'unique_field_name_per_database'
            }
        )
        await queryInterface.removeConstraint('fields', 'fields_database_id_fkey')
        await queryInterface.addConstraint('fields', {
            fields: ['database_id'],
            type: 'foreign key',
            name: 'fields_database_id_fkey',
            references: {
                table: 'databases',
                field: 'id'
            },
            onDelete: 'CASCADE'
        })
        await queryInterface.addColumn('fields', 'required', {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        })
        await queryInterface.addColumn('fields', 'created_at', {
            type: DataTypes.DATE,
            allowNull: false,
        })
        await queryInterface.addColumn('fields', 'updated_at', {
            type: DataTypes.DATE,
            allowNull: false,
        })
        await queryInterface.addColumn('databases', 'created_at', {
            type: DataTypes.DATE,
            allowNull: false,
        })
        await queryInterface.addColumn('databases', 'updated_at', {
            type: DataTypes.DATE,
            allowNull: false,
        })
        await queryInterface.addColumn('records', 'created_at', {
            type: DataTypes.DATE,
            allowNull: false,
        })
        await queryInterface.addColumn('records', 'updated_at', {
            type: DataTypes.DATE,
            allowNull: false,
        })
    },

    down: async ({ context: queryInterface }) => {
        await queryInterface.removeColumn('records', 'updated_at')
        await queryInterface.removeColumn('records', 'created_at')
        await queryInterface.removeColumn('databases', 'updated_at')
        await queryInterface.removeColumn('databases', 'created_at')
        await queryInterface.removeColumn('fields', 'updated_at')
        await queryInterface.removeColumn('fields', 'created_at')
        await queryInterface.removeColumn('fields', 'required')
        await queryInterface.removeConstraint(
            'fields',
            'fields_database_id_fkey'
        )
        await queryInterface.addConstraint('fields', {
            fields: ['database_id'],
            type: 'foreign key',
            name: 'fields_database_id_fkey',
            references: {
                table: 'databases',
                field: 'id'
            }
        })
        await queryInterface.removeIndex('fields', 'unique_field_name_per_database')
    }
}