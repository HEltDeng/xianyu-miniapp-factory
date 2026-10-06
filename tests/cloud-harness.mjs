import fs from "node:fs";
import vm from "node:vm";
import crypto from "node:crypto";
export function runtime() {
  let owner = "alice";
  const tables = {
    services: { s1: { title: "Test service" } },
    bookings: {},
    feedback: {},
  };
  function collection(name) {
    tables[name] ||= {};
    return {
      doc(id) {
        return {
          async get() {
            return { data: tables[name][id] };
          },
          async set({ data }) {
            tables[name][id] = structuredClone(data);
          },
          async update({ data }) {
            Object.assign(tables[name][id], data);
          },
        };
      },
      where(filter) {
        return {
          orderBy() {
            return this;
          },
          limit() {
            return this;
          },
          async get() {
            return {
              data: Object.entries(tables[name])
                .filter(([, r]) =>
                  Object.entries(filter).every(([k, v]) => r[k] === v),
                )
                .map(([id, r]) => ({ _id: id, ...r })),
            };
          },
        };
      },
      limit() {
        return {
          async get() {
            return {
              data: Object.entries(tables[name]).map(([id, r]) => ({
                _id: id,
                ...r,
              })),
            };
          },
        };
      },
    };
  }
  const db = { collection, runTransaction: (fn) => fn({ collection }) };
  const m = { exports: {} };
  const cloud = {
    init() {},
    DYNAMIC_CURRENT_ENV: "test",
    database: () => db,
    getWXContext: () => ({ OPENID: owner }),
  };
  vm.runInNewContext(
    fs.readFileSync("cloudfunctions/factory/index.js", "utf8"),
    {
      exports: m.exports,
      require: (x) => (x === "wx-server-sdk" ? cloud : crypto),
      Date,
      Error,
      Number,
    },
  );
  return { call: m.exports.main, setOwner: (x) => (owner = x), tables };
}
