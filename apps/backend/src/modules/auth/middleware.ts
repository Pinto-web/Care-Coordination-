import type { Request, Response, NextFunction } from "express";
import { verifyJwt } from "./jwt.js";
import type { AuthUser } from "./types.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
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

export function requireRole(...roles: Array<"CAREGIVER" | "ELDERLY">) {
  return (req: Request, res: Response, next: NextFunction) => {
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
