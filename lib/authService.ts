// ✅ SmartERP authentication system (FIXED for localStorage token storage)
export interface User {
  id: string
  email: string
  name: string
  role: "owner" | "employee"
  avatar?: string
  phone?: string
  position?: string
  department?: string
}

export interface SignUpData {
  email: string
  password: string
  name: string
  role: "owner" | "employee"
  phone?: string
  position?: string
  department?: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
}

export const signUp = async (userData: SignUpData): Promise<User | null> => {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:4000"

    console.log("[SmartERP] Attempting signup at:", `${baseUrl}/api/auth/signup`)

    const response = await fetch(`${baseUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(userData),
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.message || "Signup failed")

    localStorage.setItem("smarterp_user", JSON.stringify(data.user || data))
    console.log("[SmartERP] Signup success:", data.user?.email || data.email)
    return data.user || data
  } catch (error) {
    console.error("[SmartERP] Signup error:", error)
    return null
  }
}

export const signIn = async (email: string, password: string): Promise<User | null> => {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:4000"

    console.log("[SmartERP] Attempting login at:", `${baseUrl}/api/auth/login`)

    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.message || "Login failed")

    // Store user data
    localStorage.setItem("smarterp_user", JSON.stringify(data.user || data))
    
    // ✅ FIXED: Store tokens in localStorage so they can be used in API requests
    if (data.accessToken) {
      localStorage.setItem("accessToken", data.accessToken)
      console.log("[SmartERP] Access token stored")
    }
    if (data.refreshToken) {
      localStorage.setItem("refreshToken", data.refreshToken)
      console.log("[SmartERP] Refresh token stored")
    }
    
    console.log("[SmartERP] Login success:", data.user?.email || data.email)
    return data.user || data
  } catch (error) {
    console.error("[SmartERP] Login error:", error)
    return null
  }
}

export const signOut = async (): Promise<void> => {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:4000"
    await fetch(`${baseUrl}/api/auth/logout`, { method: "POST", credentials: "include" })
  } catch (err) {
    console.warn("[SmartERP] Logout failed:", err)
  }
  
  // Clear all auth data from localStorage
  localStorage.removeItem("smarterp_user")
  localStorage.removeItem("accessToken")
  localStorage.removeItem("refreshToken")
}

export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") return null
  const stored = localStorage.getItem("smarterp_user")
  return stored ? JSON.parse(stored) : null
}
