function portalForPath(pathname) {
  if (pathname.startsWith("/employee")) return "employee";
  if (pathname.startsWith("/hr")) return "hr";
  if (pathname.startsWith("/customer")) return "customer";
  if (pathname.startsWith("/superadmin")) return "superadmin";
  return "owner";
}

function moduleForPath(pathname) {
  const segments = String(pathname || "").split("/").filter(Boolean);
  return segments.length > 1 ? segments[1] : "overview";
}

export async function requestAiAgentResponse({ apiClient, message, pathname, history = [], onFeatureLocked = () => {} }) {
  const currentPortal = portalForPath(pathname);
  const currentModule = moduleForPath(pathname);
  try {
    return await apiClient("/api/ai/agent", {
      method: "POST",
      timeoutMs: 30000,
      body: JSON.stringify({
        message,
        currentPortal,
        currentModule,
        currentPagePath: pathname,
        clientContext: { currentPage: pathname, portal: currentPortal, module: currentModule },
        history: history.map((item) => ({ sender: item.sender, content: item.text })),
      }),
    });
  } catch (error) {
    if (error?.status === 403 && error?.upgrade_required) {
      if (!error.handled) onFeatureLocked(error);
      throw Object.assign(new Error("PLAN_LOCKED"), { code: 'PLAN_LOCKED', status: 403 });
    }
    // Preserve the server's safe code/status so the chat UI can distinguish
    // prompt refusal, missing permissions, data outages, and provider failures.
    throw error;
  }
}

export async function confirmAiAgentAction({ apiClient, toolName, params }) {
  try {
    return await apiClient("/api/ai/confirm-action", {
      method: "POST",
      body: JSON.stringify({ toolName, params }),
    });
  } catch (error) {
    throw error;
  }
}
