import assert from "node:assert/strict";
import { once } from "node:events";
import { access, readFile } from "node:fs/promises";
import { createServer } from "node:http";

// Exercise production logging and the exact entry that Vercel packages.
process.env.NODE_ENV = "production";

for (const file of ["dist/app.js", "dist/server.js", "public/.gitkeep"]) {
  await access(new URL(`../${file}`, import.meta.url));
}

const vercel = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
assert.equal(vercel.outputDirectory, "public");
assert.equal(vercel.framework, null);
assert.ok(vercel.functions["api/index.js"].includeFiles.includes("src/modules/**/*.docs.ts"));
assert.ok(vercel.functions["api/index.js"].includeFiles.includes("swagger-ui-dist"));

const { default: app } = await import("../api/index.js");
assert.equal(typeof app, "function", "The Vercel entry must export the Express app");

const server = createServer(app);
try {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const [path, contentType, expected] of [
    ["/", "text/html", "FixItNow Backend Server"],
    ["/docs/", "text/html", "swagger-ui"],
    ["/docs/swagger-ui.css", "text/css", ".swagger-ui"],
    ["/docs/swagger-ui-bundle.js", "javascript", "SwaggerUIBundle"],
    ["/docs/swagger-ui-init.js", "javascript", "/api/admin/services"],
  ]) {
    const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(10000) });
    assert.equal(response.status, 200, `${path} must return 200`);
    assert.ok(response.headers.get("content-type")?.includes(contentType), `${path} content type`);
    assert.ok((await response.text()).includes(expected), `${path} content is missing ${expected}`);
    console.log(`PASS ${path}`);
  }
  console.log("PASS production API entry and documentation assets (no database writes)");
} finally {
  server.closeAllConnections();
  if (server.listening) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}
