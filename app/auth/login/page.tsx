"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { LoginForm } from "@/components/login-form"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !isLoading) {
      const adminRoute = process.env.NEXT_PUBLIC_ADMIN_ROUTE
      if (user.role === "super_admin") {
        router.push(adminRoute ? `/${adminRoute}` : "/superadmin")
      } else if (user.role === "owner") {
        router.push("/owner")
      } else if (user.role === "hr") {
        router.push("/hr")
      } else if (user.role === "employee") {
        router.push("/employee")
      }
    }
  }, [user?.id, user?.role, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return <LoginForm />
}
