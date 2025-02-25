
export type AuthorizationHeader = `Bearer ${string}` | `Basic ${string}`

export const Authorization = {
    Bearer: (token: string): AuthorizationHeader => `Bearer ${btoa(token)}`,
    Basic: (user: string, password: string): AuthorizationHeader => `Basic ${btoa(`${user}:${password}`)}`
}