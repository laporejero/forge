const { DataTypes } = require('sequelize')

module.exports = {
    up: async ({ context: queryInterface }) => {
        await queryInterface.createTable('record_links', {
            id: {
                type: DataTypes.INTEGER,
                primaryKey: true,
                autoIncrement: true
            },
            field_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'fields', key: 'id' },
                onDelete: 'CASCADE'
            },
            source_record_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'records', key: 'id' },
                onDelete: 'CASCADE'
            },
            target_record_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: { model: 'records', key: 'id' },
                onDelete: 'CASCADE'
            },
            created_at: {
                type: DataTypes.DATE,
                allowNull: false
            },
            updated_at: {
                type: DataTypes.DATE,
                allowNull: false
            }
        })
        await queryInterface.addIndex(
            'record_links',
            ['field_id', 'target_record_id'],
            { name: 'record_links_reverse_lookup_idx' }
        )
        await queryInterface.addConstraint('record_links', {
            fields: ['field_id', 'source_record_id', 'target_record_id'],
            type: 'unique',
            name: 'unique_record_link'
        })
    },

    down: async ({ context: queryInterface }) => {
        await queryInterface.dropTable('record_links')
    }
}