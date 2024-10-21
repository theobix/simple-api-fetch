import {FilterChain} from './filter-chain';
describe('FilterChain', () => {
    it('should process input with a single filter', async () => {
        const filterChain = FilterChain.Create<number>()
            .then(async input => input + 1);

        const result = await filterChain.apply(1);
        expect(result).toBe(2);
    });

    it('should process input with multiple filters in sequence', async () => {
        const filterChain = FilterChain.Create<number>()
            .then(async (input) => input + 1)
            .then(async (input) => input * 2)
            .then(async (input) => input - 2);

        const result = await filterChain.apply(1);
        expect(result).toBe(2);
    });

    it('should handle errors and retry when specified', async () => {
        let attempt = 0;
        const filterChain = FilterChain.Create<number>()
            .then(async (input) => {
                attempt++;
                if (attempt < 3) throw new Error('Temporary failure');
                return input + 1;
            })
            .retry(2);

        const result = await filterChain.apply(1);
        expect(result).toBe(2);
        expect(attempt).toBe(3); // It should try 3 times
    });

    it('should fallback to a value if the main filter fails', async () => {
        const filterChain = FilterChain.Create<number>()
            .then(async (): Promise<number> => {
                throw new Error('Failure');
            })
            .fallback(42);

        const result = await filterChain.apply(1);
        expect(result).toBe(42);
    });

    it('should use a fallback filter if the main filter fails', async () => {
        const filterChain = FilterChain.Create<number>()
            .then(async (): Promise<number> => {
                throw new Error('Failure');
            })
            .fallbackFilter(async input => input * 2);

        const result = await filterChain.apply(5);
        expect(result).toBe(10);
    });

    it('should execute error filters in sequence', async () => {
        let errorHandled = false;
        const filterChain = FilterChain.Create<number>()
            .then(async (): Promise<number> => {
                throw new Error('Test error');
            })
            .error(async (err) => {
                if (err.message === 'Test error') errorHandled = true;
            });

        await expect(filterChain.apply(5)).rejects.toThrow('Test error');
        expect(errorHandled).toBe(true);
    });

    it('should invoke onFilterChanged callback during processing', async () => {
        const mockCallback = jest.fn();
        const filterChain = FilterChain.Create<number>()
            .then(async input => input + 1)
            .then(async input => input * 2);

        await filterChain.apply(1, mockCallback);
        expect(mockCallback).toHaveBeenCalledTimes(2);
        expect(mockCallback).toHaveBeenNthCalledWith(1, 0, 2);
        expect(mockCallback).toHaveBeenNthCalledWith(2, 1, 2);
    });

    it('should respect constraints added to the filter chain', async () => {
        const filterChain = FilterChain.Create<number>()
            .then(async input => input + 1)
            .constraint(value => value > 5, new Error('Value exceeds 5'));

        await expect(filterChain.apply(5)).rejects.toThrow('Value exceeds 5');
        const result = await filterChain.apply(4);
        expect(result).toBe(5);
    });
});
