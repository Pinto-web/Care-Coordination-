import type { Request, Response, NextFunction } from "express";
import type { AuthUser } from "./types.js";
declare global {
    namespace Express {
        interface Request {
            auth?: AuthUser;
        }
    }
}
export declare function requireAuth(req: Request, res: Response, next: NextFunction): void;
export declare function requireRole(...roles: Array<"CAREGIVER" | "ELDERLY">): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=middleware.d.ts.map