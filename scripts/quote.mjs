import path from "node:path";
import { fileURLToPath } from "node:url";
import { read, write, args } from "./lib.mjs";
export function quote(c, p) {
  if (
    !Number.isInteger(c.pageCount) ||
    c.pageCount < 1 ||
    !Number.isInteger(c.extraRevisions) ||
    c.extraRevisions < 0
  )
    throw Error("页数/修改次数必须为非负整数，页数至少1");
  for (const [k, v] of Object.entries(p))
    if (typeof v === "number" && (!Number.isFinite(v) || v < 0))
      throw Error("价格无效: " + k);
  const rows = [
    ["基础页面导航版（含" + p.includedPages + "页面）", p.basePrice],
  ];
  if (c.pageCount > p.includedPages)
    rows.push([
      "额外页面 × " + (c.pageCount - p.includedPages),
      (c.pageCount - p.includedPages) * p.extraPage,
    ]);
  if (c.backendMode === "CLOUDBASE") rows.push(["CloudBase 接入", p.cloudbase]);
  if (c.backendMode === "REST_API") rows.push(["REST API 接入", p.restApi]);
  if (c.admin) rows.push(["基础后台", p.admin]);
  for (const k of [
    "booking",
    "order",
    "member",
    "points",
    "payment",
    "product",
  ])
    if (c.features[k]) rows.push([k + " 模块", p[k]]);
  if (c.extraRevisions)
    rows.push([
      "额外修改 × " + c.extraRevisions,
      c.extraRevisions * p.extraRevision,
    ]);
  return { rows, total: rows.reduce((n, r) => n + r[1], 0) };
}
export function markdown(c, p) {
  const q = quote(c, p);
  return (
    "# " +
    c.appName +
    " 客户报价单\n\n|项目|金额（元）|\n|---|---:|\n" +
    q.rows.map((r) => "|" + r[0] + "|" + r[1] + "|").join("\n") +
    "\n|合计|" +
    q.total +
    "|\n\n" +
    p.notes +
    "\n\n报价有效期及交付时间双方书面确认。支付、订单、商城、会员、积分尚属二期能力，单列报价不代表已实现。699页面版不含预约业务、后台及云服务。\n"
  );
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const a = args(process.argv.slice(2)),
    c = read(a.config || "config/client.json"),
    p = read("config/pricing.config.json");
  const output = path.resolve(a.output || ".runtime/客户报价单.md");
  write(output, markdown(c, p));
  console.log(output);
}
