import {ApiRequest, FetchMethod, RequestError, RequestState} from "./api-request-types";
import {ApiOptions} from "./api-options";
import {FilterChain} from "../api-filter-chain/filter-chain";
import apiFetch from "./api-fetch";
import {GlobalConfig} from "../config/global-config";


export default class ApiRequestImpl<T> implements ApiRequest<T> {
  public url: string;
  public method: FetchMethod;
  public body: BodyInit | undefined;
  public options: ApiOptions<T> | undefined;
  public responseFilterChain: FilterChain<Response, any, T>;
  public state: RequestState;
  public requestTime: number

  constructor(url: string,
              method: FetchMethod,
              responseFilterChain: FilterChain<Response, any, T>,
              options?: ApiOptions<T>,
              body?: BodyInit) {
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
        if (this.state === 'PENDING' || this.state === 'FILTERING') {
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
  public onfilterstep(i: number, filterCount: number)  {
    this.options?.callbacks?.onfilterstep?.(this, i, filterCount)
  }

  public async fetch(): Promise<T> {
    this.onstart()
    this.startUpdateInterval()

    const response = await this.makeRequest()

    if (!response.ok) throw this.handleHttpError(response)

    this.setState('FILTERING')
    const filtered = await this.applyFilters(response)

    this.setState('SUCCESS')
    return filtered
  }

  private async makeRequest(): Promise<Response> {
    try {
      this.beforeEachRequestConfig()
      return await apiFetch(this)
    } catch (error: any) {
      throw this.handleNetworkError(error)
    }
  }

  private async applyFilters(response: Response): Promise<T> {
    try {
      return await this.responseFilterChain.apply(
          response,
          (i, filterCount) => this.onfilterstep(i, filterCount)
      )
    } catch (error: any) {
      throw this.handleFilterError(error)
    }

  }

  private handleHttpError(response: Response) {
    const requestError = new RequestError('HTTP', response.status, response.statusText)
    this.onerror(requestError)
    return requestError
  }

  private handleNetworkError(error: any) {
    const requestError = new RequestError('NETWORK', 0, error)
    this.onerror(requestError)
    return requestError
  }

  private handleFilterError(error: any) {
    const requestError = new RequestError('FILTER', 0, error)
    this.onerror(requestError)
    return requestError
  }

  private beforeEachRequestConfig() {
    if (GlobalConfig.beforeEach) GlobalConfig.beforeEach(this)
    GlobalConfig.beforeEachMatching?.filter(matcher =>
        ("match" in matcher && matcher.match(this)) ||
        ("matchEndpoint" in matcher && matcher.matchEndpoint === new URL(this.url).pathname) ||
        ("matchUrl" in matcher && matcher.matchUrl === this.url) ||
        ("matchMethod" in matcher && matcher.matchMethod === this.method)
    )?.forEach(matcher =>
        matcher.process(this)
    );
  }

  public onerror(requestError: RequestError) {
    this.setState('ERROR')

    if (this.options?.callbacks?.onerror) {
      this.options.callbacks.onerror(this, requestError, GlobalConfig.errorHandler)
    } else {
      if (GlobalConfig.errorHandler?.catchAll) GlobalConfig.errorHandler.catchAll(requestError)
      GlobalConfig.errorHandler?.catch?.filter(matcher =>
          ("match" in matcher && matcher.match(requestError)) ||
          ("matchErrorType" in matcher && matcher.matchErrorType === requestError.type) ||
          ("matchHttpCode" in matcher && requestError.type === 'HTTP' && matcher.matchHttpCode === requestError.status) ||
          ("matchStatusText" in matcher && matcher.matchStatusText === requestError.statusText)
      )?.forEach(matcher =>
          matcher.process(requestError)
      );
    }
  }
}
