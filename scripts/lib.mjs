import fs from "node:fs";
import path from "node:path";
export const implemented = [
  "home",
  "category",
  "search",
  "service",
  "case",
  "booking",
  "form",
  "profile",
  "settings",
];
export const routes = {
  home: ["home"],
  category: ["category"],
  search: ["search"],
  service: ["services", "detail"],
  case: ["cases"],
  booking: ["booking", "records"],
  form: ["feedback"],
  profile: ["profile"],
  settings: ["settings"],
};
export const labels = {
  home: "首页",
  service: "服务",
  booking: "预约",
  profile: "我的",
};
export function validate(c) {
  if (!/^[a-z0-9][a-z0-9_-]{1,48}$/.test(c.clientId))
    throw Error("clientId 格式错误");
  if (!c.appName?.trim() || c.appName.length > 30)
    throw Error("名称长度需1至30");
  for (const k of ["primaryColor", "secondaryColor", "backgroundColor"])
    if (!/^#[0-9a-f]{6}$/i.test(c[k])) throw Error("颜色需六位HEX");
  for (const [k, v] of Object.entries(c.features)) {
    if (typeof v !== "boolean") throw Error("功能必须为布尔值");
    if (v && !implemented.includes(k)) throw Error("模块尚未实现: " + k);
  }
  if (!c.features.home || !c.features.settings)
    throw Error("必须保留首页与隐私设置");
  for (const k of ["booking", "category", "search"])
    if (c.features[k] && !c.features.service) throw Error(k + " 依赖 service");
  if (!["MOCK", "CLOUDBASE", "REST_API"].includes(c.backendMode))
    throw Error("未知数据模式");
  if (c.backendMode === "REST_API" && !/^https:\/\//.test(c.apiBaseUrl))
    throw Error("REST需要HTTPS apiBaseUrl");
  if (
    !Array.isArray(c.navigation) ||
    c.navigation.length > 5 ||
    new Set(c.navigation).size !== c.navigation.length ||
    c.navigation.some((k) => !labels[k] || !c.features[k])
  )
    throw Error("导航无效");
  if (!c.navigation.includes("home")) throw Error("导航需包含首页");
  if (
    !Number.isInteger(c.pageCount) ||
    c.pageCount < 1 ||
    !Number.isInteger(c.extraRevisions) ||
    c.extraRevisions < 0
  )
    throw Error("页数或修改次数无效");
}
export function read(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
export function write(p, v) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, v);
}
export function args(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    if (!argv[i].startsWith("--") || argv[i + 1] === undefined)
      throw Error("参数需 --key value");
    out[argv[i].slice(2)] = argv[i + 1];
  }
  return out;
}
