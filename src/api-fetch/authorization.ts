
export type AuthorizationHeader = `Bearer ${string}` | `Basic ${string}`

export const Authorization = {
    Bearer: (token: string): AuthorizationHeader => `Bearer ${token}`,
    Basic: (user: string, password: string): AuthorizationHeader => `Basic ${btoa(`${user}:${password}`)}`
}