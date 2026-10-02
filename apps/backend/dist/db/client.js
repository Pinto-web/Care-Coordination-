import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { config } from "../config.js";
import { logger } from "../logger.js";
import * as schema from "./schema.js";
const { Pool } = pg;
export const pool = new Pool({
    connectionString: config.DATABASE_URL,
});
export const db = drizzle(pool, { schema });
export async function checkDbHealth() {
    try {
        const res = await pool.query("SELECT 1 as ok");
        if (res.rows[0]?.ok === 1) {
            return { ok: true };
        }
        return { ok: false, error: "unexpected result" };
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error({ err }, "DB health check failed");
        return { ok: false, error: msg };
    }
}
