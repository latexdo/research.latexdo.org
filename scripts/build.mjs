import { copyFile, cp, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, "dist");
const staticFiles = ["index.html", "style.css", "CNAME", "README.md", "LICENSE"];
const staticDirs = ["assets"];

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

for (const file of staticFiles) {
  const source = path.join(root, file);
  await stat(source);
  await copyFile(source, path.join(outDir, file));
}

for (const directory of staticDirs) {
  const source = path.join(root, directory);
  await stat(source);
  await cp(source, path.join(outDir, directory), { recursive: true });
}

console.log(`Built ${staticFiles.length} files and ${staticDirs.length} directories to dist/`);
