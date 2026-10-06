import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { read, write } from "../scripts/lib.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = root + "/.runtime/admin-data.json";
const collections = [
  "banners",
  "categories",
  "services",
  "cases",
  "bookings",
  "feedback",
];
let db = fs.existsSync(file)
  ? read(file)
  : { ...read(root + "/src/data/seed.json"), bookings: [], feedback: [] };
let cloud;
const mode = process.env.FACTORY_ADMIN_MODE || "MOCK";
if (!["MOCK", "CLOUDBASE"].includes(mode)) throw Error("Unknown admin mode");
if (mode === "CLOUDBASE") {
  if (!process.env.CLOUDBASE_ENV_ID)
    throw Error("Explicit client CloudBase environment required");
  const sdk = await import("@cloudbase/node-sdk");
  cloud = (sdk.default || sdk)
    .init({ env: process.env.CLOUDBASE_ENV_ID })
    .database();
}
const token = crypto.randomBytes(32).toString("hex");
const port = Number(process.env.PORT || 4173);
const origin = "http://127.0.0.1:" + port;
async function body(req) {
  let s = "";
  for await (const chunk of req) {
    s += chunk;
    if (s.length > 1048576) throw Error("内容过大");
  }
  return JSON.parse(s || "{}");
}
const server = http.createServer(async (req, res) => {
  const send = (status, v, type = "application/json") => {
    res.writeHead(status, {
      "Content-Type": type + "; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
      "Content-Security-Policy": req.url.startsWith("/preview")
        ? "default-src 'self'; img-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-eval'; frame-ancestors 'none'"
        : "default-src 'self'; img-src 'self'; style-src 'self'; script-src 'self'; frame-ancestors 'none'",
    });
    res.end(type === "application/json" ? JSON.stringify(v) : v);
  };
  try {
    if (req.headers.host !== "127.0.0.1:" + port)
      return send(403, { error: "Host rejected" });
    if (req.headers.origin && req.headers.origin !== origin)
      return send(403, { error: "Origin rejected" });
    const u = new URL(req.url, origin);
    if (u.pathname === "/api/session" && req.method === "GET") {
      if (req.headers["sec-fetch-site"] === "cross-site")
        return send(403, { error: "Cross-site rejected" });
      return send(200, { token, mode });
    }
    if (u.pathname.startsWith("/api/")) {
      if (req.headers["x-factory-token"] !== token)
        return send(401, { error: "Unauthorized" });
      if (u.pathname === "/api/export" && req.method === "GET") {
        const catalog = {};
        for (const k of collections.slice(0, 4)) {
          catalog[k] = cloud
            ? (await cloud.collection(k).limit(100).get()).data.map((x) => ({
                ...x,
                id: x._id,
              }))
            : db[k];
        }
        return send(200, catalog);
      }
      const c = u.pathname.slice(5);
      if (!collections.includes(c))
        return send(404, { error: "Unknown collection" });
      if (req.method === "GET") {
        const rows = cloud
          ? (await cloud.collection(c).limit(100).get()).data.map((x) => ({
              ...x,
              id: x._id,
            }))
          : db[c];
        return send(200, rows);
      }
      const x = await body(req);
      if (typeof x.id !== "string" || !/^[a-zA-Z0-9_-]{1,90}$/.test(x.id))
        throw Error("ID格式错误");
      if (req.method === "DELETE") {
        if (cloud) await cloud.collection(c).doc(x.id).remove();
        else db[c] = db[c].filter((r) => r.id !== x.id);
      } else if (req.method === "POST") {
        if (["bookings", "feedback"].includes(c)) {
          const statuses =
            c === "bookings"
              ? ["待确认", "已确认", "已完成", "已取消"]
              : ["待处理", "已处理"];
          if (!statuses.includes(x.status)) throw Error("状态无效");
          if (cloud)
            await cloud.collection(c).doc(x.id).update({ status: x.status });
          else {
            const row = db[c].find((r) => r.id === x.id);
            if (!row) throw Error("记录不存在");
            row.status = x.status;
          }
        } else {
          if (!x.title?.trim() || x.title.length > 100)
            throw Error("标题必填且不超过100字");
          if (c === "services" && (!Number.isFinite(x.price) || x.price < 0))
            throw Error("价格无效");
          const allowed = [
            "title",
            "subtitle",
            "categoryId",
            "price",
            "duration",
            "description",
            "badge",
            "image",
          ];
          const row = Object.fromEntries(
            allowed.filter((k) => x[k] !== undefined).map((k) => [k, x[k]]),
          );
          if (row.image && !/^\/assets\/[a-z0-9-]+\.png$/.test(row.image))
            throw Error("此版仅允许已打包原创资产路径");
          if (cloud) await cloud.collection(c).doc(x.id).set(row);
          else {
            const at = db[c].findIndex((r) => r.id === x.id);
            if (at < 0) db[c].push({ id: x.id, ...row });
            else db[c][at] = { id: x.id, ...row };
          }
        }
      } else return send(405, { error: "Method rejected" });
      if (!cloud) write(file, JSON.stringify(db, null, 2));
      return send(200, { ok: true });
    }
    if (u.pathname === "/preview/manifest")
      return send(
        200,
        fs
          .readdirSync(root + "/dist/miniprogram", { recursive: true })
          .filter((p) => fs.statSync(root + "/dist/miniprogram/" + p).isFile())
          .map((p) => p.replaceAll("\\", "/")),
      );
    if (u.pathname.startsWith("/preview/file/")) {
      const rel = u.pathname.slice(14);
      if (rel.includes("..") || !/^[-a-zA-Z0-9_/.]+$/.test(rel))
        return send(403, { error: "Path rejected" });
      return send(
        200,
        fs.readFileSync(root + "/dist/miniprogram/" + rel, "utf8"),
        "text/plain",
      );
    }
    const files = {
      "/preview": "preview/index.html",
      "/preview/app.js": "preview/app.js",
      "/preview/style.css": "preview/style.css",
      "/": "admin/index.html",
      "/app.js": "admin/app.js",
      "/style.css": "admin/style.css",
    };
    let target = files[u.pathname];
    if (/^\/assets\/[a-z0-9-]+\.png$/.test(u.pathname))
      target = u.pathname.slice(1);
    if (!target) return send(404, { error: "Not found" });
    if (target.endsWith(".png")) {
      res.writeHead(200, { "Content-Type": "image/png" });
      return res.end(fs.readFileSync(root + "/" + target));
    }
    send(
      200,
      fs.readFileSync(root + "/" + target, "utf8"),
      target.endsWith(".js")
        ? "text/javascript"
        : target.endsWith(".css")
          ? "text/css"
          : "text/html",
    );
  } catch (e) {
    send(400, { error: e.message });
  }
});
server.listen(port, "127.0.0.1", () =>
  console.log("Admin " + mode + " " + origin + " (loopback only)"),
);
