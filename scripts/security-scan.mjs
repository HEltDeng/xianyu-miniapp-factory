import fs from "node:fs";
import { execFileSync } from "node:child_process";
const files = execFileSync("git", ["diff", "--cached", "--name-only", "-z"], {
  encoding: "utf8",
})
  .split("\0")
  .filter(Boolean);
if (!files.length) throw Error("No staged files to inspect");
const failures = [];
for (const f of files) {
  if (
    /(^|\/)(\.env($|\.)|\.runtime\/)|\.(pem|key|jks|keystore|p12|sqlite|db)$/i.test(
      f,
    )
  )
    failures.push(f + ": forbidden file");
  if (/\.(png|jpg)$/.test(f)) continue;
  const s = fs.readFileSync(f, "utf8");
  if (
    /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{30,}|AKID[A-Za-z0-9]{20,}|sk-proj-[A-Za-z0-9_-]{20,}/.test(
      s,
    )
  )
    failures.push(f + ": credential pattern");
}
if (failures.length) throw Error(failures.join("\n"));
console.log(
  JSON.stringify(
    {
      stagedFiles: files.length,
      secretPatterns: "PASS",
      forbiddenFiles: "PASS",
      note: "Automated pattern check plus manual staged-diff review required; fixtures use synthetic data.",
    },
    null,
    2,
  ),
);
