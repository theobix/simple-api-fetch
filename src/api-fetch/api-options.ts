import {FilterChain} from "../api-filter-chain/filter-chain";
import {ApiRequest, RequestError, RequestState} from "./api-request-types";
import {GlobalConfig} from "../config/global-config";
import {AuthorizationHeader} from "./authorization";


export type ApiOptions<T> = {
  updateInterval?: number,
  bodyPreprocessing?: FilterChain<BodyInit, any, BodyInit>,
  ignoreAuthentication?: boolean,
  callbacks?: {
    onstart?: (request: Readonly<ApiRequest<T>>) => void,
    onerror?: (request: Readonly<ApiRequest<T>>, error: RequestError, globalErrorHandler: typeof GlobalConfig.errorHandler) => void,
    onstatechange?: (request: Readonly<ApiRequest<T>>, state: RequestState) => void,
    onfilterstep?: (request: Readonly<ApiRequest<T>>, i?: number, percent?: number) => void,
    onupdate?: (request: Readonly<ApiRequest<T>>, elapsedTime: number) => void
  }
} & RequestInit & {
  headers?: HeadersInit & Partial<{ 'Authorization': AuthorizationHeader }>
}
