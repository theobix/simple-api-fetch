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
function apiFetch(request) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const processedBody = ((_a = request.options) === null || _a === void 0 ? void 0 : _a.bodyPreprocessing) ?
            yield request.options.bodyPreprocessing.apply(request.body) :
            JSON.stringify(request.body);
        return yield fetch('/api/' + request.url, Object.assign({
            method: request.method,
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: processedBody
        }, (_b = request.options) === null || _b === void 0 ? void 0 : _b.fetchOptions));
    });
}
exports.default = apiFetch;
