import crypto from "crypto";
import { config } from "../../config.js";
const JWT_SECRET = config.JWT_SECRET;
function base64urlEncode(str) {
    return Buffer.from(str).toString("base64url");
}
function base64urlDecode(str) {
    return Buffer.from(str, "base64url").toString("utf8");
}
export function signJwt(user, expiresInSeconds = 15 * 60) {
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        sub: user.id,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
        iat: now,
        exp: now + expiresInSeconds,
    };
    const encodedHeader = base64urlEncode(JSON.stringify(header));
    const encodedPayload = base64urlEncode(JSON.stringify(payload));
    const signature = crypto
        .createHmac("sha256", JWT_SECRET)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest("base64url");
    return `${encodedHeader}.${encodedPayload}.${signature}`;
}
export function verifyJwt(token) {
    try {
        const parts = token.split(".");
        if (parts.length !== 3)
            return null;
        const [encodedHeader, encodedPayload, signature] = parts;
        const expectedSig = crypto
            .createHmac("sha256", JWT_SECRET)
            .update(`${encodedHeader}.${encodedPayload}`)
            .digest("base64url");
        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
            return null;
        }
        const payload = JSON.parse(base64urlDecode(encodedPayload));
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now)
            return null;
        return payload;
    }
    catch {
        return null;
    }
}
