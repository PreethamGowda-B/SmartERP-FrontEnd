import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/auth-context"
import { JobProvider } from "@/contexts/job-context"
import { NotificationProvider } from "@/contexts/notification-context"
import { EmployeeProvider } from "@/contexts/employee-context"
import { ChatProvider } from "@/contexts/chat-context"
import { InventoryProvider } from "@/contexts/inventory-context"
import { AttendanceProvider } from "@/contexts/attendance-context"
import { ThemeProvider } from "@/components/theme-provider"
import { SyncStatusIndicator } from "@/components/sync-status-indicator"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "SmartERP - Crew Management System",
  description: "Professional crew management and ERP system for construction and field services",
  generator: "v0.app",
  verification: {
    google: "y_towXY5lpvh-AQ56rXnZaWVauXdRGz-FAD7tHc6t5U",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
          <Suspense fallback={null}>
            <AuthProvider>
              <NotificationProvider>
                <JobProvider>
                  <EmployeeProvider>
                    <ChatProvider>
                      <InventoryProvider>
                        <AttendanceProvider>
                          {children}
                          <SyncStatusIndicator />
                        </AttendanceProvider>
                      </InventoryProvider>
                    </ChatProvider>
                  </EmployeeProvider>
                </JobProvider>
              </NotificationProvider>
            </AuthProvider>
          </Suspense>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
