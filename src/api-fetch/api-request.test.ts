import {ApiRequest, FetchMethod, RequestError} from './api-request-types'
import apiFetch from './api-fetch'
import { FilterChain } from '../api-filter-chain/filter-chain'
import { GlobalConfig } from '../config/global-config'
import ApiRequestImpl from "./api-request";

// Mock dependencies
jest.mock('./api-fetch')
jest.mock('../config/global-config')

describe('ApiRequestImpl', () => {
    let apiRequest: ApiRequestImpl<any>
    let mockFilterChain: jest.Mocked<Partial<FilterChain<Response, any, any>>>
    let mockFilter = jest.fn()
    let mockCallbacks: any

    beforeEach(() => {
        // Mock the callback functions
        mockCallbacks = {
            onstart: jest.fn(),
            onstatechange: jest.fn(),
            onupdate: jest.fn(),
            onerror: jest.fn(),
            onfilterstep: jest.fn()
        }

        mockFilterChain = { apply: mockFilter }

        // Create a new instance of ApiRequestImpl for each test
        apiRequest = new ApiRequestImpl(
            'https://www.example.com/api/test',
            'GET',
            mockFilterChain as any, // Type cast for simplicity
            {
                callbacks: mockCallbacks,
                updateInterval: 100
            }
        )

        GlobalConfig.beforeEach = undefined
        GlobalConfig.beforeEachMatching = undefined
        GlobalConfig.errorHandler = undefined
    })

    afterEach(() => {
        jest.clearAllMocks()
    })

    describe('fetch', () => {
        it('should call callbacks', async () => {
            const mockResponse = {ok: true, status: 200, statusText: 'OK'} as Response
            (apiFetch as jest.Mock).mockResolvedValue(mockResponse)

            await apiRequest.fetch()

            expect(mockCallbacks.onstart).toHaveBeenCalledTimes(1)
            expect(mockCallbacks.onstatechange).toHaveBeenCalledTimes(2)
        })

        it('should call onupdate on right intervals', async () => {
            const mockResponse = {ok: true, status: 200, statusText: 'OK'} as Response
            (apiFetch as jest.Mock).mockResolvedValue(mockResponse)

            mockFilter.mockImplementation(async () => {
                await new Promise(resolve => setTimeout(resolve, 1000));
            })

            await apiRequest.fetch()

            expect(mockCallbacks.onupdate.mock.calls.length).toBeGreaterThan(8)
        })

        it('should call onfilterstep on filter changing', async () => {
            const mockResponse = {ok: true, status: 200, statusText: 'OK'} as Response
            (apiFetch as jest.Mock).mockResolvedValue(mockResponse)
            const filterCount = 2

            mockFilter.mockImplementation(async (_: Response, callback: (i: number, filterCount: number) => void) => {
                for (let i = 0; i < filterCount; i++) {
                    callback(i, filterCount)
                }
            })

            await apiRequest.fetch()

            expect(mockCallbacks.onfilterstep).toHaveBeenCalledTimes(filterCount)
        })

        it('should handle HTTP errors and set state to ERROR', async () => {
            const mockResponse = {ok: false, status: 500, statusText: 'Internal Server Error'} as Response
            (apiFetch as jest.Mock).mockResolvedValue(mockResponse)

            await expect(apiRequest.fetch()).rejects.toThrow(RequestError)
            await expect(apiRequest.fetch()).rejects.toThrow(new RequestError('HTTP', 500, 'Internal Server Error'))

            expect(apiRequest.state).toBe('ERROR')
            expect(mockCallbacks.onerror).toHaveBeenCalled()
        })

        it('should apply filters to the response and set state to SUCCESS', async () => {
            const mockResponse = {ok: true, status: 200, statusText: 'OK'} as Response
            (apiFetch as jest.Mock).mockResolvedValue(mockResponse)
            const mockFilteredResponse = {data: 'filtered'}

            mockFilter.mockResolvedValue(mockFilteredResponse)

            const result = await apiRequest.fetch()

            expect(mockFilterChain.apply).toHaveBeenCalledWith(mockResponse, expect.any(Function))
            expect(apiRequest.state).toBe('SUCCESS')
            expect(result).toEqual(mockFilteredResponse)
        })

        it('should handle filter errors and set state to ERROR', async () => {
            const mockResponse = {ok: true, status: 200, statusText: 'OK'} as Response
            (apiFetch as jest.Mock).mockResolvedValue(mockResponse)
            const mockError = 'Filter Error'
            mockFilter.mockRejectedValue(mockError)

            await expect(apiRequest.fetch()).rejects.toThrow(RequestError)
            await expect(apiRequest.fetch()).rejects.toThrow(new RequestError('FILTER', 0, mockError))
            expect(apiRequest.state).toBe('ERROR')
            expect(mockCallbacks.onerror).toHaveBeenCalled()
        })

        it('should handle network error and set state to ERROR', async () => {
            const mockError = 'Network Error' as string
            (apiFetch as jest.Mock).mockRejectedValue(mockError)

            await expect(apiRequest.fetch()).rejects.toThrow(RequestError)
            await expect(apiRequest.fetch()).rejects.toThrow(new RequestError('NETWORK', 0, mockError))
        })
    })

    describe('beforeEach', () => {

        beforeEach(() => {
            apiRequest = new ApiRequestImpl(
                'https://www.example.com/api/test',
                'GET',
                FilterChain.Create()
            );

            (apiFetch as jest.Mock).mockReturnValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                json: jest.fn().mockResolvedValue({ data: 'test' }),
            })
        })

        it('should apply beforeEach function to modify the request', async () => {
            const mockBeforeEach =
                jest.fn((req: ApiRequest<any>) => req.method = 'POST');
            GlobalConfig.beforeEach = mockBeforeEach;

            await apiRequest.fetch();

            // Ensure beforeEach was called and the request method was modified
            expect(mockBeforeEach).toHaveBeenCalledWith(apiRequest);
            expect(apiFetch).toHaveBeenCalledWith(expect.objectContaining({
                url: apiRequest.url,
                method: 'POST'
            }));
        })

        it('should apply beforeEachMatching to modify the request when a match is found', async () => {
            const mockProcess = jest.fn(
                (req: ApiRequest<any>) => req.body = "processed");
            const mockMatcher = {
                match: jest.fn((req: ApiRequest<any>) => req.url === 'https://www.example.com/api/test'),
                process: mockProcess
            };
            GlobalConfig.beforeEachMatching = [mockMatcher]; // Mock beforeEachMatching

            await apiRequest.fetch()

            // Ensure the matcher was called and process was applied
            expect(mockMatcher.match).toHaveBeenCalledWith(apiRequest);
            expect(mockProcess).toHaveBeenCalledWith(apiRequest);
            expect(apiFetch).toHaveBeenCalledWith(expect.objectContaining({
                url: apiRequest.url,
                body: 'processed' // The request should have been processed
            }));
        });

        it('should apply beforeEachMatching when "matchUrl" matches request', async () => {
            const mockProcess = jest.fn(
                (req: ApiRequest<any>) => req.body = "processed");
            const mockMatcher = {
                matchUrl: 'https://www.example.com/api/test',
                process: mockProcess
            };
            GlobalConfig.beforeEachMatching = [mockMatcher];

            await apiRequest.fetch()

            expect(mockProcess).toHaveBeenCalledWith(apiRequest);
            expect(apiFetch).toHaveBeenCalledWith(expect.objectContaining({
                url: apiRequest.url,
                body: 'processed'
            }));
        });

        it('should apply beforeEachMatching when "matchEndpoint" matches request', async () => {
            const mockProcess = jest.fn(
                (req: ApiRequest<any>) => req.body = "processed");
            const mockMatcher = {
                matchEndpoint: '/api/test',
                process: mockProcess
            };
            GlobalConfig.beforeEachMatching = [mockMatcher];

            await apiRequest.fetch()

            expect(mockProcess).toHaveBeenCalledWith(apiRequest);
            expect(apiFetch).toHaveBeenCalledWith(expect.objectContaining({
                url: apiRequest.url,
                body: 'processed'
            }));
        });

        it('should apply beforeEachMatching when "matchMethod" matches request', async () => {
            const mockProcess = jest.fn(
                (req: ApiRequest<any>) => req.body = "processed");
            const mockMatcher = {
                matchMethod: 'GET' as FetchMethod,
                process: mockProcess
            };
            GlobalConfig.beforeEachMatching = [mockMatcher];

            await apiRequest.fetch()

            expect(mockProcess).toHaveBeenCalledWith(apiRequest);
            expect(apiFetch).toHaveBeenCalledWith(expect.objectContaining({
                url: apiRequest.url,
                body: 'processed'
            }));
        });

        it('should apply multiple beforeEachMatching rules when multiple matchers match', async () => {
            const mockProcess1 = jest.fn(
                (req: ApiRequest<any>) => req.body = "processed");
            const mockProcess2 = jest.fn(
                (req: ApiRequest<any>) => req.body += "_2");
            GlobalConfig.beforeEachMatching = [
                { matchEndpoint: '/api/test', process: mockProcess1 },
                { matchMethod: 'GET', process: mockProcess2 }
            ];

            await apiRequest.fetch()

            expect(mockProcess1).toHaveBeenCalledWith(apiRequest);
            expect(mockProcess2).toHaveBeenCalledWith(apiRequest);
            expect(apiFetch).toHaveBeenCalledWith(expect.objectContaining({
                url: apiRequest.url,
                body: 'processed_2'
            }));
        });

        it('should not apply beforeEachMatching if no match is found', async () => {
            const mockProcess = jest.fn();
            const mockMatcher = {
                matchUrl: '/different-url',
                process: mockProcess
            };
            GlobalConfig.beforeEachMatching = [mockMatcher];

            await apiRequest.fetch()

            expect(mockMatcher.matchUrl).not.toBe(apiRequest.url);
            expect(mockProcess).not.toHaveBeenCalled();
            expect(apiFetch).toHaveBeenCalledWith(expect.objectContaining({
                url: apiRequest.url
            }));
        });
    })

    describe('errorHandling', () => {

        beforeEach(() => {
            GlobalConfig.errorHandler = { catch: undefined, catchAll: undefined };
            (apiFetch as jest.Mock).mockReturnValue({
                ok: false,
                status: 400,
                statusText: 'Bad Request',
                json: null,
            })

            apiRequest = new ApiRequestImpl(
                'https://www.example.com/api/test',
                'GET',
                FilterChain.Create(),
            );
        })

        it('should call catchAll if defined', async () => {
            const mockProcess = jest.fn()
            GlobalConfig.errorHandler = { catchAll: mockProcess };
            (apiFetch as jest.Mock).mockRejectedValue('NETWORK ERROR')

            await expect(apiRequest.fetch()).rejects.toThrow('NETWORK ERROR')

            expect(mockProcess).toHaveBeenCalled();
        });

        it('should call catch when a match is found', async () => {
            const mockProcess = jest.fn()
            GlobalConfig.errorHandler!.catch = [{
                match: (error: RequestError) => error.type === 'HTTP',
                process: mockProcess
            }]

            await expect(apiRequest.fetch()).rejects.toThrow('Bad Request')

            expect(mockProcess).toHaveBeenCalled();
        });

        it('should call catch when a "matchErrorType" matches error', async () => {
            const mockProcess = jest.fn()
            const mockFilterChain = { apply: jest.fn().mockRejectedValue('FILTER ERROR') }
            apiRequest = new ApiRequestImpl<any>('', 'GET', mockFilterChain as any);
            (apiFetch as jest.Mock).mockReturnValue({
                ok: true,
                status: 200,
                statusText: 'OK',
                json: null,
            })
            GlobalConfig.errorHandler!.catch = [{ matchErrorType: 'FILTER', process: mockProcess }]

            await expect(apiRequest.fetch()).rejects.toThrow('FILTER ERROR')

            expect(mockProcess).toHaveBeenCalled();
        });

        it('should call catch when a "matchHttpCode" matches error', async () => {
            const mockProcess = jest.fn()
            GlobalConfig.errorHandler!.catch = [{ matchHttpCode: 400, process: mockProcess }]

            await expect(apiRequest.fetch()).rejects.toThrow('Bad Request')

            expect(mockProcess).toHaveBeenCalled();
        });

        it('should call catch when a "matchStatusText" matches error', async () => {
            const mockProcess = jest.fn()
            GlobalConfig.errorHandler!.catch = [{ matchStatusText: "Bad Request", process: mockProcess }]

            await expect(apiRequest.fetch()).rejects.toThrow('Bad Request')

            expect(mockProcess).toHaveBeenCalled();
        });

        it('should NOT call catch when a no match is found', async () => {
            const mockProcess = jest.fn()
            GlobalConfig.errorHandler!.catch = [{ matchHttpCode: 500, process: mockProcess }]

            await expect(apiRequest.fetch()).rejects.toThrow('Bad Request')

            expect(mockProcess).not.toHaveBeenCalled();
        });

    })
})