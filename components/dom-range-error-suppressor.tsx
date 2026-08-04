"use client"

import { useEffect } from "react"

/**
 * DomRangeErrorSuppressor
 * Suppresses transient V8 / React DOM errors caused by browser DOM Range / selection
 * APIs (e.g. range.selectNode(node)) attempting to operate on unmounted/detached elements.
 */
export function DomRangeErrorSuppressor() {
  useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      const msg = event.message || event.error?.message || ""
      const isRangeNodeError =
        msg.includes("InvalidNodeTypeError") ||
        msg.includes("selectNode") ||
        msg.includes("given Node has no parent") ||
        event.error?.name === "InvalidNodeTypeError"

      if (isRangeNodeError) {
        event.preventDefault()
        event.stopPropagation()
        return true
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reasonMsg = event.reason?.message || String(event.reason || "")
      const isRangeNodeError =
        reasonMsg.includes("InvalidNodeTypeError") ||
        reasonMsg.includes("selectNode") ||
        reasonMsg.includes("given Node has no parent") ||
        event.reason?.name === "InvalidNodeTypeError"

      if (isRangeNodeError) {
        event.preventDefault()
      }
    }

    window.addEventListener("error", handleWindowError, true)
    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    return () => {
      window.removeEventListener("error", handleWindowError, true)
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [])

  return null
}
