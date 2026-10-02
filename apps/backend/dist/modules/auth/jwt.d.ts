import type { AuthUser } from "./types.js";
export declare function signJwt(user: AuthUser, expiresInSeconds?: number): string;
export interface JwtPayload {
    sub: string;
    role: "CAREGIVER" | "ELDERLY";
    fullName: string;
    email?: string;
    iat: number;
    exp: number;
}
export declare function verifyJwt(token: string): JwtPayload | null;
//# sourceMappingURL=jwt.d.ts.map