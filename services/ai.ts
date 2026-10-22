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

  if (!res.ok) {
    throw new Error("AI request failed");
  }

  return res.json();
}
