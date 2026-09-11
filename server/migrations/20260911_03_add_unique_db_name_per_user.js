module.exports = {
    up: async ({ context: queryInterface }) => {
        await queryInterface.addIndex(
            'databases',
            ['user_id', 'name'],
            {
                unique: true,
                name: 'unique_database_name_per_user'
            }
        )
    },

    down: async ({ context: queryInterface }) => {
        await queryInterface.removeIndex(
            'databases',
            'unique_database_name_per_user'
        )
    }
}