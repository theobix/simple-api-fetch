import { FilterChain } from "../api-filter-chain/filter-chain";
import { RequestError } from "../api-fetch/api-request-types";
import { AuthenticationHeader } from "./authentication";
export type GlobalApiConfigOptions = {
    bodyPreprocessing: FilterChain<BodyInit, any, BodyInit>;
    errorHandler?: (error: RequestError) => void;
    urlProcessor: FilterChain<string, any, string>;
    authentication?: () => AuthenticationHeader;
};
export declare const GlobalApiConfig: GlobalApiConfigOptions;
