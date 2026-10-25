import test from "node:test";
import assert from "node:assert/strict";
import { isSuperAdminHost, isSuperAdminPath, isSuperAdminPortalContext } from "../lib/superadmin-routing.mjs";

test("Super Admin portal context is restricted to its dedicated production host", () => {
  assert.equal(isSuperAdminPortalContext("superadmin.prozync.in", "/"), true);
  assert.equal(isSuperAdminPortalContext("www.prozync.in", "/superadmin/login"), false);
  assert.equal(isSuperAdminPortalContext("www.prozync.in", "/owner"), false);
  assert.equal(isSuperAdminHost("superadmin.prozync.in"), true);
  assert.equal(isSuperAdminHost("www.prozync.in"), false);
});

test("Super Admin routes are matched by path boundary, not by a configured slug", () => {
  assert.equal(isSuperAdminPath("/superadmin"), true);
  assert.equal(isSuperAdminPath("/superadmin/login"), true);
  assert.equal(isSuperAdminPath("/owner"), false);
  assert.equal(isSuperAdminPath("/admin"), false);
});

test("localhost can use the explicit Super Admin development route", () => {
  assert.equal(isSuperAdminPortalContext("localhost", "/superadmin/login"), true);
  assert.equal(isSuperAdminPortalContext("127.0.0.1", "/owner"), false);
});
