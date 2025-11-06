// Mock authentication system for SmartERP
export interface User {
  id: string
  email: string
  name: string
  role: "owner" | "employee"
  avatar?: string
  phone?: string
  position?: string
  department?: string
  accessToken?: string
  refreshToken?: string
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

// User authentication system
interface StoredUserData extends User {
  password: string
}

const mockUsersWithPasswords: StoredUserData[] = []

const getUsersWithPasswords = (): StoredUserData[] => {
  if (typeof window === "undefined") return []

  const stored = localStorage.getItem("smarterp_users_with_passwords")
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return []
}

const saveUsersWithPasswordsToStorage = (users: StoredUserData[]) => {
  if (typeof window === "undefined") return
  localStorage.setItem("smarterp_users_with_passwords", JSON.stringify(users))
}

const getStoredUsers = (): User[] => {
  const usersWithPasswords = getUsersWithPasswords()
  return usersWithPasswords.map(({ password, ...user }) => user)
}

const saveUsersToStorage = (users: User[]) => {
  if (typeof window === "undefined") return
  localStorage.setItem("smarterp_users", JSON.stringify(users))
}

export const signUp = async (userData: SignUpData): Promise<User | null> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    console.log("[v0] Attempting signup with backend:", apiUrl)

    const response = await fetch(`${apiUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      mode: "cors",
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Signup failed" }))
      console.error("[v0] Backend signup error:", error)
      return null
    }

    const { user } = await response.json()
    console.log("[v0] Backend signup successful:", user.email)

    // Store user locally for quick access
    localStorage.setItem("smarterp_user", JSON.stringify(user))

    return user
  } catch (error) {
    console.log(
      "[v0] Backend unavailable, falling back to mock auth:",
      error instanceof Error ? error.message : String(error),
    )

    // Fallback to mock auth if backend is unavailable
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const allUsersWithPasswords = getUsersWithPasswords()

    if (allUsersWithPasswords.some((user) => user.email === userData.email)) {
      console.log("[v0] Mock auth: Email already exists")
      return null
    }

    const newUserWithPassword: StoredUserData = {
      id: Date.now().toString(),
      email: userData.email,
      name: userData.name,
      role: userData.role,
      phone: userData.phone,
      position: userData.position,
      department: userData.department,
      password: userData.password,
    }

    const updatedUsers = [...allUsersWithPasswords, newUserWithPassword]
    saveUsersWithPasswordsToStorage(updatedUsers)
    console.log("[v0] Mock auth: User created successfully")

    if (userData.role === "employee") {
      const ownerNotification = {
        type: "info" as const,
        title: "New Employee Registration",
        message: `${userData.name} has created an employee account and is waiting for approval.`,
        priority: "medium" as const,
        data: { newEmployeeId: newUserWithPassword.id, employeeData: userData },
      }

      const existingNotifications = JSON.parse(localStorage.getItem("smarterp-notifications") || "[]")
      const newNotification = {
        ...ownerNotification,
        id: Date.now().toString(),
        time: new Date().toISOString(),
        read: false,
      }
      localStorage.setItem("smarterp-notifications", JSON.stringify([newNotification, ...existingNotifications]))
    }

    const { password, ...newUser } = newUserWithPassword
    return newUser
  }
}

export const signIn = async (email: string, password: string): Promise<User | null> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    console.log("[v0] Attempting login with backend:", apiUrl)

    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      mode: "cors",
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Login failed" }))
      console.error("[v0] Backend login error:", error)
      return null
    }

    const data = await response.json()
    console.log("[v0] Backend login successful:", data.user?.email)

    // ✅ Merge tokens with user data
    const userWithTokens = {
      ...data.user,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    }

    // ✅ Store everything for later use
    localStorage.setItem("smarterp_user", JSON.stringify(userWithTokens))
    if (data.accessToken) localStorage.setItem("accessToken", data.accessToken)
    if (data.refreshToken) localStorage.setItem("refreshToken", data.refreshToken)

    return userWithTokens
  } catch (error) {
    console.log(
      "[v0] Backend unavailable, falling back to mock auth:",
      error instanceof Error ? error.message : String(error),
    )

    // 🧩 Fallback: Local mock auth
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const allUsersWithPasswords = getUsersWithPasswords()
    const userWithPassword = allUsersWithPasswords.find((u) => u.email === email)

    if (userWithPassword && userWithPassword.password === password) {
      const { password: _, ...user } = userWithPassword
      localStorage.setItem("smarterp_user", JSON.stringify(user))
      console.log("[v0] Mock auth: Login successful")
      return user
    }

    console.log("[v0] Mock auth: Invalid credentials")
    return null
  }
}


export const signOut = async (): Promise<void> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    await fetch(`${apiUrl}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
      mode: "cors",
    }).catch(() => {
      // Ignore errors during logout
    })
  } catch (error) {
    console.error("Logout error:", error)
  }

  localStorage.removeItem("smarterp_user")
}

export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") return null

  const stored = localStorage.getItem("smarterp_user")
  return stored ? JSON.parse(stored) : null
}
