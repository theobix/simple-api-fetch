"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestError = void 0;
class RequestError extends Error {
    constructor(type, status, statusText) {
        super(statusText);
        this.type = type;
        this.status = status;
        this.statusText = statusText;
    }
}
exports.RequestError = RequestError;
