import { FilterChain } from "../api-filter-chain/filter-chain";
import { ApiOptions } from "./api-options";
export type FetchMethod = 'GET' | 'POST';
export type RequestState = 'PENDING' | 'FILTERING' | 'SUCCESS' | 'ERROR';
export declare class RequestError extends Error {
    readonly type: 'NETWORK' | 'HTTP' | 'FILTER';
    readonly status: number;
    readonly statusText: string | any;
    constructor(type: 'NETWORK' | 'HTTP' | 'FILTER', status: number, statusText: string | any);
}
export interface ApiRequest<T> {
    url: string;
    method: FetchMethod;
    responseFilterChain: FilterChain<Response, any, T>;
    state: RequestState;
    requestTime: number;
    options?: ApiOptions<T>;
    body?: BodyInit;
}
