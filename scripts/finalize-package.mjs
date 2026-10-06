import fs from "node:fs";
import { PNG } from "pngjs";
import { read } from "./lib.mjs";
export function finalize(out, c) {
  const hex = c.primaryColor.slice(1),
    rgb = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  for (const f of fs
    .readdirSync(out + "/assets")
    .filter((x) => x.endsWith("-active.png") || x === "logo.png")) {
    const file = out + "/assets/" + f,
      png = PNG.sync.read(fs.readFileSync(file));
    for (let i = 0; i < png.data.length; i += 4)
      if (
        png.data[i] === 40 &&
        png.data[i + 1] === 100 &&
        png.data[i + 2] === 84
      ) {
        [png.data[i], png.data[i + 1], png.data[i + 2]] = rgb;
      }
    fs.writeFileSync(file, PNG.sync.write(png));
  }
  const seed = read(out + "/data/seed.json");
  if (!c.features.case) seed.cases = [];
  if (!c.features.service) seed.services = [];
  if (!c.features.category && !c.features.service) seed.categories = [];
  fs.writeFileSync(out + "/data/seed.json", JSON.stringify(seed));
  const used = new Set();
  for (const f of fs
    .readdirSync(out, { recursive: true })
    .filter((x) => /\.(js|json|wxml)$/.test(x)))
    for (const m of fs
      .readFileSync(out + "/" + f, "utf8")
      .matchAll(/(?:\/assets\/|assets\/)([a-zA-Z0-9_-]+\.png)/g))
      used.add(m[1]);
  for (const f of fs.readdirSync(out + "/assets"))
    if (!used.has(f)) fs.unlinkSync(out + "/assets/" + f);
}
