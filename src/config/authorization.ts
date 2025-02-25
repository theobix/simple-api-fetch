
export type AuthorizationHeader = `Bearer ${string}` | `Basic ${string}:${string}`

export const Authorization = {
    Bearer: (token: string): AuthorizationHeader => `Bearer ${btoa(token)}`,
    Basic: (user: string, password: string): AuthorizationHeader => `Basic ${user}:${password}`
}