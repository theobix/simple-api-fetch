import {FilterChain} from "../api-filter-chain/filter-chain";
import {RequestError} from "../api-fetch/api-request-types";

export type GlobalApiConfigOptions = {
    bodyPreprocessing: FilterChain<BodyInit, any, BodyInit>,
    errorHandler?: (error: RequestError) => void,
    urlProcessor: FilterChain<string, any, string>
    authentication?: () => string
}

export const GlobalApiConfig: GlobalApiConfigOptions = {
    bodyPreprocessing: FilterChain.Create<BodyInit>(),
    urlProcessor: FilterChain.Create<string>(),
}