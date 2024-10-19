type FilterFunction<IN, OUT> = (input: IN) => Promise<OUT>
type ErrorType = [string, any]
type ErrorCallbacks<IN, OUT> = {
  RETRY: (maxTries: number) => ErrorType
  FALLBACK: (output: OUT) => ErrorType,
  FALLBACK_FILTER: (filter: FilterFunction<IN, OUT>) => ErrorType
}
type ErrorFilterFunction<IN, OUT> = (cause: any, callbacks: ErrorCallbacks<IN, OUT>) => Promise<any> | Promise<ErrorType>

interface FilterNodeInterface<IN, OUT> {
  addErrorFilter: (errorFilter: ErrorFilterFunction<IN, OUT>) => void
  process: FilterFunction<IN, OUT>
}

class FilterNode<IN, OUT> implements FilterNodeInterface<IN, OUT> {
  private readonly filter: FilterFunction<IN, OUT>
  private errorFilters: ErrorFilterFunction<IN, OUT>[] = []

  private readonly CALLBACKS: ErrorCallbacks<IN, OUT> = {
    RETRY: (maxTries: number) => ['_RETRY', maxTries],
    FALLBACK: (output: OUT) => ['_FALLBACK', output],
    FALLBACK_FILTER: (filter: FilterFunction<IN, OUT>) => ['_FALLBACK_FILTER', filter]
  } as const

  constructor(filter: FilterFunction<IN, OUT>) {
    this.filter = filter
  }

  public addErrorFilter(errorFilter: ErrorFilterFunction<IN, OUT>) {
    this.errorFilters.push(errorFilter)
  }

  public async process(input: IN, retries = 0): Promise<OUT> {
    try {
      return await this.filter(input)

    } catch (thrown: any) {
      let prevOutput: any = thrown
      for (const errorFilter of this.errorFilters) {
        prevOutput = await errorFilter(prevOutput, this.CALLBACKS)
        if (Array.isArray(prevOutput) && prevOutput.length === 2) {
          if (prevOutput[0] === '_RETRY' && retries < prevOutput[1])
            return await this.process(input, retries + 1)
          else if (prevOutput[0] === '_FALLBACK_FILTER') {
            const fallbackFilter: FilterFunction<IN, OUT> = prevOutput[1]
            return await fallbackFilter(input)
          } else if (prevOutput[0] === '_FALLBACK')
            return prevOutput[1]
        }
      }
      throw thrown
    }
  }
}

export class FilterChain<T, IN, OUT> {
  private filters: Array<FilterNode<any, any>> = [];

  public static Create<T>(): FilterChain<T, T, T> {
    return new FilterChain<T, T, T>()
  }

  then<U>(filter: FilterFunction<OUT, U>): FilterChain<T, OUT, U> {
    this.filters.push(new FilterNode(filter));
    return this as unknown as FilterChain<T, OUT, U>;
  }

  error(errorFilter: ErrorFilterFunction<IN, OUT>): FilterChain<T, IN, OUT> {
    if (this.filters.length !== 0)
      this.filters[this.filters.length - 1].addErrorFilter(errorFilter)
    return this
  }

  retry(max: number): FilterChain<T, IN, OUT> {
    this.error(async (_, c) => c.RETRY(max))
    return this
  }

  fallback(fallback: OUT): FilterChain<T, IN, OUT> {
    this.error(async (_, c) => c.FALLBACK(fallback))
    return this
  }

  fallbackFilter(fallbackFilter: FilterFunction<IN, OUT>): FilterChain<T, IN, OUT> {
    this.error(async (_, c) => c.FALLBACK_FILTER(fallbackFilter))
    return this
  }

  async apply(input: T, onFilterChanged?: (i: number, filterCount: number) => void): Promise<OUT> {
    let prevOutput: any = input
    for (const [i, filter] of this.filters.entries()) {
      onFilterChanged?.(i, this.filters.length)
      prevOutput = await filter.process(prevOutput)
    }
    return prevOutput
  }
}
