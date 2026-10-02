import { Router } from "express";
import { ensureSeeded, verifyCaregiverCredentials } from "./authService.js";
import { signJwt } from "./jwt.js";
import { requireAuth } from "./middleware.js";
const router = Router();
router.post("/auth/login", async (req, res, next) => {
    try {
        await ensureSeeded();
        const { email, password } = req.body ?? {};
        if (!email || !password) {
            res.status(400).json({ error: { code: "BAD_REQUEST", message: "email and password required" } });
            return;
        }
        const user = await verifyCaregiverCredentials(email, password);
        if (!user) {
            res.status(401).json({ error: { code: "UNAUTHORIZED", message: "Invalid credentials" } });
            return;
        }
        const token = signJwt({
            id: user.id,
            role: user.role,
            fullName: user.fullName,
            email: user.email ?? undefined,
        });
        res.json({
            accessToken: token,
            user: {
                id: user.id,
                role: user.role,
                fullName: user.fullName,
                email: user.email ?? undefined,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
router.get("/auth/me", requireAuth, (req, res) => {
    res.json({ user: req.auth });
});
export default router;
