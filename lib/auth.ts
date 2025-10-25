// ✅ SmartERP - Unified Authentication System
export interface User {
  id: string;
  email: string;
  name?: string;
  role: "owner" | "employee";
  avatar?: string;
  phone?: string;
  position?: string;
  department?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name?: string; // ✅ optional for employees
  role: "owner" | "employee";
  phone?: string;
  position?: string;
  department?: string;
}

export const signUp = async (userData: SignUpData): Promise<User | null> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    console.log("[SmartERP] Signing up via backend:", apiUrl);

    const response = await fetch(`${apiUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(userData),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("[SmartERP] Signup failed:", data);
      return null;
    }

    const user = data.user || data;
    localStorage.setItem("smarterp_user", JSON.stringify(user));
    localStorage.setItem("smarterp_user_id", user.id);
    console.log("[SmartERP] Signup success:", user.email);
    return user;
  } catch (error) {
    console.error("[SmartERP] Signup error:", error);
    return null;
  }
};

export const signIn = async (email: string, password: string): Promise<User | null> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    console.log("[SmartERP] Logging in via backend:", apiUrl);

    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error("[SmartERP] Login failed:", data);
      return null;
    }

    const user = data.user || data;
    localStorage.setItem("smarterp_user", JSON.stringify(user));
    localStorage.setItem("smarterp_user_id", user.id);
    console.log("[SmartERP] Login success:", user.email);
    return user;
  } catch (error) {
    console.error("[SmartERP] Login error:", error);
    return null;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    await fetch(`${apiUrl}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
  } catch (error) {
    console.error("Logout error:", error);
  }

  localStorage.removeItem("smarterp_user");
  localStorage.removeItem("smarterp_user_id");
  localStorage.removeItem("smarterp-jobs");
  localStorage.removeItem("smarterp-notifications");
  localStorage.removeItem("smarterp-employees");
  localStorage.removeItem("smarterp-chat-messages");
};

export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("smarterp_user");
  return stored ? JSON.parse(stored) : null;
};

export const getCurrentUserId = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("smarterp_user_id");
};
