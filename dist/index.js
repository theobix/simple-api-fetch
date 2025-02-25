"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiAuthorization = exports.ApiFilters = exports.ApiGlobalConfig = void 0;
const api_request_1 = __importDefault(require("./api-fetch/api-request"));
const filter_presets_1 = __importDefault(require("./api-filter-chain/filter-presets"));
const global_config_1 = require("./config/global-config");
const authorization_1 = require("./api-fetch/authorization");
const api = {
    get: (url, responseFilterChain, options) => {
        const request = new api_request_1.default(url, 'GET', responseFilterChain, options);
        return request.fetch();
    },
    post: (url, body, responseFilterChain, options) => {
        const request = new api_request_1.default(url, 'POST', responseFilterChain, options, body);
        return request.fetch();
    }
};
exports.default = Object.assign({ install: (app, options) => {
        Object.assign(exports.ApiGlobalConfig, options);
        app.config.globalProperties.$api = api;
    } }, api);
exports.ApiGlobalConfig = global_config_1.GlobalConfig;
exports.ApiFilters = filter_presets_1.default;
exports.ApiAuthorization = authorization_1.Authorization;
