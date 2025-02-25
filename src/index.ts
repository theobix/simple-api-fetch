import ApiRequestImpl from "./api-fetch/api-request";
import {FilterChain} from "./api-filter-chain/filter-chain";
import {ApiOptions} from "./api-fetch/api-options";
import FilterPresets from "./api-filter-chain/filter-presets";
import {GlobalConfig, ApiGlobalConfigOptions} from "./config/global-config";
import {Authorization} from "./api-fetch/authorization";

const api = {
  get: <T>(
      url: string,
      responseFilterChain: FilterChain<Response, any, T>,
      options?: ApiOptions<T>
  ): Promise<T> => {
    const request: ApiRequestImpl<T> = new ApiRequestImpl<T>(url, 'GET', responseFilterChain, options)
    return request.fetch()
  },

  post: <T>(
      url: string,
      body: BodyInit,
      responseFilterChain: FilterChain<Response, any, T>,
      options?: ApiOptions<T>
  ): Promise<T> => {
    const request: ApiRequestImpl<T> = new ApiRequestImpl<T>(url, 'POST', responseFilterChain, options, body)
    return request.fetch()
  }
}

export default {
  install: (app: any, options: Partial<ApiGlobalConfigOptions>) => {
    Object.assign(ApiGlobalConfig, options)
    app.config.globalProperties.$api = api
  },
  ...api
}

export const ApiGlobalConfig = GlobalConfig
export const ApiFilters = FilterPresets
export const ApiAuthorization = Authorization
