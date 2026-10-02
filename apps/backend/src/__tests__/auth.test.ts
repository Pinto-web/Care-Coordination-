import { describe, it, expect } from "vitest";
import app from "../app.js";

describe("Auth", () => {
  it("me requires auth", async () => {
    const server = app.listen(0);
    const addr = server.address();
    const port = typeof addr === "object" && addr ? addr.port : 0;
    const res = await fetch(`http://localhost:${port}/auth/me`);
    expect(res.status).toBe(401);
    server.close();
  });

  it("login requires body fields", async () => {
    const server = app.listen(0);
    const addr = server.address();
    const port = typeof addr === "object" && addr ? addr.port : 0;
    const res = await fetch(`http://localhost:${port}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
    server.close();
  });
});
