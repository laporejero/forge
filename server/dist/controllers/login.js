"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const config_1 = require("../util/config");
const user_1 = __importDefault(require("../models/user"));
const session_1 = __importDefault(require("../models/session"));
const router = (0, express_1.Router)();
router.post('/', async (request, response) => {
    const { email, password } = request.body;
    const user = await user_1.default.findOne({
        where: { email }
    });
    if (!user) {
        return response.status(401).json({
            error: 'invalid email or password'
        });
    }
    const passwordCorrect = await bcrypt_1.default.compare(password, user.passwordHash);
    if (!passwordCorrect) {
        return response.status(401).json({
            error: 'invalid username or password'
        });
    }
    const userForToken = {
        user: user.email,
        id: user.id
    };
    const token = jsonwebtoken_1.default.sign(userForToken, config_1.SECRET);
    await session_1.default.create({
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hrs from now
    });
    response.status(200).send({
        token,
        email: user.email,
        name: user.name
    });
});
exports.default = router;
