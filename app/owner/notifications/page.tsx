"use client"

import { redirect } from "next/navigation"

export default function DeprecatedOwnerNotificationsPage() {
  redirect("/owner/messages?tab=notifications")
}
