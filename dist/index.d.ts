import { FilterChain } from "./api-filter-chain/filter-chain";
import { ApiOptions } from "./api-fetch/api-options";
import { ApiGlobalConfigOptions } from "./config/global-config";
import { App } from "vue";
declare const _default: {
    get: <T>(url: string, responseFilterChain: FilterChain<Response, any, T>, options?: ApiOptions<T> | undefined) => Promise<T>;
    post: <T_1>(url: string, body: BodyInit, responseFilterChain: FilterChain<Response, any, T_1>, options?: ApiOptions<T_1> | undefined) => Promise<T_1>;
    install: (app: App, options: Partial<ApiGlobalConfigOptions>) => void;
};
export default _default;
export declare const ApiGlobalConfig: ApiGlobalConfigOptions;
export declare const ApiFilters: {
    readonly NONE: FilterChain<Response, Response, Response>;
    readonly JSON: FilterChain<Response, Response, any>;
    readonly TEXT: FilterChain<Response, Response, string>;
};
export declare const ApiAuthorization: {
    Bearer: (token: string) => import("./api-fetch/authorization").AuthorizationHeader;
    Basic: (user: string, password: string) => import("./api-fetch/authorization").AuthorizationHeader;
};
