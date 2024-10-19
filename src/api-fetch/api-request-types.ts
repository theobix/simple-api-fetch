import {FilterChain} from "../api-filter-chain/filter-chain";
import {ApiOptions} from "./api-options";


export type FetchMethod = 'GET' | 'POST'
export type RequestState = 'PENDING' | 'FILTERING' | 'SUCCESS' | 'ERROR'

export interface ApiRequest<T> {
  url: string,
  method: FetchMethod,
  responseFilterChain: FilterChain<Response, any, T>,
  state: RequestState,
  requestTime: number,
  options?: ApiOptions<T>,
  body?: any,
}
