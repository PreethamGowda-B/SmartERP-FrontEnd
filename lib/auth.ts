import { setTokens, clearTokens } from "@/lib/apiClient"
import { logger } from "./logger"
export interface User {
  id: string
  email: string
  name: string
  role: "owner" | "employee" | "super_admin" | "hr"
  avatar?: string
  phone?: string
  position?: string
  department?: string
  accessToken?: string
  refreshToken?: string
  company_id?: string | number
  company_code?: string
}


export interface SignUpData {
  email: string
  password: string
  name: string
  role: "owner" | "employee" | "hr"
  phone?: string
  position?: string
  department?: string
  company_code?: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
}

// User authentication system (mock offline fallback — no passwords stored)
interface StoredUserData extends User {
  passwordHash: string // only a hash for offline comparison, never plaintext
}

const getMockUsers = (): StoredUserData[] => {
  if (typeof window === "undefined") return []
  const stored = sessionStorage.getItem("smarterp_mock_users")
  if (stored) {
    try { return JSON.parse(stored) } catch { return [] }
  }
  return []
}

const saveMockUsers = (users: StoredUserData[]) => {
  if (typeof window === "undefined") return
  // Use sessionStorage (cleared on tab close) instead of localStorage
  sessionStorage.setItem("smarterp_mock_users", JSON.stringify(users))
}

// Simple hash for offline mock auth (not cryptographic — use only in fallback)
const simpleHash = (str: string): string => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return String(hash)
}

export const signUp = async (userData: SignUpData): Promise<User | null> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    logger.log("[v0] Attempting signup with backend:", apiUrl)

    const response = await fetch(`${apiUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      mode: "cors",
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Signup failed" }))
      logger.error("[v0] Backend signup error:", error)
      // Return a special object so the caller can show the real error message
      throw new Error(error.message || "Signup failed")
    }

    const data = await response.json()
    const { user, company_code } = data
    logger.log("[v0] Backend signup successful:", user.email)

    // If owner, store the company_code so the settings page can show it immediately
    const userWithMeta = { ...user, company_code: company_code || user.company_code }
    localStorage.setItem("smarterp_user", JSON.stringify(userWithMeta))
    if (company_code) localStorage.setItem("company_code", company_code)

    return userWithMeta
  } catch (error) {
    logger.log(
      "[v0] Backend unavailable, falling back to mock auth:",
      error instanceof Error ? error.message : String(error),
    )

    // Fallback to mock auth if backend is unavailable
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const allMockUsers = getMockUsers()

    if (allMockUsers.some((user) => user.email === userData.email)) {
      logger.log("[v0] Mock auth: Email already exists")
      return null
    }

    const newMockUser: StoredUserData = {
      id: Date.now().toString(),
      email: userData.email,
      name: userData.name,
      role: userData.role,
      phone: userData.phone,
      position: userData.position,
      department: userData.department,
      passwordHash: simpleHash(userData.password), // never store plaintext
    }

    saveMockUsers([...allMockUsers, newMockUser])
    logger.log("[v0] Mock auth: User created successfully")

    const { passwordHash, ...newUser } = newMockUser
    return newUser
  }
}

export const signIn = async (email: string, password: string): Promise<User | null> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    logger.log("[v0] Attempting login with backend:", apiUrl)

    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      mode: "cors",
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Login failed" }))
      logger.error("[v0] Backend login error:", errorData)
      
      // 🚀 Handle account suspension with direct redirect
      if (errorData.error === "company_suspended") {
        if (typeof window !== "undefined") {
          window.location.href = "/suspended"
          return null
        }
      }
      
      // Throw with details if available (for suspension message)
      throw new Error(errorData.details || errorData.message || "Login failed")
    }

    const data = await response.json()
    const userDetails = data.user || data
    const isSuperAdmin = userDetails.role === 'super_admin'

    // ✅ Store tokens in memory for Authorization header (cross-domain safe)
    if (data.accessToken && data.refreshToken) {
      setTokens(data.accessToken, data.refreshToken, isSuperAdmin)
    }

    // ✅ Store user profile (name, email, role) for UI rendering only
    const userKey = isSuperAdmin ? "smarterp_admin_user" : "smarterp_user"
    localStorage.setItem(userKey, JSON.stringify(userDetails))

    return userDetails
  } catch (error) {
    if (error instanceof Error) {
      logger.error("[v0] Authentication failed:", error.message)
    }
    throw error
  }
}


export const signOut = async (): Promise<void> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    await fetch(`${apiUrl}/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      mode: "cors",
    }).catch(() => {
      // Ignore errors during logout
    })
  } catch (error) {
    logger.error("Logout error:", error)
  }

  clearTokens()
  localStorage.removeItem("smarterp_user")
  localStorage.removeItem("smarterp_admin_user")
  sessionStorage.removeItem("smarterp_mock_users")

  // ✅ Notify Android bridge to clear native session
  if (typeof window !== "undefined" && (window as any).Android?.logout) {
    (window as any).Android.logout()
  }
}

export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") return null

  // Priority: If on an admin path, check admin user first
  const adminSlug = process.env.NEXT_PUBLIC_ADMIN_ROUTE || 'platform-control-xyz'
  const pathname = window.location.pathname
  const isAdminPath = pathname.includes(`/${adminSlug}`) || 
                      pathname.includes('/super-admin') || 
                      pathname.includes('[adminRoute]')

  if (isAdminPath) {
    const adminStored = localStorage.getItem("smarterp_admin_user")
    if (adminStored) return JSON.parse(adminStored)
  }

  const stored = localStorage.getItem("smarterp_user") || localStorage.getItem("smarterp_admin_user")
  return stored ? JSON.parse(stored) : null
}
