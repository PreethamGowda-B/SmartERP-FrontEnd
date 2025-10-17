import fetch from 'node-fetch';

export async function getUserFromServer(cookieHeader: string | undefined, apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000') {
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
