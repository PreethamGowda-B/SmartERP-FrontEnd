import { redirect } from "next/navigation"

export default function OwnerGSTReconciliationPage() {
  redirect("/owner/finance/gst?tab=reconcile")
}
