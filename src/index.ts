import ApiRequestImpl from "./api-fetch/api-request";
import {FilterChain} from "./api-filter-chain/filter-chain";
import {ApiOptions} from "./api-fetch/api-options";
import filterPresets from "./api-filter-chain/filter-presets";
export default {
  get: <T>(url: string, responseFilterChain: FilterChain<Response, any, T>, options?: ApiOptions<T>): Promise<T> => {
    const request: ApiRequestImpl<T> = new ApiRequestImpl<T>(url, 'GET', responseFilterChain, options)
    return request.fetch()
  },
  post: <T>(url: string, body: any, responseFilterChain: FilterChain<Response, any, T>, options?: ApiOptions<T>): Promise<T> => {
    const request: ApiRequestImpl<T> = new ApiRequestImpl<T>(url, 'POST', responseFilterChain, options, body)
    return request.fetch()
  },
  filters: filterPresets
}
