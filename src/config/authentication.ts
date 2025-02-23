
export type AuthenticationHeader = `Bearer ${string}` | `Basic ${string}:${string}`

export const Authentication = {
    Bearer: (token: string): AuthenticationHeader => `Bearer ${btoa(token)}`,
    Basic: (user: string, password: string): AuthenticationHeader => `Basic ${user}:${password}`
}