"use client"

import { useEffect } from "react"

export function ServerPrewarmer() {
  useEffect(() => {
    // Fire a silent background health ping to pre-warm Render instance if sleeping
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.prozync.in"
    
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
