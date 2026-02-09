"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

function CallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { setUser } = useAuth()

    useEffect(() => {
        const accessToken = searchParams.get("accessToken")
        const refreshToken = searchParams.get("refreshToken")
        const userParam = searchParams.get("user")

        if (accessToken && refreshToken && userParam) {
            try {
                const user = JSON.parse(decodeURIComponent(userParam))

                // Store tokens
                localStorage.setItem("accessToken", accessToken)
                localStorage.setItem("refreshToken", refreshToken)
                localStorage.setItem("user", JSON.stringify({ ...user, accessToken, refreshToken }))

                // Update context
                setUser({ ...user, accessToken, refreshToken })

                // Redirect based on role
                if (user.role === "owner") {
                    router.push("/owner")
                } else {
                    router.push("/employee")
                }
            } catch (error) {
                console.error("Error parsing user data:", error)
                router.push("/login?error=auth_failed")
            }
        } else {
            router.push("/login?error=missing_tokens")
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
