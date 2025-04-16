import {ApiRequest} from "./api-request-types";
import {GlobalConfig} from "../config/global-config";

export default async function apiFetch(request: ApiRequest<any>): Promise<Response> {
    const url = await preprocessUrl(request)
    return await fetch(url, {
        ...{
            method: request.method,
            mode: 'cors', // no-cors, *cors, same-origin
            cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
            credentials: 'same-origin', // include, *same-origin, omit
            redirect: 'follow', // manual, *follow, error
            referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
            body: await preprocessBody(request),
            headers: getAuthenticationHeader(request)
        },
        ...request.options
    })
}

async function preprocessUrl(request: ApiRequest<any>) {
    return await GlobalConfig.urlProcessor.apply(request.url)
}

async function preprocessBody(request: ApiRequest<any>): Promise<BodyInit | undefined> {
    if (!request.body) return undefined

    const { bodyPreprocessing: globalPreprocessing } = GlobalConfig;
    const { bodyPreprocessing: requestPreprocessing } = request.options || {};

    let preprocessedBody = await globalPreprocessing.apply(request.body)
    if (requestPreprocessing) preprocessedBody = await requestPreprocessing.apply(preprocessedBody)

    return preprocessedBody
}

function getAuthenticationHeader(request: ApiRequest<any>): HeadersInit | undefined {
    if (!GlobalConfig.setAuthorization || request.options?.ignoreAuthentication) {
        return undefined
    }

    const authorization = GlobalConfig.setAuthorization()
    if (authorization === null) return undefined

    return { 'Authorization': authorization }
}