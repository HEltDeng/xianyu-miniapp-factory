import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import { quote } from "../scripts/quote.mjs";
import { read, validate } from "../scripts/lib.mjs";
const require = createRequire(import.meta.url);
function compiled(file) {
  const source = fs.readFileSync("dist/miniprogram/" + file, "utf8");
  const m = { exports: {} };
  const req = (p) =>
    p === "./seed.json"
      ? read("dist/miniprogram/data/seed.json")
      : p === "../domain/models"
        ? compiled("domain/models.js")
        : require(p);
  vm.runInNewContext(source, {
    exports: m.exports,
    module: m,
    require: req,
    Date,
    Error,
    Promise,
    console,
  });
  return m.exports;
}
const { MockProvider } = compiled("data/mock.js");
const valid = () => ({
  requestId: "req-test-123",
  serviceId: "s1",
  name: "测试访客",
  phone: "13800000000",
  date: "2099-12-12",
  time: "09:00",
  note: "",
  consent: true,
});
function setup() {
  const data = new Map();
  return {
    p: new MockProvider(
      { get: (k) => data.get(k), set: (k, v) => data.set(k, v) },
      "a",
    ),
    data,
  };
}
test("catalog includes real services and categories", async () => {
  const { p } = setup();
  assert.equal((await p.list("services")).length, 3);
  assert.equal((await p.list("categories")).length, 3);
});
test("booking persists, retries idempotently, cancels", async () => {
  const { p } = setup();
  const a = await p.book(valid()),
    b = await p.book(valid());
  assert.equal(a.id, b.id);
  assert.equal((await p.bookings()).length, 1);
  await p.cancel(a.id);
  assert.equal((await p.bookings())[0].status, "已取消");
});
test("reject missing consent, bad phone, past date, missing service", async () => {
  const { p } = setup();
  for (const change of [
    { consent: false },
    { phone: "abc" },
    { date: "2000-01-01" },
    { serviceId: "missing" },
  ])
    await assert.rejects(() => p.book({ ...valid(), ...change }));
});
test("client storage namespaces isolated", async () => {
  const { p, data } = setup();
  await p.book(valid());
  const other = new MockProvider(
    { get: (k) => data.get(k), set: (k, v) => data.set(k, v) },
    "b",
  );
  assert.equal((await other.bookings()).length, 0);
});
test("feedback validation and duplicate suppression", async () => {
  const { p, data } = setup();
  await assert.rejects(() => p.feedback({ message: "", consent: true }));
  const x = { requestId: "feedback-1", message: "测试建议", consent: true };
  await p.feedback(x);
  await p.feedback(x);
  assert.equal(data.get("a:feedback").length, 1);
});
test("payment never fakes success", async () => {
  const { DisabledPaymentProvider } = compiled("domain/models.js");
  await assert.rejects(() => new DisabledPaymentProvider().pay("order-1"));
});
test("699 base pricing and additive options", () => {
  const p = read("config/pricing.config.json");
  assert.equal(
    quote(
      {
        pageCount: 5,
        features: {},
        admin: false,
        backendMode: "MOCK",
        extraRevisions: 0,
      },
      p,
    ).total,
    699,
  );
  assert.equal(
    quote(
      {
        pageCount: 6,
        features: { booking: true },
        admin: true,
        backendMode: "CLOUDBASE",
        extraRevisions: 1,
      },
      p,
    ).total,
    2199,
  );
});
test("unsupported features and dependency errors rejected", () => {
  const c = read("config/client.json");
  validate(c);
  assert.throws(() =>
    validate({ ...c, features: { ...c.features, community: true } }),
  );
  assert.throws(() =>
    validate({ ...c, features: { ...c.features, service: false, booking: true } }),
  );
  assert.throws(() =>
    validate({ ...c, backendMode: "REST_API", apiBaseUrl: "http://unsafe" }),
  );
});
