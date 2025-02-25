import {FilterChain} from "../api-filter-chain/filter-chain";
import {ApiRequest, FetchMethod, RequestError, RequestErrorType} from "../api-fetch/api-request-types";
import {AuthorizationHeader} from "../api-fetch/authorization";

type ApiRequestProcessor = (request: ApiRequest<any>) => void
type ApiErrorProcessor = (error: RequestError) => void

type Matcher<T, P> = Array<
    ({ match: (input: T) => boolean } | P) & { process: (input: T) => void }
>;

type ApiRequestMatcherProps =
    | { matchEndpoint: string }
    | { matchUrl: string }
    | { matchMethod: FetchMethod };

type ApiErrorMatcherProps =
    | { matchErrorType: RequestErrorType }
    | { matchHttpCode: number }
    | { matchStatusText: string | any };

type ApiRequestProcessorMatcher = Matcher<ApiRequest<any>, ApiRequestMatcherProps>;
type ApiErrorProcessorMatcher = Matcher<RequestError, ApiErrorMatcherProps>;


export type ApiGlobalConfigOptions = {
    bodyPreprocessing: FilterChain<BodyInit, any, BodyInit>,
    errorHandler?: {
        catchAll?: (error: RequestError) => void,
        catch?: ApiErrorProcessorMatcher
    }
    urlProcessor: FilterChain<string, any, string>
    setAuthorization?: () => (AuthorizationHeader | null)
    beforeEach?: ApiRequestProcessor,
    beforeEachMatching?: ApiRequestProcessorMatcher,
}

export const GlobalConfig: ApiGlobalConfigOptions = {
    bodyPreprocessing: FilterChain.Create<BodyInit>(),
    urlProcessor: FilterChain.Create<string>(),
}