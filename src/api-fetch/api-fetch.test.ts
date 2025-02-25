import {GlobalApiConfig} from "../config/global-config";
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

        GlobalApiConfig.urlProcessor = FilterChain.Create()
        GlobalApiConfig.bodyPreprocessing = FilterChain.Create()
        GlobalApiConfig.beforeEach = undefined
        GlobalApiConfig.beforeEachMatching = undefined
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
        GlobalApiConfig.setAuthorization = jest.fn().mockReturnValue('Bearer 12345');

        await apiFetch(mockRequest);

        expect(fetch).toHaveBeenCalledWith(mockRequest.url, expect.objectContaining({
            headers: { 'Authorization': 'Bearer 12345' },
        }));
    });

    it('should not add authentication header if ignoreAuthentication is true', async () => {
        GlobalApiConfig.setAuthorization = jest.fn().mockReturnValue('Bearer 12345');

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

    it('should send the correct Authorization header when setAuthorization is defined', async () => {
        const mockAuthorization = 'Bearer token';
        GlobalApiConfig.setAuthorization = jest.fn(() => mockAuthorization); // Mock setAuthorization to return a token

        await apiFetch(mockRequest);

        // Check that the Authorization header was set correctly
        expect(fetch).toHaveBeenCalledWith(mockRequest.url, expect.objectContaining({
            headers: expect.objectContaining({
                'Authorization': mockAuthorization
            })
        }));
    });

    it('should not send an Authorization header if setAuthorization returns null', async () => {
        GlobalApiConfig.setAuthorization = jest.fn(() => null); // Mock setAuthorization to return null

        await apiFetch(mockRequest);

        // Check that the Authorization header was not set
        expect(fetch).toHaveBeenCalledWith(mockRequest.url, expect.objectContaining({
            headers: expect.not.objectContaining({
                'Authorization': expect.any(String)
            })
        }));
    });

    it('should apply beforeEach function to modify the request', async () => {
        const mockBeforeEach = jest.fn((req: ApiRequest<any>) => ({
            ...req,
            method: 'POST' as FetchMethod
        }));
        GlobalApiConfig.beforeEach = mockBeforeEach; // Mock beforeEach

        await apiFetch(mockRequest);

        // Ensure beforeEach was called and the request method was modified
        expect(mockBeforeEach).toHaveBeenCalledWith(mockRequest);
        expect(fetch).toHaveBeenCalledWith(mockRequest.url, expect.objectContaining({
            method: 'POST' // The method should have been changed to 'PUT'
        }));
    });

    it('should apply beforeEachMatching to modify the request when a match is found', async () => {
        const mockProcess = jest.fn((req: ApiRequest<any>) => ({
            ...req,
            body: 'processed' // Mark the request as processed
        } as ApiRequest<any>));
        const mockMatcher = {
            match: jest.fn((req: ApiRequest<any>) => req.url === 'https://www.example.com/api/test'),
            process: mockProcess
        };
        GlobalApiConfig.beforeEachMatching = [mockMatcher]; // Mock beforeEachMatching

        await apiFetch(mockRequest);

        // Ensure the matcher was called and process was applied
        expect(mockMatcher.match).toHaveBeenCalledWith(mockRequest);
        expect(mockProcess).toHaveBeenCalledWith(mockRequest);
        expect(fetch).toHaveBeenCalledWith(mockRequest.url, expect.objectContaining({
            body: 'processed' // The request should have been processed
        }));
    });

    it('should apply beforeEachMatching when "matchUrl" matches request', async () => {
        const mockProcess = jest.fn((req: ApiRequest<any>) => (
            { ...req, body: 'processed' } as ApiRequest<any>
        ));
        const mockMatcher = {
            matchUrl: 'https://www.example.com/api/test',
            process: mockProcess
        };
        GlobalApiConfig.beforeEachMatching = [mockMatcher];

        await apiFetch(mockRequest);

        expect(mockProcess).toHaveBeenCalledWith(mockRequest);
        expect(fetch).toHaveBeenCalledWith(mockRequest.url, expect.objectContaining({
            body: 'processed'
        }));
    });

    it('should apply beforeEachMatching when "matchEndpoint" matches request', async () => {
        const mockProcess = jest.fn((req: ApiRequest<any>) => (
            { ...req, body: 'processed' } as ApiRequest<any>
        ));
        const mockMatcher = {
            matchEndpoint: '/api/test',
            process: mockProcess
        };
        GlobalApiConfig.beforeEachMatching = [mockMatcher];

        await apiFetch(mockRequest);

        expect(mockProcess).toHaveBeenCalledWith(mockRequest);
        expect(fetch).toHaveBeenCalledWith(mockRequest.url, expect.objectContaining({
            body: 'processed'
        }));
    });

    it('should apply beforeEachMatching when "matchMethod" matches request', async () => {
        const mockProcess = jest.fn((req: ApiRequest<any>) => (
            { ...req, body: 'processed' } as ApiRequest<any>)
        );
        const mockMatcher = {
            matchMethod: 'GET' as FetchMethod,
            process: mockProcess
        };
        GlobalApiConfig.beforeEachMatching = [mockMatcher];

        await apiFetch(mockRequest);

        expect(mockProcess).toHaveBeenCalledWith(mockRequest);
        expect(fetch).toHaveBeenCalledWith(mockRequest.url, expect.objectContaining({
            body: 'processed'
        }));
    });

    it('should apply multiple beforeEachMatching rules when multiple matchers match', async () => {
        const mockProcess1 = jest.fn((req: ApiRequest<any>) => (
            { ...req, body: 'processed' } as ApiRequest<any>
        ));
        const mockProcess2 = jest.fn((req: ApiRequest<any>) => (
            { ...req, body: req.body + "_2" } as ApiRequest<any>
        ));

        GlobalApiConfig.beforeEachMatching = [
            { matchEndpoint: '/api/test', process: mockProcess1 },
            { matchMethod: 'GET', process: mockProcess2 }
        ];

        await apiFetch(mockRequest);

        expect(mockProcess1).toHaveBeenCalledWith(mockRequest);
        expect(mockProcess2).toHaveBeenCalledWith(expect.objectContaining({ body: 'processed' }));
        expect(fetch).toHaveBeenCalledWith(mockRequest.url, expect.objectContaining({
            body: 'processed_2'
        }));
    });

    it('should not apply beforeEachMatching if no match is found', async () => {
        const mockProcess = jest.fn();
        const mockMatcher = {
            matchUrl: '/different-url',
            process: mockProcess
        };
        GlobalApiConfig.beforeEachMatching = [mockMatcher];

        await apiFetch(mockRequest);

        expect(mockMatcher.matchUrl).not.toBe(mockRequest.url);
        expect(mockProcess).not.toHaveBeenCalled();
        expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
            body: expect.anything()
        }));
    });
});
