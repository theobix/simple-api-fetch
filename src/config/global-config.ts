import {FilterChain} from "../api-filter-chain/filter-chain";
import {ApiRequest, FetchMethod, RequestError} from "../api-fetch/api-request-types";
import {AuthorizationHeader} from "../api-fetch/authorization";

type ApiRequestProcessor = (request: ApiRequest<any>) => ApiRequest<any>
type ApiRequestProcessorMatcher = Array<(
    { match: (request: ApiRequest<any>) => boolean } |
    { matchEndpoint: string } |
    { matchUrl: string } |
    { matchMethod: FetchMethod }
) & { process: ApiRequestProcessor }>

export type ApiGlobalConfigOptions = {
    bodyPreprocessing: FilterChain<BodyInit, any, BodyInit>,
    errorHandler?: (error: RequestError) => void,
    urlProcessor: FilterChain<string, any, string>
    setAuthorization?: () => (AuthorizationHeader | null)
    beforeEach?: ApiRequestProcessor,
    beforeEachMatching?: ApiRequestProcessorMatcher,
}

export const GlobalConfig: ApiGlobalConfigOptions = {
    bodyPreprocessing: FilterChain.Create<BodyInit>(),
    urlProcessor: FilterChain.Create<string>(),
}