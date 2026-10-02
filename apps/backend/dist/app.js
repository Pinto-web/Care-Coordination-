import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { checkDbHealth } from "./db/client.js";
import { SystemClock, FakeClock } from "./clock.js";
import { errorHandler, notFoundHandler } from "./http/middleware.js";
import authRoutes from "./modules/auth/routes.js";
import careCircleRoutes from "./modules/care-circle/routes.js";
import { ensureSeeded } from "./modules/auth/authService.js";
const app = express();
app.use(helmet());
app.use(cors({ origin: config.CORS_ORIGIN }));
app.use(express.json());
export const clock = config.ENABLE_DEV_CLOCK ? new FakeClock() : new SystemClock();
app.get("/health", async (_req, res) => {
    const dbHealth = await checkDbHealth();
    const status = dbHealth.ok ? 200 : 503;
    res.status(status).json({
        status: dbHealth.ok ? "ok" : "degraded",
        db: dbHealth.ok ? { status: "connected" } : { status: "disconnected", error: dbHealth.error },
        time: clock.now().toISOString(),
    });
});
app.use(authRoutes);
app.use(careCircleRoutes);
app.use(notFoundHandler);
app.use(errorHandler);
export async function bootstrap() {
    try {
        await ensureSeeded();
        logger.info("Seed data ensured");
    }
    catch (err) {
        logger.error({ err }, "Failed to ensure seed data");
    }
}
export default app;
