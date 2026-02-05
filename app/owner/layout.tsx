import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Owner Portal - SmartERP",
  description: "Manage your crew, jobs, and business operations",
  alternates: {
    canonical: "/owner",
  },
}

export default function OwnerLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
