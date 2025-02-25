export type AuthorizationHeader = `Bearer ${string}` | `Basic ${string}`;
export declare const Authorization: {
    Bearer: (token: string) => AuthorizationHeader;
    Basic: (user: string, password: string) => AuthorizationHeader;
};
