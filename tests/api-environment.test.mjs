import assert from "node:assert/strict";
import test from "node:test";
import { resolveApiOrigin } from "../lib/api-environment.mjs";

test("missing or invalid app environment fails with setup guidance", () => {
  assert.throws(
    () => resolveApiOrigin({ apiUrl: "http://localhost:4000" }),
    /Set NEXT_PUBLIC_APP_ENV/,
  );
  assert.throws(
    () => resolveApiOrigin({ appEnvironment: "preview", apiUrl: "https://staging.example.test" }),
    /NEXT_PUBLIC_APP_ENV/,
  );
});

test("missing API origin never falls back to the production API", () => {
  assert.throws(
    () => resolveApiOrigin({ appEnvironment: "development" }),
    /No API fallback is used/,
  );
});

test("development accepts an explicitly configured local API and rejects remote hosts", () => {
  assert.equal(
    resolveApiOrigin({ appEnvironment: "development", apiUrl: "http://localhost:4000/" }),
    "http://localhost:4000",
  );
  assert.throws(
    () => resolveApiOrigin({ appEnvironment: "development", apiUrl: "https://api.prozync.in" }),
    /must point to localhost/,
  );
});

test("staging requires HTTPS and rejects known production API hosts", () => {
  assert.equal(
    resolveApiOrigin({ appEnvironment: "staging", apiUrl: "https://staging-api.example.test" }),
    "https://staging-api.example.test",
  );
  assert.throws(
    () => resolveApiOrigin({ appEnvironment: "staging", apiUrl: "https://api.prozync.in" }),
    /cannot use a known production API host/,
  );
  assert.throws(
    () => resolveApiOrigin({ appEnvironment: "staging", apiUrl: "http://staging-api.example.test" }),
    /requires an HTTPS staging API origin/,
  );
});

test("production requires an explicit HTTPS origin and accepts the configured production host", () => {
  assert.equal(
    resolveApiOrigin({ appEnvironment: "production", apiUrl: "https://api.prozync.in/" }),
    "https://api.prozync.in",
  );
  assert.throws(
    () => resolveApiOrigin({ appEnvironment: "production", apiUrl: "http://localhost:4000" }),
    /Production requires an explicitly configured HTTPS API origin/,
  );
});

test("API origin rejects credentials and non-origin paths without echoing values", () => {
  assert.throws(
    () => resolveApiOrigin({ appEnvironment: "production", apiUrl: "https://user:secret@api.example.test" }),
    /without credentials/,
  );
  assert.throws(
    () => resolveApiOrigin({ appEnvironment: "production", apiUrl: "https://api.example.test/api" }),
    /without credentials, path/,
  );
});
