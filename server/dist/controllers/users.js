"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const models_1 = require("../models");
const router = (0, express_1.Router)();
router.get('/', async (req, res, next) => {
    try {
        const users = await models_1.User.findAll();
        res.json(users);
    }
    catch (error) {
        next(error);
    }
});
router.post('/', async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({
                error: 'name, email and password are required'
            });
        }
        if (password.length < 8) {
            return res.status(400).json({
                error: 'password must be at least 8 characters'
            });
        }
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        const user = await models_1.User.create({
            name,
            email,
            passwordHash
        });
        res.json(user);
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
