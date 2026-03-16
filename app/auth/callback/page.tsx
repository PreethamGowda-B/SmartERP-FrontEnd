"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { setTokens } from "@/lib/apiClient"

function CallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { setUser } = useAuth()

    useEffect(() => {
        const userParam = searchParams.get("user")
        const accessToken = searchParams.get("accessToken")
        const refreshToken = searchParams.get("refreshToken")
        const errorParam = searchParams.get("error")

        if (errorParam) {
             router.push(`/login?error=${errorParam}`)
             return
        }

        if (userParam) {
            try {
                const user = JSON.parse(decodeURIComponent(userParam))

                const isSuperAdmin = user.role === "super_admin"

                // ✅ Store tokens in memory for cross-domain API calls
                if (accessToken && refreshToken) {
                    setTokens(accessToken, refreshToken, isSuperAdmin)
                }

                // Store user profile for UI rendering (with isolation)
                const userKey = isSuperAdmin ? "smarterp_admin_user" : "smarterp_user"
                localStorage.setItem(userKey, JSON.stringify(user))

                // Update context
                setUser(user)

                // Redirect based on role
                if (isSuperAdmin) {
                    // Try to use the [adminRoute] from the URL or fallback to the known slug
                    router.push("/super-admin-control-center/dashboard")
                } else if (user.role === "owner") {
                    router.push("/owner")
                } else {
                    router.push("/employee")
                }
            } catch (error) {
                console.error("Error parsing user data:", error)
                router.push("/login?error=auth_failed")
            }
        } else {
            router.push("/login?error=missing_data")
        }
    }, [router, searchParams, setUser])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authenticating...</h2>
            <p className="text-muted-foreground">Please wait while we log you in.</p>
        </div>
    )
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        }>
            <CallbackContent />
        </Suspense>
    )
}
