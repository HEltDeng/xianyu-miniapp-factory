import test from "node:test";
import assert from "node:assert/strict";
import { runtime } from "./cloud-harness.mjs";

const input = () => ({
  requestId: "test-cloud-request",
  name: "Test",
  phone: "13800000000",
  serviceId: "s1",
  date: "2099-12-12",
  time: "09:00",
  note: "",
  consent: true,
});
test("cloud uses context identity, ignores forged event identity", async () => {
  const r = runtime();
  const out = await r.call({
    action: "identity",
    payload: { openid: "mallory" },
  });
  assert.equal(out.data.id, "alice");
  r.setOwner("");
  assert.ok((await r.call({ action: "identity" })).error);
});
test("cloud booking idempotency and owner isolation", async () => {
  const r = runtime();
  const a = await r.call({ action: "book", payload: input() });
  assert.ok(a.data, a.error);
  const b = await r.call({ action: "book", payload: input() });
  assert.equal(a.data.id, b.data.id);
  r.setOwner("bob");
  assert.equal((await r.call({ action: "bookings" })).data.length, 0);
  assert.equal(
    (await r.call({ action: "cancel", payload: { id: a.data.id } })).error,
    "无权操作",
  );
  r.setOwner("alice");
  assert.equal((await r.call({ action: "bookings" })).data.length, 1);
  await r.call({ action: "cancel", payload: { id: a.data.id } });
  assert.equal(r.tables.bookings[a.data.id].status, "已取消");
});
test("cloud validates fields and forbids arbitrary collections", async () => {
  const r = runtime();
  for (const p of [
    { ...input(), consent: false },
    { ...input(), phone: "invalid" },
    { ...input(), time: "22:30" },
  ])
    assert.ok((await r.call({ action: "book", payload: p })).error);
  assert.ok(
    (await r.call({ action: "list", payload: { collection: "bookings" } }))
      .error,
  );
});
