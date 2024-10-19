import { FilterChain } from "./filter-chain";
declare const _default: {
    readonly NONE: FilterChain<Response, Response, Response>;
    readonly JSON: FilterChain<Response, Response, any>;
    readonly TEXT: FilterChain<Response, Response, string>;
};
export default _default;
