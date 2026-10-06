import { args, read, write } from "./lib.mjs";
const a = args(process.argv.slice(2));
if (!a.file) throw Error("需要 --file catalog.json");
const data = read(a.file);
for (const c of ["banners", "categories", "services", "cases"]) {
  if (!Array.isArray(data[c])) throw Error("缺少集合 " + c);
  const ids = new Set();
  for (const r of data[c]) {
    if (!r.id || ids.has(r.id) || !r.title) throw Error("编号/标题无效");
    ids.add(r.id);
    if (r.image && !/^\/assets\/[a-z0-9-]+\.png$/.test(r.image))
      throw Error("非法资源路径");
  }
}
write("src/data/seed.json", JSON.stringify(data, null, 2));
console.log("Catalog imported; rebuild to apply.");
