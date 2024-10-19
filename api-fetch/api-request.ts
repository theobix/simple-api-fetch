import {ApiRequest, FetchMethod, RequestState} from "./api-request-types";
import {ApiOptions} from "./api-options";
import {FilterChain} from "../api-filter-chain/filter-chain";
import apiFetch from "./api-fetch";


export default class ApiRequestImpl<T> implements ApiRequest<T> {
  public url: string;
  public method: FetchMethod;
  public body: any | undefined;
  public options: ApiOptions<T> | undefined;
  public responseFilterChain: FilterChain<Response, any, T>;
  public state: RequestState;
  public requestTime: number

  constructor(url: string,
              method: FetchMethod,
              responseFilterChain: FilterChain<Response, any, T>,
              options?: ApiOptions<T>,
              body?: any) {
    this.url = url
    this.method = method
    this.responseFilterChain = responseFilterChain
    this.options = options
    this.body = body
    this.state = 'FILTERING'
    this.requestTime = Date.now()
  }

  public getElapsedTime() { return Date.now() - this.requestTime }

  public setState(state: RequestState) {
    this.state = state
    if (state !== 'ERROR') this.options?.callbacks?.onstatechange?.(this, state)
  }

  public startUpdateInterval() {
    if (this.options?.updateInterval !== undefined && this.options.updateInterval > 0) {
      const updateRequestInterval = setInterval(() => {
        if (this.state === 'PENDING' || this.state == 'FILTERING') {
          this.options?.callbacks?.onupdate?.(this, this.getElapsedTime())
        } else {
          clearInterval(updateRequestInterval)
        }
      }, this.options.updateInterval)
    }
  }

  public onstart() {
    this.options?.callbacks?.onstart?.(this)
  }
  public onerror(error: any) {
    this.setState('ERROR')
    this.options?.callbacks?.onerror?.(this, error)
  }
  public onfilterstep(i: number, filterCount: number)  {
    this.options?.callbacks?.onfilterstep?.(this, i, filterCount)
  }

  public async fetch(): Promise<T> {
    try {
      this.onstart()
      this.startUpdateInterval()

      const response = await apiFetch(this)

      this.setState('FILTERING')
      const filtered = await this.responseFilterChain.apply(
        response, (i, filterCount) => this.onfilterstep(i, filterCount))

      this.setState('SUCCESS')
      return filtered

    } catch (error: any) {
      this.onerror(error)
      throw error
    }
  }

}
