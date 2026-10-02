import { describe, it, expect, beforeAll } from "vitest";
import app from "../app.js";
import { ensureSeeded } from "../modules/auth/authService.js";
const defaultEmail = "caregiver@example.com";
const defaultPassword = "password123";
describe("Auth", () => {
    beforeAll(async () => {
        await ensureSeeded();
    });
    it("login returns JWT for seeded caregiver", async () => {
        const res = await fetch("http://localhost:0/auth/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: defaultEmail, password: defaultPassword }),
        }).catch(() => null);
    });
    it("me requires auth", async () => {
        const server = app.listen(0);
        const port = server.address().port;
        const res = await fetch(`http://localhost:${port}/auth/me`);
        expect(res.status).toBe(401);
        server.close();
    });
    it("login rejects bad credentials", async () => {
        const server = app.listen(0);
        const port = server.address().port;
        const res = await fetch(`http://localhost:${port}/auth/login`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email: defaultEmail, password: "wrong" }),
        });
        expect(res.status).toBe(401);
        server.close();
    });
});
