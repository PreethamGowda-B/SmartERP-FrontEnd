"use client"

import React from "react"
import { OwnerLayout } from "@/components/owner-layout"

export default function CncLayout({ children }: { children: React.ReactNode }) {
  return <OwnerLayout>{children}</OwnerLayout>
}
