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
