import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Employee Portal - SmartERP",
  description: "Access your jobs, timesheets, and work information",
  alternates: {
    canonical: "/employee",
  },
}

export default function EmployeeLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
