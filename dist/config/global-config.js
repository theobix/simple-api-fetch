"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalConfig = void 0;
const filter_chain_1 = require("../api-filter-chain/filter-chain");
exports.GlobalConfig = {
    bodyPreprocessing: filter_chain_1.FilterChain.Create(),
    urlProcessor: filter_chain_1.FilterChain.Create(),
};
