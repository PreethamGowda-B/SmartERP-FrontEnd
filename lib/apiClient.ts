export async function apiClient(path: string, options: RequestInit = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Send cookies by default (for httpOnly cookie auth)
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401) {
    // try refresh
    await fetch(`${baseUrl}/api/auth/refresh`, { method: 'POST', credentials: 'include' });
    // retry original request
    const retry = await fetch(`${baseUrl}${path}`, { ...options, headers, credentials: 'include' });
    if (!retry.ok) {
      const error = await retry.json().catch(() => ({ message: retry.statusText }));
      throw error;
    }
    return retry.json();
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw error;
  }

  return res.json();
}
