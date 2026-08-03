"use client"

import { redirect } from "next/navigation"

export default function DeprecatedEmployeeNotificationsPage() {
  redirect("/employee/messages?tab=notifications")
}
