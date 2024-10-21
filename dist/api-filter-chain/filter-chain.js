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
exports.FilterChain = void 0;
class FilterNode {
    constructor(filter) {
        this.errorFilters = [];
        this.CALLBACKS = {
            RETRY: (maxTries) => ['_RETRY', maxTries],
            FALLBACK: (output) => ['_FALLBACK', output],
            FALLBACK_FILTER: (filter) => ['_FALLBACK_FILTER', filter]
        };
        this.filter = filter;
    }
    addErrorFilter(errorFilter) {
        this.errorFilters.push(errorFilter);
    }
    process(input, retries = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield this.filter(input);
            }
            catch (thrown) {
                let prevOutput = thrown;
                for (const errorFilter of this.errorFilters) {
                    prevOutput = yield errorFilter(prevOutput, this.CALLBACKS);
                    if (Array.isArray(prevOutput) && prevOutput.length === 2) {
                        switch (prevOutput[0]) {
                            case '_RETRY':
                                if (retries < prevOutput[1])
                                    return yield this.process(input, retries + 1);
                                break;
                            case '_FALLBACK':
                                return prevOutput[1];
                            case '_FALLBACK_FILTER':
                                if (typeof prevOutput[1] === "function") {
                                    const fallbackFilter = prevOutput[1];
                                    return yield fallbackFilter(input);
                                }
                                break;
                        }
                    }
                }
                throw thrown;
            }
        });
    }
}
class FilterChain {
    constructor() {
        this.filters = [];
    }
    static Create() {
        return new FilterChain();
    }
    then(filter) {
        this.filters.push(new FilterNode(filter));
        return this;
    }
    error(errorFilter) {
        if (this.filters.length !== 0)
            this.filters[this.filters.length - 1].addErrorFilter(errorFilter);
        return this;
    }
    retry(max) {
        this.error((_, c) => __awaiter(this, void 0, void 0, function* () { return c.RETRY(max); }));
        return this;
    }
    fallback(fallback) {
        this.error((_, c) => __awaiter(this, void 0, void 0, function* () { return c.FALLBACK(fallback); }));
        return this;
    }
    fallbackFilter(fallbackFilter) {
        this.error((_, c) => __awaiter(this, void 0, void 0, function* () { return c.FALLBACK_FILTER(fallbackFilter); }));
        return this;
    }
    constraint(constraint, error = new Error()) {
        this.then((value) => __awaiter(this, void 0, void 0, function* () {
            if (!constraint(value))
                throw error;
            return value;
        }));
        return this;
    }
    apply(input, onFilterChanged) {
        return __awaiter(this, void 0, void 0, function* () {
            let prevOutput = input;
            for (const [i, filter] of this.filters.entries()) {
                onFilterChanged === null || onFilterChanged === void 0 ? void 0 : onFilterChanged(i, this.filters.length);
                prevOutput = yield filter.process(prevOutput);
            }
            return prevOutput;
        });
    }
}
exports.FilterChain = FilterChain;
