// Enhanced authentication system with JWT and httpOnly cookie support
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

interface StoredUserData extends User {
  password: string
}

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

export const signUp = async (userData: SignUpData): Promise<User | null> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    console.log("[v0] Attempting signup with backend:", apiUrl)

    const response = await fetch(`${apiUrl}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Signup failed" }))
      console.error("[v0] Backend signup error:", error)
      return null
    }

    const { user } = await response.json()
    console.log("[v0] Backend signup successful:", user.email)

    localStorage.setItem("smarterp_user", JSON.stringify(user))
    localStorage.setItem("smarterp_user_id", user.id)

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
    localStorage.setItem("smarterp_user_id", newUser.id)
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
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Login failed" }))
      console.error("[v0] Backend login error:", error)
      return null
    }

    const { user } = await response.json()
    console.log("[v0] Backend login successful:", user.email)

    localStorage.setItem("smarterp_user", JSON.stringify(user))
    localStorage.setItem("smarterp_user_id", user.id)

    return user
  } catch (error) {
    console.log(
      "[v0] Backend unavailable, falling back to mock auth:",
      error instanceof Error ? error.message : String(error),
    )

    // Fallback to mock auth if backend is unavailable
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const allUsersWithPasswords = getUsersWithPasswords()
    const userWithPassword = allUsersWithPasswords.find((u) => u.email === email)

    if (userWithPassword && userWithPassword.password === password) {
      const { password: _, ...user } = userWithPassword
      localStorage.setItem("smarterp_user", JSON.stringify(user))
      localStorage.setItem("smarterp_user_id", user.id)
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
    }).catch(() => {
      // Ignore errors during logout
    })
  } catch (error) {
    console.error("Logout error:", error)
  }

  localStorage.removeItem("smarterp_user")
  localStorage.removeItem("smarterp_user_id")
  localStorage.removeItem("smarterp-jobs")
  localStorage.removeItem("smarterp-notifications")
  localStorage.removeItem("smarterp-employees")
  localStorage.removeItem("smarterp-chat-messages")
}

export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") return null

  const stored = localStorage.getItem("smarterp_user")
  return stored ? JSON.parse(stored) : null
}

export const getCurrentUserId = (): string | null => {
  if (typeof window === "undefined") return null
  return localStorage.getItem("smarterp_user_id")
}
