import { getApiOrigin } from "@/lib/api-environment.mjs";
// Using native global fetch

export async function getUserFromServer(cookieHeader: string | undefined, apiBase = getApiOrigin()) {
  if (!cookieHeader) return null;
  try {
    const res = await fetch(`${apiBase}/api/users/me`, {
      headers: { Cookie: cookieHeader },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}
