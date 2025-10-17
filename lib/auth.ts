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
  await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call

  const allUsersWithPasswords = getUsersWithPasswords()

  // Check if email already exists
  if (allUsersWithPasswords.some((user) => user.email === userData.email)) {
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

  // Add to users list and save
  const updatedUsers = [...allUsersWithPasswords, newUserWithPassword]
  saveUsersWithPasswordsToStorage(updatedUsers)

  if (userData.role === "employee") {
    // Store notification for owner to see
    const ownerNotification = {
      type: "info" as const,
      title: "New Employee Registration",
      message: `${userData.name} has created an employee account and is waiting for approval.`,
      priority: "medium" as const,
      data: { newEmployeeId: newUserWithPassword.id, employeeData: userData },
    }

    // Save notification to localStorage for owner to see
    const existingNotifications = JSON.parse(localStorage.getItem("smarterp-notifications") || "[]")
    const newNotification = {
      ...ownerNotification,
      id: Date.now().toString(),
      time: new Date().toISOString(),
      read: false,
    }
    localStorage.setItem("smarterp-notifications", JSON.stringify([newNotification, ...existingNotifications]))
  }

  // Return user without password
  const { password, ...newUser } = newUserWithPassword
  return newUser
}

export const signIn = async (email: string, password: string): Promise<User | null> => {
  // Mock authentication - in production, this would validate against a real backend
  await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API call

  const allUsersWithPasswords = getUsersWithPasswords()
  const userWithPassword = allUsersWithPasswords.find((u) => u.email === email)

  if (userWithPassword && userWithPassword.password === password) {
    // Return user without password and store in session
    const { password: _, ...user } = userWithPassword
    localStorage.setItem("smarterp_user", JSON.stringify(user))
    return user
  }
  return null
}

export const signOut = async (): Promise<void> => {
  localStorage.removeItem("smarterp_user")
}

export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") return null

  const stored = localStorage.getItem("smarterp_user")
  return stored ? JSON.parse(stored) : null
}
