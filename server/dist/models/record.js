"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const db_1 = require("../util/db");
class Record extends sequelize_1.Model {
}
Record.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    databaseId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'databases', key: 'id' }
    },
    data: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
    }
}, {
    sequelize: db_1.sequelize,
    underscored: true,
    timestamps: false,
    modelName: 'record'
});
exports.default = Record;
