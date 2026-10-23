import { getApiOrigin } from "@/lib/api-environment.mjs";
export async function askAI({
  message,
  token,
  module,
}: {
  message: string;
  token: string;
  module?: string;
}) {
  const res = await fetch(
    `${getApiOrigin()}/api/ai/chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        message,
        context: { module },
      }),
    }
  );

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(payload?.error || payload?.message || 'SmartERP AI could not complete this request.'), {
      status: res.status,
      code: payload?.code,
      error: payload?.error,
    });
  }

  return payload;
}
