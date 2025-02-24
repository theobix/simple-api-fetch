import {GlobalApiConfig} from "../config/global-config";
import {FilterChain} from "../api-filter-chain/filter-chain";
import apiFetch from "./api-fetch";
import {ApiRequest} from "./api-request-types";
import ApiRequestImpl from "./api-request";

describe('apiFetch', () => {
    let mockRequest: ApiRequest<Response>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockRequest = new ApiRequestImpl(
            'https://api.example.com/data',
            'GET',
            FilterChain.Create(),
            {
                ignoreAuthentication: false,
            },
            'notProcessedBody'
        )

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: jest.fn().mockResolvedValue({ data: 'test' }),
        });

        GlobalApiConfig.urlProcessor = FilterChain.Create()
        GlobalApiConfig.bodyPreprocessing = FilterChain.Create()
    });

    it('should fetch with the correct parameters', async () => {
        await apiFetch(mockRequest);

        expect(fetch).toHaveBeenCalledWith(mockRequest.url, {
            method: mockRequest.method,
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: 'notProcessedBody',
            ignoreAuthentication: false
        });
    });

    it('should handle global body preprocessing', async () => {
        GlobalApiConfig.bodyPreprocessing = FilterChain.Create().then(
            jest.fn().mockResolvedValue('processedBody'),
        )

        mockRequest.body = 'rawBody';

        await apiFetch(mockRequest);

        expect(fetch).toHaveBeenCalledWith(mockRequest.url, expect.objectContaining({
            body: 'processedBody'
        }));
    });

    it('should add global authentication header if defined', async () => {
        GlobalApiConfig.setAuthentication = jest.fn().mockReturnValue('Bearer 12345');

        await apiFetch(mockRequest);

        expect(fetch).toHaveBeenCalledWith(mockRequest.url, expect.objectContaining({
            headers: { 'Authentication': 'Bearer 12345' },
        }));
    });

    it('should not add authentication header if ignoreAuthentication is true', async () => {
        GlobalApiConfig.setAuthentication = jest.fn().mockReturnValue('Bearer 12345');

        if (mockRequest.options) mockRequest.options.ignoreAuthentication = true;

        await apiFetch(mockRequest);

        expect(fetch).toHaveBeenCalledWith(mockRequest.url, expect.objectContaining({
            headers: undefined, // No authentication header should be included
        }));
    });

    it('should preprocess URL using GlobalApiConfig', async () => {
        mockRequest.url = 'https://api.example.com/data';

        GlobalApiConfig.urlProcessor = FilterChain.Create().then(
            jest.fn().mockResolvedValue(mockRequest.url + '/api')
        )

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: jest.fn().mockResolvedValue({ data: 'test' }),
        });

        await apiFetch(mockRequest);

        expect(fetch).toHaveBeenCalledWith(mockRequest.url + '/api', expect.anything());
    });
});
