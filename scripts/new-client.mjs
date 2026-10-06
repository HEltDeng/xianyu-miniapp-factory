import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { args, read, write, validate, routes } from "./lib.mjs";
import { markdown } from "./quote.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
  a = args(process.argv.slice(2));
if (!a.name) throw Error("请提供 --name");
if (path.basename(path.dirname(root)) !== "01_Repository")
  throw Error("请从母版仓库运行客户生成器，客户目录内禁止嵌套生成");
if (
  /[<>:"/\\|?*\x00-\x1f]/.test(a.name) ||
  /[. ]$/.test(a.name) ||
  /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(a.name)
)
  throw Error("客户名称不能包含路径/Windows保留名称");
const c = read(root + "/config/client.json"),
  themes = read(root + "/config/themes.json");
if (!themes[a.theme || "green"]) throw Error("未知主题");
Object.assign(c, themes[a.theme || "green"], {
  theme: a.theme || "green",
  appName: a.name,
  shortName: a.name.slice(0, 8),
  companyName: a.name,
  copyright: "© " + new Date().getFullYear() + " " + a.name,
  clientId:
    a.id ||
    "client-" +
      crypto.createHash("sha256").update(a.name).digest("hex").slice(0, 12),
  backendMode: { mock: "MOCK", cloudbase: "CLOUDBASE", rest: "REST_API" }[
    a.backend || "mock"
  ],
  cloudbaseEnv: "",
  apiBaseUrl: a["api-url"] || "",
  admin: a.admin === "true",
  contactPhone: "",
  wechat: "",
});
const modules = (
  a.modules || "home,service,booking,profile,category,search,case,form"
).split(",");
for (const k of Object.keys(c.features)) c.features[k] = false;
for (const k of [...modules, "settings"]) c.features[k] = true;
c.navigation = ["home", "service", "booking", "profile"].filter(
  (k) => c.features[k],
);
c.pageCount = Object.entries(routes)
  .filter(([k]) => c.features[k])
  .reduce((n, [, v]) => n + v.length, 0);
validate(c);
const clients = path.resolve(root, "../../04_Client-Projects");
fs.mkdirSync(clients, { recursive: true });
const dest = path.join(clients, a.name);
if (path.dirname(dest) !== clients || fs.existsSync(dest))
  throw Error("客户目录已存在或越界，禁止覆盖");
fs.mkdirSync(dest);
try {
  for (const name of [
    "package.json",
    "pnpm-lock.yaml",
    "pnpm-workspace.yaml",
    ".gitignore",
    "eslint.config.mjs",
    "tsconfig.json",
    "README.md",
    "CHANGELOG.md",
    "config",
    "src",
    "miniprogram",
    "design-tokens",
    "assets",
    "cloudfunctions",
    "admin",
    "preview",
    "scripts",
    "tests",
    "docs",
  ]) {
    const source = path.join(root, name);
    if (fs.existsSync(source))
      fs.cpSync(source, path.join(dest, name), { recursive: true });
  }
  write(dest + "/config/client.json", JSON.stringify(c, null, 2));
  write(
    dest + "/客户报价单.md",
    markdown(c, read(root + "/config/pricing.config.json")),
  );
  write(
    dest + "/CLIENT_REQUIREMENTS.md",
    "# " +
      a.name +
      " 需求记录\n\n" +
      JSON.stringify(c, null, 2) +
      "\n\n待确认：主体、Logo授权、电话、AppID、行业资质、隐私政策与上线时间。\n",
  );
  write(
    dest + "/DEPLOYMENT.md",
    "# 部署说明\n\npnpm install --frozen-lockfile\npnpm run build\n微信开发者工具导入 dist。默认 touristappid；云环境为空时为 Mock。实际部署见 docs/CLOUDBASE.md。禁止把演示预约作为真实接单。\n",
  );
  write(
    dest + "/DELIVERY_CHECKLIST.md",
    "# 交付清单\n\n- [ ] 品牌/页面/报价确认\n- [ ] pnpm run typecheck / lint / build / test / check\n- [ ] 微信工具编译与真机验收\n- [ ] 主体备案、隐私、合法域名\n- [ ] CloudBase 真实联调（如选用）\n- [ ] 管理员交接与数据处理规则\n",
  );
  console.log(dest);
} catch (e) {
  console.error("生成失败，保留目录供诊断，不覆盖或自动删除:", dest);
  throw e;
}
