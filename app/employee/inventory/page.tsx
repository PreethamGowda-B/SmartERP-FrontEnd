"use client"

import { redirect } from "next/navigation"

export default function DeprecatedEmployeeInventoryPage() {
  redirect("/employee/materials?tab=inventory")
}
