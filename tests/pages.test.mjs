import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
const config = JSON.parse(fs.readFileSync("config/client.json", "utf8"));
const seed = JSON.parse(fs.readFileSync("src/data/seed.json", "utf8"));
function page(name, p) {
  let object;
  const storage = new Map();
  const wx = {
    getStorageSync: (k) => storage.get(k),
    setStorageSync: (k, v) => storage.set(k, v),
    showModal: () => {},
    showToast: () => {},
  };
  const ui = {
    config,
    provider: () => p,
    go: () => {},
    page: (extra) => ({ ...extra }),
  };
  vm.runInNewContext(
    fs.readFileSync("miniprogram/pages/" + name + ".js", "utf8"),
    {
      require: () => ui,
      Page: (x) => (object = x),
      wx,
      Error,
      Date,
      Math,
      Promise,
    },
  );
  object.data = {};
  object.setData = (x) => Object.assign(object.data, x);
  object.run = async (fn) => {
    try {
      await fn();
    } catch (e) {
      object.data.error = e.message;
    }
  };
  return object;
}
test("search narrows and returns empty state", async () => {
  const p = page("search", { list: async () => seed.services });
  await p.onShow();
  p.search({ detail: { value: "软装" } });
  assert.equal(p.data.services.length, 1);
  p.search({ detail: { value: "不存在的项目" } });
  assert.equal(p.data.services.length, 0);
});
test("missing detail exposes retryable error", async () => {
  const p = page("detail", { list: async () => seed.services });
  p.onLoad({ id: "missing" });
  await p.onShow();
  assert.equal(p.data.error, "服务不存在或已下架");
});
test("configured cloud provider errors do not silently become mock results", async () => {
  const p = page("search", {
    list: async () => {
      throw Error("cloud offline");
    },
  });
  await p.onShow();
  assert.equal(p.data.error, "cloud offline");
});
