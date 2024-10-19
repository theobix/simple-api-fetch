# Simple API Fetch

**Simple API Fetch** is a TypeScript plugin that simplifies the use of JavaScript's `fetch()` for external APIs. It provides easy-to-use `GET` and `POST` methods, supports a flexible response filter chain for processing responses, and provides flexible options for configuring fetch requests and handling callbacks.

## Features

- **Simplified Fetch Methods:** Intuitive `GET` and `POST` methods for easy interaction with APIs.
- **Flexible Response Processing:** Use customizable filter chains or predefined presets to transform responses.
- **Configurable Request Options:** Fine-tune requests with `ApiOptions`, including custom fetch options, callbacks, and preprocessing.
- **Advanced Error Handling:** Support for retries, fallbacks, and custom error processing in the filter chain.
- **Predefined Presets:** Convenient built-in filter chains for common response types (JSON, text, etc.).
- **TypeScript Support:** Fully typed for a better development experience with type safety.

## Installation

Install **simple-api-fetch** via npm:

```
npm install simple-api-fetch
```

or using yarn:

```
yarn add simple-api-fetch
```

## Usage

### Basic Example with Presets

Here’s how to perform a `GET` request using a predefined filter chain preset to convert the response to JSON:

```
import { simpleFetch } from 'simple-api-fetch';

// Example GET request using the JSON preset
const data = await simpleFetch.get(
  'https://api.example.com/data',
  simpleFetch.filters.JSON // Use the predefined JSON filter chain preset
);

console.log(data);
```

### Using ApiOptions

You can provide custom options to fine-tune the request and handle various stages of the API call. Here's an example with `ApiOptions`:

```
// Example GET request with ApiOptions
const options = {
  fetchOptions: {
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer YOUR_TOKEN',
    },
  },
  callbacks: {
    onstart: (request) => console.log('Request started:', request),
    onerror: (request, error) => console.error('Error occurred:', error),
    onstatechange: (request, state) => console.log('State changed:', state),
    onfilterstep: (request, step, percent) => console.log(`Filter step ${step}: ${percent}% complete`),
    onupdate: (request, elapsedTime) => console.log(`Update interval elapsed: ${elapsedTime} ms`),
  },
  updateInterval: 1000, // Update every 1 second
};

const data = await simpleFetch.get(
  'https://api.example.com/data',
  simpleFetch.filters.JSON,
  options
);

console.log(data);
```

In this example:
- `fetchOptions` allows setting custom headers and other fetch configurations.
- `callbacks` provide hooks to handle different stages of the request lifecycle, such as when the request starts, encounters an error, or completes a filter step.
- `updateInterval` specifies how frequently the `onupdate` callback is triggered.

### Custom Filter Chain with Error Handling

You can create a custom filter chain that adds error handling, retries, or custom transformations, while still using presets as a base:

```
// Example GET request with a custom filter chain and error handling
const filterChain = simpleFetch.filters.JSON // Start with the JSON preset
  .then((json) => json.data) // Extract the 'data' field from the JSON
  .retry(3) // Retry up to 3 times if an error occurs
  .fallback({ data: 'Fallback Data' }) // Use fallback data on failure
  .error(async (error, c) => {
    console.error('Error encountered:', error);
    return c.RETRY(1); // Retry one more time on a specific error
  });

const data = await simpleFetch.get<string>(
  'https://api.example.com/data',
  filterChain
);

console.log(data);
```

### POST Request Using the TEXT Preset

Here’s how to perform a `POST` request with the `TEXT` preset, which converts the response to a string:

```
import { simpleFetch } from 'simple-api-fetch';

// Example POST request using the TEXT preset
async function sendData() {
  const response = await simpleFetch.post<string>(
    'https://api.example.com/submit',
    { name: 'John Doe' }, // Request body
    simpleFetch.filters.TEXT // Use the predefined TEXT filter chain preset
  );

  console.log(response);
}

sendData();
```

## API

### `get<T>(url: string, responseFilterChain: FilterChain<Response, any, T>, options?: ApiOptions<T>): Promise<T>`

- **Parameters:**
  - `url`: The API endpoint URL.
  - `responseFilterChain`: A chain of filters used to process the `Response` object, or one of the predefined presets.
  - `options` (optional): Additional request options such as headers, callbacks, or update intervals.

- **Returns:** A `Promise` resolving to type `T`, which is the processed result.

### `post<T>(url: string, body: any, responseFilterChain: FilterChain<Response, any, T>, options?: ApiOptions<T>): Promise<T>`

- **Parameters:**
  - `url`: The API endpoint URL.
  - `body`: The request body to be sent.
  - `responseFilterChain`: A filter chain for processing the response, or one of the predefined presets.
  - `options` (optional): Additional request options.

- **Returns:** A `Promise` resolving to type `T`, which is the processed response.

## ApiOptions

The `ApiOptions` type provides a flexible way to configure requests:

- **`fetchOptions?: RequestInit`**: Custom fetch configuration, including headers, method, credentials, etc.
- **`updateInterval?: number`**: Interval in milliseconds for triggering the `onupdate` callback.
- **`bodyPreprocessing?: FilterChain<string, any, string>`**: An optional filter chain for preprocessing the request body before sending.
- **`callbacks?: { ... }`**: Optional callback functions for handling various stages of the request lifecycle:
  - **`onstart`**: Called when the request starts.
  - **`onerror`**: Called when an error occurs during the request.
  - **`onstatechange`**: Called when the request state changes (e.g., loading, complete).
  - **`onfilterstep`**: Called when a step in the filter chain is executed.
  - **`onupdate`**: Called at intervals defined by `updateInterval`, useful for polling or progress updates.

## Predefined Filter Chain Presets

**Simple API Fetch** includes built-in filter chain presets for common use cases:

```
// Presets available in simpleFetch.filters
export default {
  NONE: FilterChain.Create<Response>(), // No transformation, returns the Response object
  JSON: FilterChain.Create<Response>().then(async r => await r.json()), // Convert to JSON
  TEXT: FilterChain.Create<Response>().then(async r => await r.text()), // Convert to text
} as const;
```

### Using Presets

- `simpleFetch.filters.NONE`: No transformation, returns the `Response` object as is.
- `simpleFetch.filters.JSON`: Converts the `Response` object to JSON.
- `simpleFetch.filters.TEXT`: Converts the `Response` object to text.
