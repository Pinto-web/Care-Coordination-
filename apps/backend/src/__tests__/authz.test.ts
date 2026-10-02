import { describe, it, expect, beforeAll } from "vitest";
import app, { bootstrap } from "../app.js";
import { ensureSeeded } from "../modules/auth/authService.js";

const defaultEmail = "caregiver@example.com";
const defaultPassword = "password123";

describe("AuthZ boundaries", () => {
  let token: string;
  let elderlyId: string | null = null;

  beforeAll(async () => {
    await bootstrap();
    await ensureSeeded();
    const server = app.listen(0);
    const addr = server.address();
    const port = typeof addr === "object" && addr ? addr.port : 0;
    const loginRes = await fetch(`http://localhost:${port}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: defaultEmail, password: defaultPassword }),
    });
    const loginBody = await loginRes.json();
    token = loginBody.accessToken;
    const listRes = await fetch(`http://localhost:${port}/elderly`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const listBody = await listRes.json();
    if (listBody.elderly && listBody.elderly[0]) {
      elderlyId = listBody.elderly[0].id;
    }
    server.close();
  });

  it("caregiver can access their elderly", async () => {
    const server = app.listen(0);
    const addr = server.address();
    const port = typeof addr === "object" && addr ? addr.port : 0;
    if (!elderlyId) {
      server.close();
      expect(elderlyId).not.toBeNull();
      return;
    }
    const res = await fetch(`http://localhost:${port}/elderly/${elderlyId}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    server.close();
  });

  it("caregiver cannot access unrelated elderly id", async () => {
    const server = app.listen(0);
    const addr = server.address();
    const port = typeof addr === "object" && addr ? addr.port : 0;
    const fakeId = "11111111-1111-1111-1111-111111111111";
    const res = await fetch(`http://localhost:${port}/elderly/${fakeId}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
    server.close();
  });

  it("rejects unauthorized requests", async () => {
    const server = app.listen(0);
    const addr = server.address();
    const port = typeof addr === "object" && addr ? addr.port : 0;
    const res = await fetch(`http://localhost:${port}/elderly`, {});
    expect(res.status).toBe(401);
    server.close();
  });
});
