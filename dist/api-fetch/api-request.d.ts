import { ApiRequest, FetchMethod, RequestError, RequestState } from "./api-request-types";
import { ApiOptions } from "./api-options";
import { FilterChain } from "../api-filter-chain/filter-chain";
export default class ApiRequestImpl<T> implements ApiRequest<T> {
    url: string;
    method: FetchMethod;
    body: BodyInit | undefined;
    options: ApiOptions<T> | undefined;
    responseFilterChain: FilterChain<Response, any, T>;
    state: RequestState;
    requestTime: number;
    constructor(url: string, method: FetchMethod, responseFilterChain: FilterChain<Response, any, T>, options?: ApiOptions<T>, body?: BodyInit);
    getElapsedTime(): number;
    setState(state: RequestState): void;
    startUpdateInterval(): void;
    onstart(): void;
    onfilterstep(i: number, filterCount: number): void;
    fetch(): Promise<T>;
    private makeRequest;
    private applyFilters;
    private handleHttpError;
    private handleNetworkError;
    private handleFilterError;
    private beforeEachRequestConfig;
    onerror(requestError: RequestError): void;
}
