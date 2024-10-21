type FilterFunction<IN, OUT> = (input: IN) => Promise<OUT>;
type ErrorType = [string, any];
type ErrorCallbacks<IN, OUT> = {
    RETRY: (maxTries: number) => ErrorType;
    FALLBACK: (output: OUT) => ErrorType;
    FALLBACK_FILTER: (filter: FilterFunction<IN, OUT>) => ErrorType;
};
type ErrorFilterFunction<IN, OUT> = (cause: any, callbacks: ErrorCallbacks<IN, OUT>) => Promise<any> | Promise<ErrorType>;
export declare class FilterChain<T, IN, OUT> {
    private filters;
    static Create<T>(): FilterChain<T, T, T>;
    then<U>(filter: FilterFunction<OUT, U>): FilterChain<T, OUT, U>;
    error(errorFilter: ErrorFilterFunction<IN, OUT>): FilterChain<T, IN, OUT>;
    retry(max: number): FilterChain<T, IN, OUT>;
    fallback(fallback: OUT): FilterChain<T, IN, OUT>;
    fallbackFilter(fallbackFilter: FilterFunction<IN, OUT>): FilterChain<T, IN, OUT>;
    constraint(constraint: (value: OUT) => boolean, error?: any): this;
    apply(input: T, onFilterChanged?: (i: number, filterCount: number) => void): Promise<OUT>;
}
export {};
