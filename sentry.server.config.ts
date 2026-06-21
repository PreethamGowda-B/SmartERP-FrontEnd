import * as Sentry from "@sentry/nextjs";

Sentry.init({
  // Global DSN from environment variable
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: 1.0,

  // Only run in production
  enabled: process.env.NODE_ENV === "production",

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
