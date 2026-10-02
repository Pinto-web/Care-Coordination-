import { verifyJwt } from "./jwt.js";
export function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Missing token" } });
        return;
    }
    const token = authHeader.substring("Bearer ".length);
    const payload = verifyJwt(token);
    if (!payload) {
        res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } });
        return;
    }
    req.auth = {
        id: payload.sub,
        role: payload.role,
        fullName: payload.fullName,
        email: payload.email,
    };
    next();
}
export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.auth) {
            res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Missing token" } });
            return;
        }
        if (!roles.includes(req.auth.role)) {
            res.status(403).json({ error: { code: "FORBIDDEN", message: "Insufficient permissions" } });
            return;
        }
        next();
    };
}
