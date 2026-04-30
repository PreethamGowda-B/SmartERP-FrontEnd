import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { ConditionalAnalytics } from "@/components/ConditionalAnalytics"
import { CookieConsentBanner } from "@/components/CookieConsentBanner"
import { AuthProvider } from "@/contexts/auth-context"
import { JobProvider } from "@/contexts/job-context"
import { NotificationProvider } from "@/contexts/notification-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { LockedFeaturePrompt } from "@/components/locked-feature-prompt"
import { SlowNetworkNotice } from "@/components/slow-network-notice"
import { NotificationPermissionPrompt } from "@/components/notification-permission-prompt"
import { Suspense } from "react"
import { LoadingProvider } from "@/contexts/loading-context"
import PremiumLoader from "@/components/premium-loader"
import { FloatingActionHub } from "@/components/floating-action-hub"
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
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {/* Recovery script for ChunkLoadError (helps during deployments) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(e) {
                if (e.message && (e.message.includes('ChunkLoadError') || e.message.includes('Loading chunk'))) {
                  ${process.env.NODE_ENV === 'development' ? "console.warn('ChunkLoadError detected, reloading page...');" : ""}
                  window.location.reload();
                }
              }, true);
            `,
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
          {/* Service Worker Registration */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js').then(function(registration) {
                      console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    }, function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    });
                  });
                }
              `,
            }}
          />
          <script
            type="application/ld+json"
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
          <script
            type="application/ld+json"
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
                <NotificationProvider>
                  <JobProvider>
                    <ErrorBoundary>
                      {children}
                    </ErrorBoundary>
                  </JobProvider>
                  <Toaster richColors closeButton position="top-right" />
                  <LockedFeaturePrompt />
                  <SlowNetworkNotice />
                  <NotificationPermissionPrompt />
                  <PremiumLoader />
                  <FloatingActionHub />
                </NotificationProvider>
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
