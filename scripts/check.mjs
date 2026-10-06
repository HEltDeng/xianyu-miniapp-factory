import fs from "node:fs";
import path from "node:path";
import { read, routes, validate } from "./lib.mjs";
const c = read("config/client.json");
validate(c);
const root = "dist/miniprogram",
  app = read(root + "/app.json");
let count = 0,
  bytes = 0;
const fail = (m) => {
  throw Error(m);
};
const files = fs
  .readdirSync(root, { recursive: true })
  .map((p) => path.join(root, p))
  .filter((p) => fs.statSync(p).isFile());
for (const p of app.pages)
  for (const ext of ["js", "json", "wxml"])
    if (!fs.existsSync(root + "/" + p + "." + ext))
      fail("缺少页面 " + p + "." + ext);
for (const [k, rr] of Object.entries(routes))
  for (const r of rr)
    if (app.pages.includes("pages/" + r + "/index") !== !!c.features[k])
      fail("模块裁剪失败 " + k);
for (const t of app.tabBar?.list || [])
  if (!app.pages.includes(t.pagePath)) fail("导航未注册");
for (const f of files) {
  bytes += fs.statSync(f).size;
  if (f.endsWith(".js")) count++;
  if (/\.(json|wxml)$/.test(f)) {
    const text = fs.readFileSync(f, "utf8");
    for (const m of text.matchAll(
      /(?:\/assets\/|assets\/)([a-zA-Z0-9_-]+\.png)/g,
    ))
      if (!fs.existsSync(root + "/assets/" + m[1])) fail("图片缺失 " + m[1]);
  }
}
if (bytes > 2 * 1024 * 1024) fail("超出工程保守主包预算2MiB");
const pageSource = fs
  .readdirSync("miniprogram/pages")
  .filter((p) => p.endsWith(".js"))
  .map((p) => fs.readFileSync("miniprogram/pages/" + p, "utf8"))
  .join("\n");
if (/https?:\/\//.test(pageSource) || /wx\.request\(/.test(pageSource))
  fail("页面存在硬编码请求");
const privacy = [
  ...pageSource.matchAll(
    /wx\.(chooseMedia|requirePrivacyAuthorize|getLocation|getPhoneNumber|getUserProfile)/g,
  ),
].map((x) => x[1]);
const used = new Set();
for (const f of files.filter((x) => /\.(js|json|wxml)$/.test(x)))
  for (const m of fs
    .readFileSync(f, "utf8")
    .matchAll(/(?:\/assets\/|assets\/)([a-zA-Z0-9_-]+\.png)/g))
    used.add(m[1]);
const unused = fs.readdirSync(root + "/assets").filter((x) => !used.has(x));
console.log(
  JSON.stringify(
    {
      status: "PASS",
      pages: app.pages.length,
      javascriptFiles: count,
      bytes,
      budget: "2MiB engineering budget; official latest quota BLOCKED",
      routes: "PASS",
      modulePruning: "PASS",
      assets: "PASS",
      network: "PASS",
      privacyAPIs: [...new Set(privacy)],
      unusedAssets: unused,
      warnings: [
        "Official compiler/real device not covered by this static check",
        "Unused provider files are intentional runtime adapters",
      ],
    },
    null,
    2,
  ),
);
