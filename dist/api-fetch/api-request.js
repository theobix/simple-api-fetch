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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const api_request_types_1 = require("./api-request-types");
const api_fetch_1 = __importDefault(require("./api-fetch"));
const global_config_1 = require("../config/global-config");
class ApiRequestImpl {
    constructor(url, method, responseFilterChain, options, body) {
        this.url = url;
        this.method = method;
        this.responseFilterChain = responseFilterChain;
        this.options = options;
        this.body = body;
        this.state = 'FILTERING';
        this.requestTime = Date.now();
    }
    getElapsedTime() { return Date.now() - this.requestTime; }
    setState(state) {
        var _a, _b, _c;
        this.state = state;
        if (state !== 'ERROR')
            (_c = (_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.callbacks) === null || _b === void 0 ? void 0 : _b.onstatechange) === null || _c === void 0 ? void 0 : _c.call(_b, this, state);
    }
    startUpdateInterval() {
        var _a;
        if (((_a = this.options) === null || _a === void 0 ? void 0 : _a.updateInterval) !== undefined && this.options.updateInterval > 0) {
            const updateRequestInterval = setInterval(() => {
                var _a, _b, _c;
                if (this.state === 'PENDING' || this.state === 'FILTERING') {
                    (_c = (_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.callbacks) === null || _b === void 0 ? void 0 : _b.onupdate) === null || _c === void 0 ? void 0 : _c.call(_b, this, this.getElapsedTime());
                }
                else {
                    clearInterval(updateRequestInterval);
                }
            }, this.options.updateInterval);
        }
    }
    onstart() {
        var _a, _b, _c;
        (_c = (_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.callbacks) === null || _b === void 0 ? void 0 : _b.onstart) === null || _c === void 0 ? void 0 : _c.call(_b, this);
    }
    onfilterstep(i, filterCount) {
        var _a, _b, _c;
        (_c = (_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.callbacks) === null || _b === void 0 ? void 0 : _b.onfilterstep) === null || _c === void 0 ? void 0 : _c.call(_b, this, i, filterCount);
    }
    fetch() {
        return __awaiter(this, void 0, void 0, function* () {
            this.onstart();
            this.startUpdateInterval();
            const response = yield this.makeRequest();
            if (!response.ok)
                throw this.handleHttpError(response);
            this.setState('FILTERING');
            const filtered = yield this.applyFilters(response);
            this.setState('SUCCESS');
            return filtered;
        });
    }
    makeRequest() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.beforeEachRequestConfig();
                return yield (0, api_fetch_1.default)(this);
            }
            catch (error) {
                throw this.handleNetworkError(error);
            }
        });
    }
    applyFilters(response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.responseFilterChain.apply(response, (i, filterCount) => this.onfilterstep(i, filterCount));
            }
            catch (error) {
                throw this.handleFilterError(error);
            }
        });
    }
    handleHttpError(response) {
        const requestError = new api_request_types_1.RequestError('HTTP', response.status, response.statusText);
        this.onerror(requestError);
        return requestError;
    }
    handleNetworkError(error) {
        const requestError = new api_request_types_1.RequestError('NETWORK', 0, error);
        this.onerror(requestError);
        return requestError;
    }
    handleFilterError(error) {
        const requestError = new api_request_types_1.RequestError('FILTER', 0, error);
        this.onerror(requestError);
        return requestError;
    }
    beforeEachRequestConfig() {
        var _a, _b;
        if (global_config_1.GlobalConfig.beforeEach)
            global_config_1.GlobalConfig.beforeEach(this);
        (_b = (_a = global_config_1.GlobalConfig.beforeEachMatching) === null || _a === void 0 ? void 0 : _a.filter(matcher => ("match" in matcher && matcher.match(this)) ||
            ("matchEndpoint" in matcher && matcher.matchEndpoint === new URL(this.url).pathname) ||
            ("matchUrl" in matcher && matcher.matchUrl === this.url) ||
            ("matchMethod" in matcher && matcher.matchMethod === this.method))) === null || _b === void 0 ? void 0 : _b.forEach(matcher => matcher.process(this));
    }
    onerror(requestError) {
        var _a, _b, _c, _d, _e, _f;
        this.setState('ERROR');
        if ((_b = (_a = this.options) === null || _a === void 0 ? void 0 : _a.callbacks) === null || _b === void 0 ? void 0 : _b.onerror) {
            this.options.callbacks.onerror(this, requestError, global_config_1.GlobalConfig.errorHandler);
        }
        else {
            if ((_c = global_config_1.GlobalConfig.errorHandler) === null || _c === void 0 ? void 0 : _c.catchAll)
                global_config_1.GlobalConfig.errorHandler.catchAll(requestError);
            (_f = (_e = (_d = global_config_1.GlobalConfig.errorHandler) === null || _d === void 0 ? void 0 : _d.catch) === null || _e === void 0 ? void 0 : _e.filter(matcher => ("match" in matcher && matcher.match(requestError)) ||
                ("matchErrorType" in matcher && matcher.matchErrorType === requestError.type) ||
                ("matchHttpCode" in matcher && requestError.type === 'HTTP' && matcher.matchHttpCode === requestError.status) ||
                ("matchStatusText" in matcher && matcher.matchStatusText === requestError.statusText))) === null || _f === void 0 ? void 0 : _f.forEach(matcher => matcher.process(requestError));
        }
    }
}
exports.default = ApiRequestImpl;
