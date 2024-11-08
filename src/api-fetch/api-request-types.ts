import {FilterChain} from "../api-filter-chain/filter-chain";
import {ApiOptions} from "./api-options";


export type FetchMethod = 'GET' | 'POST'
export type RequestState = 'PENDING' | 'FILTERING' | 'SUCCESS' | 'ERROR'

export class RequestError extends Error {
  constructor(
      public readonly type: 'NETWORK' | 'HTTP' | 'FILTER',
      public readonly status: number,
      public readonly statusText: string | any
  ) {
    super(statusText)
  }
}

export interface ApiRequest<T> {
  url: string,
  method: FetchMethod,
  responseFilterChain: FilterChain<Response, any, T>,
  state: RequestState,
  requestTime: number,
  options?: ApiOptions<T>,
  body?: BodyInit
}
