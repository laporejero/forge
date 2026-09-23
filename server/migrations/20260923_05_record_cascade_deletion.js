module.exports = {
    up: async ({ context: queryInterface }) => {
        await queryInterface.removeConstraint(
            'records',
            'records_database_id_fkey'
        )

        await queryInterface.addConstraint('records', {
            fields: ['database_id'],
            type: 'foreign key',
            name: 'records_database_id_fkey',
            references: {
                table: 'databases',
                field: 'id'
            },
            onDelete: 'CASCADE'
        })
    },

    down: async ({ context: queryInterface }) => {
        await queryInterface.removeConstraint(
            'records',
            'records_database_id_fkey'
        )

        await queryInterface.addConstraint('records', {
            fields: ['database_id'],
            type: 'foreign key',
            name: 'records_database_id_fkey',
            references: {
                table: 'databases',
                field: 'id'
            }
        })
    }
}