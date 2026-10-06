import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
test("Admin denies unauthenticated and foreign-origin requests; persists catalog edit", async () => {
  const port = 4189,
    child = spawn(process.execPath, ["admin/server.mjs"], {
      env: { ...process.env, PORT: String(port), FACTORY_ADMIN_MODE: "MOCK" },
      stdio: ["ignore", "pipe", "pipe"],
    });
  try {
    await once(child.stdout, "data");
    const base = "http://127.0.0.1:" + port;
    let r = await fetch(base + "/api/services");
    assert.equal(r.status, 401);
    const session = await (await fetch(base + "/api/session")).json();
    const headers = {
      "X-Factory-Token": session.token,
      "Content-Type": "application/json",
    };
    r = await fetch(base + "/api/services", {
      headers: { ...headers, Origin: "https://foreign.example" },
    });
    assert.equal(r.status, 403);
    const rows = await (
      await fetch(base + "/api/services", { headers })
    ).json();
    assert.ok(rows.length >= 3);
    r = await fetch(base + "/api/services", {
      method: "POST",
      headers,
      body: JSON.stringify(rows[0]),
    });
    assert.equal(r.status, 200);
    r = await fetch(base + "/api/services", {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...rows[0],
        image: "https://foreign.example/image.png",
      }),
    });
    assert.equal(r.status, 400);
    r = await fetch(base + "/api/unknown", { headers });
    assert.equal(r.status, 404);
  } finally {
    child.kill();
  }
});
