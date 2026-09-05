import type React from "react"
import type { Metadata } from "next"
import Script from "next/script"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { ConditionalAnalytics } from "@/components/ConditionalAnalytics"
import { CookieConsentBanner } from "@/components/CookieConsentBanner"
import { AuthProvider } from "@/contexts/auth-context"
import { SubscriptionProvider } from "@/contexts/subscription-context"
import { LimitProvider } from "@/contexts/limit-context"
import { JobProvider } from "@/contexts/job-context"
import { ClockInGatekeeperProvider } from "@/contexts/clock-in-gatekeeper-context"
import { NotificationProvider } from "@/contexts/notification-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { LockedFeaturePrompt } from "@/components/locked-feature-prompt"
import { SlowNetworkNotice } from "@/components/slow-network-notice"
import { NotificationPermissionPrompt } from "@/components/notification-permission-prompt"
import { Suspense } from "react"
import { LoadingProvider } from "@/contexts/loading-context"
import { CommandRegistryProvider } from "@/contexts/command-registry-context"
import PremiumLoader from "@/components/premium-loader"
import { FloatingActionHub } from "@/components/floating-action-hub"
import { GlobalCommandPalette } from "@/components/global-command-palette"
import { BackgroundSubscriptionPoller } from "@/components/background-subscription-poller"
import { KeyboardShortcutsModal } from "@/components/keyboard-shortcuts-modal"
import { OnboardingTourModal } from "@/components/onboarding-tour-modal"
import { ServerPrewarmer } from "@/components/server-prewarmer"
import { DomRangeErrorSuppressor } from "@/components/dom-range-error-suppressor"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL("https://www.prozync.in"),
  title: {
    default: "SmartERP - Crew Management System",
    template: "%s | SmartERP",
  },
  description: "SmartERP is your complete ERP solution for construction and field service businesses. Streamline crew management, track attendance, process payroll, and manage jobs efficiently.",
  keywords: ["SmartERP", "crew management", "ERP for construction", "field service management", "payroll system", "attendance tracker"],
  authors: [{ name: "SmartERP Team" }],
  creator: "SmartERP",
  publisher: "SmartERP",
  generator: "v0.app",
  verification: {
    google: "8LA9xpb2ecPHIqpRwYsDtlZevGlvnniH4mD3X-qbwsE",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SmartERP - Crew Management System",
    description: "Streamline your crew management with SmartERP. The complete ERP solution for construction and field service businesses.",
    url: "https://www.prozync.in",
    siteName: "SmartERP",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SmartERP Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SmartERP - Crew Management System",
    description: "Streamline your crew management with SmartERP. The complete ERP solution for construction and field service businesses.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
    apple: "/icon.png",
  },
  manifest: "/manifest.json",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.prozync.in" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.prozync.in" />
        {/* Early Backend Prewarmer — wakes sleeping Render backend during initial HTML stream */}
        <script
          id="early-backend-prewarm"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (window.fetch) {
                    window.fetch('https://api.prozync.in/health', {
                      method: 'GET',
                      mode: 'no-cors',
                      cache: 'no-store'
                    }).catch(function() {});
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
        {/* Recovery script for ChunkLoadError (helps during deployments) */}
        <script
          id="chunk-error-recovery"
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                if (e.message && (e.message.includes('ChunkLoadError') || e.message.includes('Loading chunk'))) {
                  window.location.reload();
                }
              }, true);
            `,
          }}
        />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
          {/* Service Worker Registration */}
          <Script id="sw-registration" strategy="afterInteractive">{`
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('/sw.js').catch(function(err) {
                console.log('ServiceWorker registration failed: ', err);
              });
            }
          `}</Script>
          <Script
            id="schema-website"
            type="application/ld+json"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "SmartERP",
                alternateName: ["Prozync SmartERP"],
                url: "https://www.prozync.in",
                potentialAction: {
                  "@type": "SearchAction",
                  target: "https://www.prozync.in/search?q={search_term_string}",
                  "query-input": "required name=search_term_string",
                },
              }),
            }}
          />
          <Script
            id="schema-org"
            type="application/ld+json"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "SmartERP",
                url: "https://www.prozync.in",
                logo: "https://www.prozync.in/icon.png",
                contactPoint: {
                  "@type": "ContactPoint",
                  telephone: "+91-9535134351",
                  contactType: "customer service",
                },
              }),
            }}
          />
          <Suspense fallback={null}>
            <LoadingProvider>
              <AuthProvider>
                <SubscriptionProvider>
                  <LimitProvider>
                    <NotificationProvider>
                      <CommandRegistryProvider>
                        <JobProvider>
                          <ClockInGatekeeperProvider>
                            <ErrorBoundary>
                              {children}
                            </ErrorBoundary>
                          </ClockInGatekeeperProvider>
                        </JobProvider>
                        <Toaster richColors closeButton position="top-right" />
                        <LockedFeaturePrompt />
                        <SlowNetworkNotice />
                        <NotificationPermissionPrompt />
                        <PremiumLoader />
                        <FloatingActionHub />
                        <GlobalCommandPalette />
                        <BackgroundSubscriptionPoller />
                        <ServerPrewarmer />
                        <KeyboardShortcutsModal />
                        <OnboardingTourModal />
                        <DomRangeErrorSuppressor />
                      </CommandRegistryProvider>
                    </NotificationProvider>
                  </LimitProvider>
                </SubscriptionProvider>
              </AuthProvider>
            </LoadingProvider>
          </Suspense>
          <ConditionalAnalytics />
          <CookieConsentBanner />
        </ThemeProvider>
      </body>
    </html>
  )
}
