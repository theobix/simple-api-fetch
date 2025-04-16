"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Authorization = void 0;
exports.Authorization = {
    Bearer: (token) => `Bearer ${token}`,
    Basic: (user, password) => `Basic ${btoa(`${user}:${password}`)}`
};
