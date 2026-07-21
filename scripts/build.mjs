import { copyFile, mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(root, "dist");
const staticFiles = ["index.html", "style.css", "CNAME", "README.md", "LICENSE"];

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

for (const file of staticFiles) {
  const source = path.join(root, file);
  await stat(source);
  await copyFile(source, path.join(outDir, file));
}

console.log(`Built ${staticFiles.length} files to dist/`);
