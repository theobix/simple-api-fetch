import { FilterChain } from "./api-filter-chain/filter-chain";
import { ApiOptions } from "./api-fetch/api-options";
import { GlobalApiConfigOptions } from "./config/global-config";
declare const _default: {
    get: <T>(url: string, responseFilterChain: FilterChain<Response, any, T>, options?: ApiOptions<T> | undefined) => Promise<T>;
    post: <T_1>(url: string, body: BodyInit, responseFilterChain: FilterChain<Response, any, T_1>, options?: ApiOptions<T_1> | undefined) => Promise<T_1>;
    globalConfig: GlobalApiConfigOptions;
    install: (app: any, options: Partial<GlobalApiConfigOptions>) => void;
};
export default _default;
export declare const filters: {
    readonly NONE: FilterChain<Response, Response, Response>;
    readonly JSON: FilterChain<Response, Response, any>;
    readonly TEXT: FilterChain<Response, Response, string>;
};
export declare const authorization: {
    Bearer: (token: string) => import("./config/authorization").AuthorizationHeader;
    Basic: (user: string, password: string) => import("./config/authorization").AuthorizationHeader;
};
