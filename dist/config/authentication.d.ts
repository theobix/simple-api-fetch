export type AuthenticationHeader = `Bearer ${string}` | `Basic ${string}:${string}`;
export declare const Authentication: {
    Bearer: (token: string) => AuthenticationHeader;
    Basic: (user: string, password: string) => AuthenticationHeader;
};
