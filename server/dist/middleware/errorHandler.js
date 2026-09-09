"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorHandler = (error, req, res, next) => {
    if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
            error: error.errors.map((e) => e.message)
        });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
            error: error.errors.map((e) => e.message)
        });
    }
    return res.status(500).json({
        error: 'Internal server error'
    });
};
exports.default = errorHandler;
