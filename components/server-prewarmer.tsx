"use client"
import { getApiOrigin } from "@/lib/api-environment.mjs";

import { useEffect } from "react"

export function ServerPrewarmer() {
  useEffect(() => {
    // Do not create background traffic in local or staging environments.
    if (process.env.NEXT_PUBLIC_APP_ENV !== "production") return

    // Fire a silent background health ping to the explicitly configured production API.
    const backendUrl = getApiOrigin()
    
    // Non-blocking background fetch with low priority
    try {
      fetch(`${backendUrl}/api/health`, { 
        method: "GET", 
        mode: "no-cors",
        cache: "no-store" 
      }).catch(() => {
        /* Ignore background prewarm errors */
      })

      fetch(`${backendUrl}/health`, { 
        method: "GET", 
        mode: "no-cors",
        cache: "no-store" 
      }).catch(() => {
        /* Ignore background prewarm errors */
      })
    } catch {
      /* ignore */
    }
  }, [])

  return null
}
