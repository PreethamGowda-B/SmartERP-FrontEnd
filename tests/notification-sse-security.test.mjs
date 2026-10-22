import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const notificationContext = fs.readFileSync(
  path.join(currentDirectory, "..", "contexts", "notification-context.tsx"),
  "utf8",
);

test("notifications EventSource keeps credentials enabled and never puts a token in its URL", () => {
  assert.match(notificationContext, /const sseUrl = `\$\{BACKEND_URL\}\/api\/notifications\/sse`/);
  assert.match(notificationContext, /new EventSource\(sseUrl,\s*\{\s*withCredentials:\s*true/);
  assert.doesNotMatch(notificationContext, /notifications\/sse\?token=/);
});
