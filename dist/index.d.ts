import { FilterChain } from "./api-filter-chain/filter-chain";
import { ApiOptions } from "./api-fetch/api-options";
declare const _default: {
    get: <T>(url: string, responseFilterChain: FilterChain<Response, any, T>, options?: ApiOptions<T> | undefined) => Promise<T>;
    post: <T_1>(url: string, body: any, responseFilterChain: FilterChain<Response, any, T_1>, options?: ApiOptions<T_1> | undefined) => Promise<T_1>;
    filters: {
        readonly NONE: FilterChain<Response, Response, Response>;
        readonly JSON: FilterChain<Response, Response, any>;
        readonly TEXT: FilterChain<Response, Response, string>;
    };
};
export default _default;
