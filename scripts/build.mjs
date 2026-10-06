import { finalize } from "./finalize-package.mjs";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { read, write, validate, routes, labels } from "./lib.mjs";
const root = process.cwd(),
  c = read("config/client.json");
validate(c);
const dist = path.resolve("dist");
if (path.dirname(dist) !== root) throw Error("Unsafe output");
fs.rmSync(dist, { recursive: true, force: true });
execFileSync(process.execPath, ["node_modules/typescript/bin/tsc"], {
  stdio: "inherit",
});
const out = "dist/miniprogram";
fs.mkdirSync(out, { recursive: true });
fs.cpSync("dist/src", out, { recursive: true });
fs.cpSync("dist/config", out + "/config", { recursive: true });
fs.rmSync("dist/src", { recursive: true });
fs.rmSync("dist/config", { recursive: true });
// Compiled provider imports become relative to the packaged config directory.
for (const p of ["data/index.js"]) {
  const file = out + "/" + p;
  write(
    file,
    fs
      .readFileSync(file, "utf8")
      .replace("../../config/client.config", "../config/client.config"),
  );
}
fs.cpSync("assets", out + "/assets", { recursive: true });
const pages = Object.entries(routes)
  .filter(([k]) => c.features[k])
  .flatMap(([, v]) => v);
for (const p of pages) {
  for (const ext of ["js", "wxml", "json"])
    fs.copyFileSync(
      "miniprogram/pages/" + p + "." + ext,
      out + "/pages-" + p + "." + ext,
    );
}
for (const p of pages) {
  fs.mkdirSync(out + "/pages/" + p, { recursive: true });
  for (const ext of ["js", "wxml", "json"])
    fs.renameSync(
      out + "/pages-" + p + "." + ext,
      out + "/pages/" + p + "/index." + ext,
    );
}
for (const p of ["app.js", "ui.js"])
  fs.copyFileSync("miniprogram/" + p, out + "/" + p);
const theme = read("design-tokens/tokens.json");
write(
  out + "/app.wxss",
  ":root,page{--primary:" +
    c.primaryColor +
    ";--secondary:" +
    c.secondaryColor +
    ";--background:" +
    c.backgroundColor +
    ";--radius:" +
    theme.radius +
    "rpx;}\n" +
    fs.readFileSync("design-tokens/base.wxss", "utf8"),
);
const route = (k) => "pages/" + routes[k][0] + "/index";
const app = {
  pages: pages.map((p) => "pages/" + p + "/index"),
  window: {
    navigationBarTitleText: c.shortName,
    navigationBarBackgroundColor: c.backgroundColor,
    navigationBarTextStyle: "black",
    backgroundColor: c.backgroundColor,
  },
  style: "v2",
  lazyCodeLoading: "requiredComponents",
  sitemapLocation: "sitemap.json",
};
if (c.navigation.length >= 2)
  app.tabBar = {
    color: "#72766f",
    selectedColor: c.primaryColor,
    backgroundColor: "#ffffff",
    list: c.navigation.map((k) => ({
      pagePath: route(k),
      text: labels[k],
      iconPath: "assets/nav-" + k + ".png",
      selectedIconPath: "assets/nav-" + k + "-active.png",
    })),
  };
write(out + "/app.json", JSON.stringify(app, null, 2));
write(
  out + "/sitemap.json",
  JSON.stringify({ rules: [{ action: "allow", page: "*" }] }),
);
write(
  "dist/project.config.json",
  JSON.stringify(
    {
      appid: c.appId,
      projectname: c.clientId,
      compileType: "miniprogram",
      miniprogramRoot: "miniprogram/",
      cloudfunctionRoot: "cloudfunctions/",
      setting: { es6: true, minified: true, urlCheck: true },
      libVersion: "latest",
    },
    null,
    2,
  ),
);
fs.cpSync("cloudfunctions", "dist/cloudfunctions", { recursive: true });
finalize(out, c);
console.log("Built " + pages.length + " native pages → dist");
