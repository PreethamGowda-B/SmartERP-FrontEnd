import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Page Not Found | SmartERP",
  description: "The page you are looking for does not exist.",
}

/**
 * app/not-found.tsx
 *
 * Next.js 14 App Router built-in 404 handler.
 * Also rendered when middleware redirects to /not-found for unknown routes.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Glowing 404 */}
        <div className="relative mb-6 inline-block">
          <span
            className="text-[8rem] font-black text-transparent bg-clip-text
                       bg-gradient-to-br from-indigo-400 to-purple-500
                       leading-none select-none"
            aria-hidden="true"
          >
            404
          </span>
          <span className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          Page not found
        </h1>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          The page you are looking for doesn&apos;t exist or you may not have
          permission to access it.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="
              inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold
              bg-indigo-600 hover:bg-indigo-500 text-white
              transition-colors shadow-lg shadow-indigo-900/40
            "
          >
            Go to Homepage
          </Link>
          <Link
            href="/auth/login"
            className="
              inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium
              text-slate-400 hover:text-white border border-white/10 hover:border-white/20
              bg-white/5 hover:bg-white/10 transition-all
            "
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
