import { config } from "./config.js";
import { logger } from "./logger.js";
import app, { bootstrap } from "./app.js";
import { pool } from "./db/client.js";
const server = app.listen(config.PORT, async () => {
    await bootstrap();
    logger.info({ port: config.PORT, env: config.NODE_ENV }, "Backend server started");
});
process.on("SIGTERM", () => {
    logger.info("SIGTERM received, closing server");
    server.close(() => {
        pool.end().catch((err) => logger.error({ err }, "Error closing DB pool"));
        process.exit(0);
    });
});
process.on("SIGINT", () => {
    logger.info("SIGINT received, closing server");
    server.close(() => {
        pool.end().catch((err) => logger.error({ err }, "Error closing DB pool"));
        process.exit(0);
    });
});
