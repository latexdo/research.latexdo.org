import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
let rootArg;
let portValue = process.env.PORT;

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === "--port") {
    portValue = args[index + 1];
    index += 1;
  } else if (!arg.startsWith("--") && !rootArg) {
    rootArg = arg;
  }
}

let port = Number(portValue ?? 5173);
const root = path.resolve(repoRoot, rootArg ?? ".");

const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"],
]);

function resolveRequestPath(url) {
  const pathname = decodeURIComponent(new URL(url, "http://localhost").pathname);
  const cleanPath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  return path.join(root, cleanPath === "/" ? "index.html" : cleanPath);
}

async function findFile(requestPath) {
  try {
    const info = await stat(requestPath);
    if (info.isDirectory()) {
      return path.join(requestPath, "index.html");
    }
    return requestPath;
  } catch {
    return path.join(root, "index.html");
  }
}

const server = createServer(async (request, response) => {
  if (!request.url) {
    response.writeHead(400);
    response.end("Bad request");
    return;
  }

  const requestedPath = resolveRequestPath(request.url);
  const filePath = await findFile(requestedPath);
  const relativePath = path.relative(root, filePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    await stat(filePath);
    response.setHeader("Content-Type", mimeTypes.get(path.extname(filePath)) ?? "application/octet-stream");
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

function listen() {
  server.listen(port, () => {
    console.log(`LatexDo Research running at http://localhost:${port}/`);
  });
}

server.on("error", (error) => {
  if (error.code === "EADDRINUSE" && port < 5199) {
    port += 1;
    listen();
    return;
  }

  throw error;
});

listen();
