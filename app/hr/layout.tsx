import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "HR Portal - SmartERP",
  description: "HR operations, employee management, payroll, and attendance for SmartERP.",
  alternates: {
    canonical: "/hr",
  },
}

export default function HRLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
