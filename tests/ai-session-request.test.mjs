import test from "node:test";
import assert from "node:assert/strict";
import { confirmAiAgentAction, requestAiAgentResponse } from "../lib/ai-session-request.mjs";

test("Owner attendance summary uses the active authenticated API client and company context from the server", async () => {
  const calls = [];
  const result = await requestAiAgentResponse({
    apiClient: async (...args) => { calls.push(args); return { text: "Attendance summary" }; },
    message: "Show today's attendance summary",
    pathname: "/owner/attendance",
    history: [{ sender: "user", text: "Earlier question" }],
  });

  assert.equal(calls[0][0], "/api/ai/agent");
  assert.equal(calls[0][1].method, "POST");
  const body = JSON.parse(calls[0][1].body);
  assert.equal(body.currentPortal, "owner");
  assert.equal(body.currentPagePath, "/owner/attendance");
  assert.equal(body.message, "Show today's attendance summary");
  assert.equal("companyId" in body, false);
  assert.equal(result.text, "Attendance summary");
});

test("AI service/tool errors are surfaced without calling a logout action", async () => {
  const error = Object.assign(new Error("Attendance summary is temporarily unavailable."), { status: 503 });
  let featureLockCalls = 0;
  await assert.rejects(requestAiAgentResponse({
    apiClient: async () => { throw error; },
    message: "Attendance summary",
    pathname: "/owner/attendance",
    onFeatureLocked: () => { featureLockCalls += 1; },
  }), /temporarily unavailable/i);
  assert.equal(featureLockCalls, 0);
});

test("a real 401 remains visible to the shared API client's authentication handling", async () => {
  const error = Object.assign(new Error("Session is no longer valid"), { status: 401 });
  await assert.rejects(requestAiAgentResponse({
    apiClient: async () => { throw error; },
    message: "Attendance summary",
    pathname: "/owner/attendance",
  }), /Session is no longer valid/);
});

test("AI plan denial invokes its lock callback unless already handled by apiClient", async () => {
  let calls = 0;
  const denied = Object.assign(new Error("Plan required"), { status: 403, upgrade_required: true });
  await assert.rejects(requestAiAgentResponse({
    apiClient: async () => { throw denied; },
    message: "Enterprise forecast",
    pathname: "/owner/ai",
    onFeatureLocked: () => { calls += 1; },
  }), /PLAN_LOCKED/);
  assert.equal(calls, 1);
  denied.handled = true;
  await assert.rejects(requestAiAgentResponse({
    apiClient: async () => { throw denied; },
    message: "Enterprise forecast",
    pathname: "/owner/ai",
    onFeatureLocked: () => { calls += 1; },
  }), /PLAN_LOCKED/);
  assert.equal(calls, 1);
});

test("confirmed AI actions also use the authenticated shared API client", async () => {
  let call;
  const result = await confirmAiAgentAction({
    apiClient: async (...args) => { call = args; return { success: true }; },
    toolName: "attendance_summary",
    params: { date: "today" },
  });
  assert.equal(call[0], "/api/ai/confirm-action");
  assert.equal(JSON.parse(call[1].body).toolName, "attendance_summary");
  assert.equal(result.success, true);
});
