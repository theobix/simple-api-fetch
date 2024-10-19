import {ApiRequest} from "./api-request-types";

export default async function apiFetch(request: ApiRequest<any>): Promise<Response> {
  const processedBody = request.options?.bodyPreprocessing ?
    await request.options.bodyPreprocessing.apply(request.body) :
    JSON.stringify(request.body)

  return await fetch('/api/' + request.url, {
      ...{
        method: request.method,
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: processedBody
      },
      ...request.options?.fetchOptions
    }
  )
}
