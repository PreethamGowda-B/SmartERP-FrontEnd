import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
    const host = request.headers.get("host") || ""
    const protocol = request.headers.get("x-forwarded-proto") || "https"

    // Define the target domain
    const targetDomain = "www.prozync.in"

    // Check if the request is not for the target domain
    if (host !== targetDomain && !host.startsWith("localhost")) {
        const url = new URL(request.url)
        url.host = targetDomain
        url.protocol = "https:"

        // Perform a 301 permanent redirect
        return NextResponse.redirect(url, {
            status: 301,
        })
    }

    // Validate admin route dynamically without exposing the slug to the client
    const adminSlug = process.env.ADMIN_ROUTE || "platform-control-xyz"
    const pathname = request.nextUrl.pathname
    
    // The Next.js router matches ANY random string as [adminRoute] if it's on the top level.
    // We check if the incoming path matches the pattern `/something` and doesn't match the valid slug (nor auth/owner/etc)
    const activeTopLevelPaths = ["/auth", "/owner", "/employee", "/hr", "/privacy", "/terms", "/suspended", "/404", "/api", "/_next"]
    const isTopLevelPath = /^\/[^/]+(\/.*)?$/.test(pathname)
    
    if (isTopLevelPath) {
      const topLevelSegment = pathname.split('/')[1]
      
      // If it's trying to hit what would resolve to [adminRoute], but it's not the actual secret slug
      if (!activeTopLevelPaths.includes(`/${topLevelSegment}`) && topLevelSegment !== adminSlug) {
         // Not a registered generic path, and NOT the admin secret -> Deny access
         const url = new URL("/404", request.url)
         return NextResponse.redirect(url)
      }
    }

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
