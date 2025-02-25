import { RequestError } from './api-request-types'
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

        GlobalConfig.errorHandler = jest.fn()

        // Create a new instance of ApiRequestImpl for each test
        apiRequest = new ApiRequestImpl(
            'https://example.com',
            'GET',
            mockFilterChain as any, // Type cast for simplicity
            {
                callbacks: mockCallbacks,
                updateInterval: 100
            }
        )
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
            const mockError= 'Filter Error'
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
})