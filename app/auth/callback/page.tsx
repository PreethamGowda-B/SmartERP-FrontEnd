"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { setTokens, logger } from "@/lib/apiClient"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://smarterp-backendend.onrender.com"

// ✅ SECURE OAuth callback — exchanges a short-lived one-time code for session cookies
// Tokens are NEVER passed through the URL (no browser history / Referer leak)
async function exchangeOAuthCode(code: string): Promise<{ user: any } | null> {
    try {
        const res = await fetch(`${API_BASE}/api/auth/exchange-code`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ code }),
        })
        if (!res.ok) return null
        return await res.json()
    } catch (err) {
        logger.error("OAuth code exchange failed:", err)
        return null
    }
}

function CallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { setUser } = useAuth()

    useEffect(() => {
        const code = searchParams.get("code")
        const errorParam = searchParams.get("error")

        if (errorParam) {
            router.push(`/login?error=${errorParam}`)
            return
        }

        if (!code) {
            router.push("/login?error=missing_code")
            return
        }

        // Fallback: handle legacy user param (non-Redis fallback path from backend)
        const userParam = searchParams.get("user")
        if (code === "fallback" && userParam) {
            try {
                const user = JSON.parse(decodeURIComponent(userParam))
                const isSuperAdmin = user.role === "super_admin"
                const userKey = isSuperAdmin ? "smarterp_admin_user" : "smarterp_user"
                localStorage.setItem(userKey, JSON.stringify(user))
                setUser(user)
                // Note: no tokens available in fallback path — user will need to refresh on next load
                if (isSuperAdmin) {
                    const adminRoute = process.env.NEXT_PUBLIC_ADMIN_ROUTE
                    if (adminRoute) router.push(`/${adminRoute}/dashboard`)
                    else router.push("/not-found")
                } else if (user.role === "owner") {
                    router.push("/owner")
                } else {
                    router.push("/employee")
                }
            } catch {
                router.push("/login?error=auth_failed")
            }
            return
        }

        // Primary path: exchange the one-time code
        exchangeOAuthCode(code).then((result) => {
            if (!result || !result.user) {
                router.push("/login?error=auth_failed")
                return
            }

            const user = result.user
            const isSuperAdmin = user.role === "super_admin"

            // Store tokens in sessionStorage — same as regular email/password login
            // Without this, the auth context background refresh fires with no token and logs the user out
            if (result.accessToken && result.refreshToken) {
                setTokens(result.accessToken, result.refreshToken, isSuperAdmin)
            }

            // Store user profile for UI rendering only (no tokens in storage)
            const userKey = isSuperAdmin ? "smarterp_admin_user" : "smarterp_user"
            localStorage.setItem(userKey, JSON.stringify(user))

            setUser(user)

            // Redirect based on role — admin route comes from env, never hardcoded
            if (isSuperAdmin) {
                const adminRoute = process.env.NEXT_PUBLIC_ADMIN_ROUTE
                if (!adminRoute) {
                    logger.error("NEXT_PUBLIC_ADMIN_ROUTE is not set")
                    router.push("/not-found")
                    return
                }
                router.push(`/${adminRoute}/dashboard`)
            } else if (user.role === "owner") {
                router.push("/owner")
            } else {
                router.push("/employee")
            }
        })
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
