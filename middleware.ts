import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define protected route prefixes
const protectedRoutes = {
    owner: "/owner",
    employee: "/employee",
}

// Define the public auth routes where logged-in users shouldn't go
const authRoutes = [
    "/auth/login",
    "/auth/signup",
]

export function middleware(request: NextRequest) {
    const host = request.headers.get("host") || ""
    const pathname = request.nextUrl.pathname

    // 1. Maintain Original Domain Redirect Logic
    const targetDomain = "www.prozync.in"
    if (host !== targetDomain && !host.startsWith("localhost")) {
        // Skip redirect if it's a vercel preview domain
        if (!host.includes("vercel.app")) {
            const url = new URL(request.url)
            url.host = targetDomain
            url.protocol = "https:"

            // Perform a 301 permanent redirect
            return NextResponse.redirect(url, {
                status: 301,
            })
        }
    }

    // 2. Authentication Verification Logic
    // Grab the token cookies issued by the backend
    const userAccess = request.cookies.get("user_access_token")?.value
    const legacyAccess = request.cookies.get("access_token")?.value
    const superAdminAccess = request.cookies.get("superadmin_access_token")?.value
    
    // We consider them authenticated if they have any of these valid cookies
    const isAuthenticated = !!userAccess || !!legacyAccess || !!superAdminAccess

    // 3. Apply Route Protection Policies
    const isOwnerRoute = pathname.startsWith(protectedRoutes.owner)
    const isEmployeeRoute = pathname.startsWith(protectedRoutes.employee)
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

    // Policy A: Unauthenticated users hitting protected routes
    if (!isAuthenticated && (isOwnerRoute || isEmployeeRoute)) {
        const loginUrl = new URL("/auth/login", request.url)
        // Set the redirect URL so they return where they wanted to go after logging in
        loginUrl.searchParams.set("redirect", pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Policy B: Fully authenticated users hitting public auth pages
    if (isAuthenticated && isAuthRoute) {
        // Redirect them to the root homepage.
        // Client-side layout logic or home screen will push them to correct dashboard (owner vs employee).
        const rootUrl = new URL("/", request.url)
        return NextResponse.redirect(rootUrl)
    }

    // Let the request pass normally
    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
}
