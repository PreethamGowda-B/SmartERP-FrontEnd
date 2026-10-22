import test from "node:test";
import assert from "node:assert/strict";
import {
  completeStaffPasswordReset,
  validateStaffPasswordResetForm,
} from "../lib/password-reset-flow.mjs";

test("correct OTP is verified before a password update and persists the reset authorization for retries", async () => {
  const calls = [];
  let savedToken = "";
  const result = await completeStaffPasswordReset({
    request: async (path, options) => {
      calls.push({ path, body: JSON.parse(options.body) });
      if (path.endsWith("verify-reset-otp")) return { verified: true, reset_token: "one-use-reset-authorization" };
      return { success: true, message: "updated" };
    },
    email: "Google.Employee@Example.test",
    otp: "123456",
    password: "ValidPassword@123",
    onVerified: (token) => { savedToken = token; },
  });
  assert.equal(calls[0].path, "/api/auth/verify-reset-otp");
  assert.equal(calls[0].body.email, "google.employee@example.test");
  assert.equal(calls[1].path, "/api/auth/reset-password");
  assert.equal(calls[1].body.reset_token, "one-use-reset-authorization");
  assert.equal(calls[1].body.otp, undefined);
  assert.equal(savedToken, "one-use-reset-authorization");
  assert.equal(result.success, true);
});

test("incorrect or expired OTP errors do not attempt a password update", async () => {
  const calls = [];
  await assert.rejects(completeStaffPasswordReset({
    request: async (path) => { calls.push(path); throw Object.assign(new Error("The verification code is incorrect or expired."), { status: 400 }); },
    email: "employee@example.test",
    otp: "000000",
    password: "ValidPassword@123",
  }), /incorrect or expired/i);
  assert.deepEqual(calls, ["/api/auth/verify-reset-otp"]);
});

test("a stored reset token allows retrying an uncertain password-update response without reusing the OTP", async () => {
  const calls = [];
  await completeStaffPasswordReset({
    request: async (path, options) => {
      calls.push({ path, body: JSON.parse(options.body) });
      return { success: true };
    },
    email: "employee@example.test",
    otp: "123456",
    password: "ValidPassword@123",
    resetToken: "already-verified-token",
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, "/api/auth/reset-password");
  assert.equal(calls[0].body.reset_token, "already-verified-token");
});

test("API failure is not treated as password-reset success", async () => {
  await assert.rejects(completeStaffPasswordReset({
    request: async () => ({ success: false, message: "Password update failed." }),
    email: "employee@example.test",
    otp: "123456",
    password: "ValidPassword@123",
    resetToken: "verified-token",
  }), /Password update failed/);
});

test("password confirmation, strength, and OTP shape are validated before requests", () => {
  assert.match(validateStaffPasswordResetForm({ otp: "123", password: "ValidPassword@123", confirmation: "ValidPassword@123" }), /6-digit/);
  assert.match(validateStaffPasswordResetForm({ otp: "123456", password: "weak", confirmation: "weak" }), /8 characters/);
  assert.match(validateStaffPasswordResetForm({ otp: "123456", password: "ValidPassword@123", confirmation: "DifferentPassword@123" }), /do not match/);
  assert.equal(validateStaffPasswordResetForm({ otp: "123456", password: "ValidPassword@123", confirmation: "ValidPassword@123" }), null);
});
