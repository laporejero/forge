"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const unknownEndpoint = (req, res) => {
    res.status(404).json({
        error: 'Unknown endpoint'
    });
};
exports.default = unknownEndpoint;
