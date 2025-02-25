"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const global_config_1 = require("../config/global-config");
function apiFetch(request) {
    return __awaiter(this, void 0, void 0, function* () {
        const url = yield preprocessUrl(request);
        request = beforeEachRequestConfig(request);
        return yield fetch(url, Object.assign({
            method: request.method,
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: yield preprocessBody(request),
            headers: getAuthenticationHeader(request)
        }, request.options));
    });
}
exports.default = apiFetch;
function preprocessUrl(request) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield global_config_1.GlobalApiConfig.urlProcessor.apply(request.url);
    });
}
function preprocessBody(request) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!request.body)
            return undefined;
        const { bodyPreprocessing: globalPreprocessing } = global_config_1.GlobalApiConfig;
        const { bodyPreprocessing: requestPreprocessing } = request.options || {};
        let preprocessedBody = yield globalPreprocessing.apply(request.body);
        if (requestPreprocessing)
            preprocessedBody = yield requestPreprocessing.apply(preprocessedBody);
        return preprocessedBody;
    });
}
function getAuthenticationHeader(request) {
    var _a;
    if (!request.body || !global_config_1.GlobalApiConfig.setAuthorization || ((_a = request.options) === null || _a === void 0 ? void 0 : _a.ignoreAuthentication)) {
        return undefined;
    }
    const authorization = global_config_1.GlobalApiConfig.setAuthorization();
    if (authorization === null)
        return undefined;
    return { 'Authorization': authorization };
}
function beforeEachRequestConfig(request) {
    var _a, _b;
    if (global_config_1.GlobalApiConfig.beforeEach)
        request = global_config_1.GlobalApiConfig.beforeEach(request);
    (_b = (_a = global_config_1.GlobalApiConfig.beforeEachMatching) === null || _a === void 0 ? void 0 : _a.filter(matcher => ("match" in matcher && matcher.match(request)) ||
        ("matchEndpoint" in matcher && matcher.matchEndpoint === new URL(request.url).pathname) ||
        ("matchUrl" in matcher && matcher.matchUrl === request.url) ||
        ("matchMethod" in matcher && matcher.matchMethod === request.method))) === null || _b === void 0 ? void 0 : _b.forEach(matcher => request = matcher.process(request));
    return request;
}
