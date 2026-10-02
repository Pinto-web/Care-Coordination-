import { Router } from "express";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { db } from "../../db/client.js";
import { careRelationships, elderlyProfiles, users } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { canAccessElderly } from "./careCircleService.js";
const router = Router();
router.get("/elderly", requireAuth, requireRole("CAREGIVER"), async (req, res, next) => {
    try {
        const caregiverId = req.auth.id;
        const results = await db
            .select({
            id: users.id,
            fullName: users.fullName,
            timezone: elderlyProfiles.timezone,
        })
            .from(careRelationships)
            .innerJoin(users, eq(users.id, careRelationships.elderlyId))
            .leftJoin(elderlyProfiles, eq(elderlyProfiles.userId, careRelationships.elderlyId))
            .where(eq(careRelationships.caregiverId, caregiverId));
        res.json({ elderly: results });
    }
    catch (err) {
        next(err);
    }
});
router.get("/elderly/:id", requireAuth, requireRole("CAREGIVER"), async (req, res, next) => {
    try {
        const caregiverId = req.auth.id;
        const elderlyId = req.params.id;
        if (!(await canAccessElderly(caregiverId, elderlyId))) {
            res.status(403).json({ error: { code: "FORBIDDEN", message: "Cannot access this elderly" } });
            return;
        }
        const elderly = await db.query.users.findFirst({ where: eq(users.id, elderlyId) });
        const profile = await db.query.elderlyProfiles.findFirst({ where: eq(elderlyProfiles.userId, elderlyId) });
        if (!elderly) {
            res.status(404).json({ error: { code: "NOT_FOUND", message: "Elderly not found" } });
            return;
        }
        res.json({ elderly: { id: elderly.id, fullName: elderly.fullName, timezone: profile?.timezone ?? "Asia/Kolkata" } });
    }
    catch (err) {
        next(err);
    }
});
export function assertCanAccessElderly(auth, elderlyId) {
    if (!auth)
        return false;
    if (auth.role === "ELDERLY") {
        return auth.id === elderlyId;
    }
    return true;
}
export default router;
