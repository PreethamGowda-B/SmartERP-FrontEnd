import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Paths that are always allowed through — never redirect these or you get infinite loops
const ALWAYS_ALLOWED = [
  "/not-found", "/suspended", "/privacy", "/terms",
  "/auth", "/owner", "/employee", "/hr", "/customer", "/videos",
  "/api", "/_next", "/monitoring",
]

export function middleware(request: NextRequest) {
    const host = request.headers.get("host") || ""
    const pathname = request.nextUrl.pathname

    // Gracefully handle /landing by redirecting to root landing page /
    if (pathname === "/landing") {
        return NextResponse.redirect(new URL("/", request.url), { status: 301 })
    }

    // 1. Root path and public routes pass through immediately — never apply admin validation to these
    if (pathname === "/" || ALWAYS_ALLOWED.some(p => pathname === p || pathname.startsWith(p + "/"))) {
        return NextResponse.next()
    }

    // 2. Allowed hosts for this Next.js app:
    //   - www.prozync.in / prozync.in  → main SmartERP frontend
    //   - client.prozync.in            → Prozync Customer Portal
    //   - *.vercel.app                 → Vercel preview/staging deployments
    //   - localhost:*                  → local development
    const allowedHosts = ["www.prozync.in", "prozync.in", "client.prozync.in"]
    const isAllowedHost = allowedHosts.some(h => host === h) || host.startsWith("localhost") || host.endsWith(".vercel.app")

    // Redirect unknown hosts to the main domain
    if (!isAllowedHost) {
        const url = new URL(request.url)
        url.host = "www.prozync.in"
        url.protocol = "https:"
        return NextResponse.redirect(url, { status: 301 })
    }

    // 3. Admin Route Validation:
    // Next.js App Router matches any top-level string (e.g. /some-slug) against [adminRoute].
    // Scope admin slug validation strictly to unrecognized top-level paths.
    const activeTopLevelPaths = [
      "/auth", "/owner", "/employee", "/hr",
      "/customer", "/videos",
      "/privacy", "/terms", "/suspended", "/not-found",
      "/api", "/_next", "/monitoring", "/backend-test",
    ]
    const isTopLevelPath = /^\/[^/]+(\/.*)?$/.test(pathname)

    if (isTopLevelPath) {
      const topLevelSegment = pathname.split('/')[1]

      // If targeting an unrecognized top-level segment (potential [adminRoute] access):
      if (!activeTopLevelPaths.includes(`/${topLevelSegment}`)) {
        const adminSlug = process.env.ADMIN_ROUTE || process.env.NEXT_PUBLIC_ADMIN_ROUTE;
        if (!adminSlug || topLevelSegment !== adminSlug) {
          return NextResponse.rewrite(new URL("/not-found", request.url))
        }
      }
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths EXCEPT:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico
         * - Public static files that must NEVER be redirected:
         *     sw.js              → ServiceWorker (redirect = SecurityError)
         *     firebase-messaging-sw.js → Firebase SW (redirect = SecurityError)
         *     manifest.json      → PWA manifest (redirect = 404 loop)
         *     All files with extensions (.js, .json, .png, .svg, .txt, .xml, .mp3, .mp4, .webm, .ogv, .jpg, .webp, .ico, .woff2)
         */
        "/((?!api|_next/static|_next/image|favicon\\.ico|sw\\.js|firebase-messaging-sw\\.js|manifest\\.json|robots\\.txt|sitemap\\.xml|.*\\.(?:png|svg|jpg|jpeg|webp|gif|ico|mp3|woff|woff2|ttf|eot|css|js|json|xml|txt)).*)",
    ],
}
