import ApiRequestImpl from "./api-fetch/api-request";
import {FilterChain} from "./api-filter-chain/filter-chain";
import {ApiOptions} from "./api-fetch/api-options";
import filterPresets from "./api-filter-chain/filter-presets";
import {GlobalApiConfig, GlobalApiConfigOptions} from "./config/global-config";
import {Authorization} from "./config/authorization";

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
  },
  globalConfig: GlobalApiConfig
}

export default {
  install: (app: any, options: Partial<GlobalApiConfigOptions>) => {
    api.globalConfig = {
      ...api.globalConfig,
      ...options,
    }
    app.config.globalProperties.$api = api
  },
  ...api
}

export const filters = filterPresets
export const authorization = Authorization
