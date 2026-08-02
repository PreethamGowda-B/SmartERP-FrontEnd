import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // ── Finance GST backward-compat redirects ─────────────────────────────
      // All old GST/reconciliation routes → unified GST & Tax module
      { source: "/owner/gst-reconciliation", destination: "/owner/finance/gst", permanent: false },
      { source: "/owner/finance/gst-reports", destination: "/owner/finance/gst", permanent: false },
      { source: "/owner/finance/gst-reconciliation", destination: "/owner/finance/gst", permanent: false },
      // ── Finance sub-page backward-compat ──────────────────────────────────
      { source: "/owner/invoice-issues", destination: "/owner/finance/invoices?tab=issues", permanent: false },
      { source: "/owner/ar-collections", destination: "/owner/finance/payments?tab=ar", permanent: false },
      { source: "/owner/finance/accounts-receivable", destination: "/owner/finance/payments?tab=ar", permanent: false },
      // ── Employee portal backward-compat ───────────────────────────────────
      { source: "/employee/inventory", destination: "/employee/materials?tab=inventory", permanent: false },
      { source: "/employee/notifications", destination: "/employee/messages?tab=notifications", permanent: false },
    ]
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  trailingSlash: false,
}

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  // Suppresses source map uploading logs during bundling
  silent: true,
  org: "smarterp",
  project: "smarterp-frontend",
}, {
  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Transpiles SDK to be compatible with IE11 (increases bundle size)
  transpileClientSDK: true,

  // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
  tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors.
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
});
