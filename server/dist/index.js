"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const config_1 = require("./util/config");
const db_1 = require("./util/db");
const users_1 = __importDefault(require("./controllers/users"));
const login_1 = __importDefault(require("./controllers/login"));
const errorHandler_1 = __importDefault(require("./middleware/errorHandler"));
const unknownEndpoint_1 = __importDefault(require("./middleware/unknownEndpoint"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/users', users_1.default);
app.use('/api/login', login_1.default);
app.use(errorHandler_1.default);
app.use(unknownEndpoint_1.default);
const start = async () => {
    await (0, db_1.connectToDatabase)();
    app.listen(config_1.PORT, () => {
        console.log(`Server running on port ${config_1.PORT}`);
    });
};
start();
