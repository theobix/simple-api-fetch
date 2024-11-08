"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalApiConfig = void 0;
const filter_chain_1 = require("../api-filter-chain/filter-chain");
exports.GlobalApiConfig = {
    bodyPreprocessing: filter_chain_1.FilterChain.Create(),
    urlProcessor: filter_chain_1.FilterChain.Create(),
};
