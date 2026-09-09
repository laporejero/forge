"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rollbackMigration = exports.connectToDatabase = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const config_1 = require("./config");
const umzug_1 = require("umzug");
const databaseUrl = process.env.TESTING === 'true'
    ? config_1.TEST_DATABASE_URL
    : config_1.DATABASE_URL;
exports.sequelize = new sequelize_1.Sequelize(databaseUrl, { dialect: 'postgres' });
const connectToDatabase = async () => {
    try {
        await exports.sequelize.authenticate();
        await runMigrations();
        console.log('connected to the database');
    }
    catch (error) {
        console.log('failed to connect to database');
        process.exit(1);
    }
};
exports.connectToDatabase = connectToDatabase;
const migrationConf = {
    migrations: {
        glob: 'migrations/*.js',
    },
    storage: new umzug_1.SequelizeStorage({ sequelize: exports.sequelize, tableName: 'migrations' }),
    context: exports.sequelize.getQueryInterface(),
    logger: console,
};
const runMigrations = async () => {
    const migrator = new umzug_1.Umzug(migrationConf);
    const migrations = await migrator.up();
    console.log('Migrations up to date', {
        files: migrations.map((mig) => mig.name),
    });
};
const rollbackMigration = async () => {
    await exports.sequelize.authenticate();
    const migrator = new umzug_1.Umzug(migrationConf);
    await migrator.down();
};
exports.rollbackMigration = rollbackMigration;
