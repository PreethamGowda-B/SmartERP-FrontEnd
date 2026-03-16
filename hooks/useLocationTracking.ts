"use client"

import { useEffect, useRef, useCallback } from "react"
import { apiClient } from "@/lib/apiClient"

const SEND_INTERVAL_MS = 12_000   // send every 12 seconds
const MIN_DISTANCE_M = 5         // skip update if moved < 5 metres

/** Great-circle distance in metres (Haversine) */
function haversineMetres(
    lat1: number, lon1: number,
    lat2: number, lon2: number
): number {
    const R = 6_371_000
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

interface UseLocationTrackingOptions {
    /** Called when permission state changes */
    onPermissionChange?: (state: "granted" | "denied" | "prompt" | "unsupported") => void
}

/**
 * Starts watching the device's geolocation and reports it to the backend
 * every SEND_INTERVAL_MS milliseconds (only if moved significantly).
 * Cleans up automatically on unmount.
 */
export function useLocationTracking({ onPermissionChange }: UseLocationTrackingOptions = {}) {
    const watchIdRef = useRef<number | null>(null)
    const lastSentRef = useRef<{ lat: number; lng: number } | null>(null)
    const lastSendTime = useRef<number>(0)
    const permRef = useRef<"granted" | "denied" | "prompt" | "unsupported">("prompt")
    const isDisabledByTier = useRef<boolean>(false)

    const sendLocation = useCallback(async (lat: number, lng: number) => {
        if (isDisabledByTier.current) return

        try {
            await apiClient("/api/location/update", {
                method: "POST",
                body: JSON.stringify({ latitude: lat, longitude: lng }),
            })
            lastSentRef.current = { lat, lng }
            lastSendTime.current = Date.now()
        } catch (err: any) {
            // If Forbidden (403), it means the plan doesn't support this.
            // Disable tracking for this session to avoid repeated modals/unnecessary requests.
            if (err?.status === 403 || (err?.message && err.message.toLowerCase().includes('upgrade'))) {
                console.warn("[useLocationTracking] Disabling location tracking: Tier restriction detected")
                isDisabledByTier.current = true
            } else {
                console.warn("[useLocationTracking] Failed to send location:", err)
            }
        }
    }, [])

    useEffect(() => {
        if (typeof window === "undefined") return
        if (!("geolocation" in navigator)) {
            permRef.current = "unsupported"
            onPermissionChange?.("unsupported")
            return
        }

        const handlePosition = (pos: GeolocationPosition) => {
            if (permRef.current !== "granted") {
                permRef.current = "granted"
                onPermissionChange?.("granted")
            }

            const { latitude: lat, longitude: lng } = pos.coords
            const now = Date.now()
            const timeSinceLast = now - lastSendTime.current

            // Send immediately on first fix
            if (!lastSentRef.current) {
                sendLocation(lat, lng)
                return
            }

            // Skip if not enough time has passed
            if (timeSinceLast < SEND_INTERVAL_MS) return

            // Skip if barely moved
            const dist = haversineMetres(lastSentRef.current.lat, lastSentRef.current.lng, lat, lng)
            if (dist < MIN_DISTANCE_M) return

            sendLocation(lat, lng)
        }

        const handleError = (err: GeolocationPositionError) => {
            if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
                permRef.current = "denied"
                onPermissionChange?.("denied")
            }
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
            handlePosition,
            handleError,
            { enableHighAccuracy: true, maximumAge: 10_000, timeout: 15_000 }
        )

        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current)
            }
        }
    }, [onPermissionChange, sendLocation])
}
