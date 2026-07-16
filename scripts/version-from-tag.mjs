import { readFile, writeFile } from "node:fs/promises";

const input = process.argv[2] || process.env.GITHUB_REF_NAME || "";
const version = input.replace(/^v/, "");

if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
  throw new Error(`Expected a semantic version tag such as v1.2.3; received ${JSON.stringify(input)}`);
}

const files = [
  "package.json",
  "packages/preview/package.json",
  "packages/react/package.json",
  "packages/vue/package.json",
];

for (const file of files) {
  const json = JSON.parse(await readFile(file, "utf8"));
  json.version = version;
  if (json.dependencies?.["@simple-post/preview"]) {
    json.dependencies["@simple-post/preview"] = version;
  }
  await writeFile(file, `${JSON.stringify(json, null, 2)}\n`);
}

const lock = JSON.parse(await readFile("package-lock.json", "utf8"));
lock.version = version;
lock.packages[""].version = version;
for (const path of ["packages/preview", "packages/react", "packages/vue"]) {
  lock.packages[path].version = version;
  if (lock.packages[path].dependencies?.["@simple-post/preview"]) {
    lock.packages[path].dependencies["@simple-post/preview"] = version;
  }
}
await writeFile("package-lock.json", `${JSON.stringify(lock, null, 2)}\n`);

console.log(`Prepared packages for ${version}`);
