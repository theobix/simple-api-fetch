"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Authentication = void 0;
exports.Authentication = {
    Bearer: (token) => `Bearer ${btoa(token)}`,
    Basic: (user, password) => `Basic ${user}:${password}`
};
