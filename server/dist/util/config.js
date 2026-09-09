"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SECRET = exports.PORT = exports.TEST_DATABASE_URL = exports.DATABASE_URL = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.DATABASE_URL = process.env.DATABASE_URL;
exports.TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;
exports.PORT = process.env.PORT || 3001;
const secret = process.env.SECRET;
if (!secret) {
    throw new Error('SECRET is not defined');
}
exports.SECRET = secret;
