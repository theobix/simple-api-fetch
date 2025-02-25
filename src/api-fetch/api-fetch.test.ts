import {GlobalConfig} from "../config/global-config";
import {FilterChain} from "../api-filter-chain/filter-chain";
import apiFetch from "./api-fetch";
import {ApiRequest, FetchMethod} from "./api-request-types";
import ApiRequestImpl from "./api-request";

describe('apiFetch', () => {
    let mockRequest: ApiRequest<Response>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockRequest = new ApiRequestImpl(
            'https://www.example.com/api/test',
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

        GlobalConfig.urlProcessor = FilterChain.Create()
        GlobalConfig.bodyPreprocessing = FilterChain.Create()
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
        GlobalConfig.bodyPreprocessing = FilterChain.Create().then(
            jest.fn().mockResolvedValue('processedBody'),
        )

        mockRequest.body = 'rawBody';

        await apiFetch(mockRequest);

        expect(fetch).toHaveBeenCalledWith(mockRequest.url, expect.objectContaining({
            body: 'processedBody'
        }));
    });

    it('should add global authentication header if defined', async () => {
        GlobalConfig.setAuthorization = jest.fn().mockReturnValue('Bearer 12345');

        await apiFetch(mockRequest);

        expect(fetch).toHaveBeenCalledWith(mockRequest.url, expect.objectContaining({
            headers: { 'Authorization': 'Bearer 12345' },
        }));
    });

    it('should not add authentication header if ignoreAuthentication is true', async () => {
        GlobalConfig.setAuthorization = jest.fn().mockReturnValue('Bearer 12345');

        if (mockRequest.options) mockRequest.options.ignoreAuthentication = true;

        await apiFetch(mockRequest);

        expect(fetch).toHaveBeenCalledWith(mockRequest.url, expect.objectContaining({
            headers: undefined, // No authentication header should be included
        }));
    });

    it('should preprocess URL using GlobalApiConfig', async () => {
        mockRequest.url = 'https://api.example.com/data';

        GlobalConfig.urlProcessor = FilterChain.Create().then(
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

    it('should send the correct Authorization header when setAuthorization is defined', async () => {
        const mockAuthorization = 'Bearer token';
        GlobalConfig.setAuthorization = jest.fn(() => mockAuthorization); // Mock setAuthorization to return a token

        await apiFetch(mockRequest);

        // Check that the Authorization header was set correctly
        expect(fetch).toHaveBeenCalledWith(mockRequest.url, expect.objectContaining({
            headers: expect.objectContaining({
                'Authorization': mockAuthorization
            })
        }));
    });

    it('should not send an Authorization header if setAuthorization returns null', async () => {
        GlobalConfig.setAuthorization = jest.fn(() => null); // Mock setAuthorization to return null

        await apiFetch(mockRequest);

        // Check that the Authorization header was not set
        expect(fetch).toHaveBeenCalledWith(mockRequest.url, expect.objectContaining({
            headers: expect.not.objectContaining({
                'Authorization': expect.any(String)
            })
        }));
    });
});
