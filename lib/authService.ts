import { apiClient } from './apiClient';

export async function login(email: string, password: string) {
  const res = await apiClient('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (res.token) {
    localStorage.setItem('token', res.token);
  }
  return res;
}

export function logout() {
  localStorage.removeItem('token');
}

export function getCurrentUser() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { id: payload.userId, role: payload.role };
  } catch (err) {
    return null;
  }
}
