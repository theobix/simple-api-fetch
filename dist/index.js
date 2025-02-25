"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorization = exports.filters = void 0;
const api_request_1 = __importDefault(require("./api-fetch/api-request"));
const filter_presets_1 = __importDefault(require("./api-filter-chain/filter-presets"));
const global_config_1 = require("./config/global-config");
const authorization_1 = require("./config/authorization");
const api = {
    get: (url, responseFilterChain, options) => {
        const request = new api_request_1.default(url, 'GET', responseFilterChain, options);
        return request.fetch();
    },
    post: (url, body, responseFilterChain, options) => {
        const request = new api_request_1.default(url, 'POST', responseFilterChain, options, body);
        return request.fetch();
    },
    globalConfig: global_config_1.GlobalApiConfig
};
exports.default = Object.assign({ install: (app, options) => {
        api.globalConfig = Object.assign(Object.assign({}, api.globalConfig), options);
        app.config.globalProperties.$api = api;
    } }, api);
exports.filters = filter_presets_1.default;
exports.authorization = authorization_1.Authorization;
