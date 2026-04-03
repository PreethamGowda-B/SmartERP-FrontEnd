"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { OwnerLayout } from "@/components/owner-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Users, Wifi, WifiOff, RefreshCw } from "lucide-react"
import { apiClient } from "@/lib/apiClient"
import { logger } from "@/lib/logger"

// Leaflet CSS — loaded once at module level
const LEAFLET_CSS_ID = "leaflet-css"

interface EmployeeLocation {
    id: string
    name: string
    email: string
    position: string
    department: string | null
    is_active: boolean
    latitude: number | null
    longitude: number | null
    location_updated_at: string | null
    is_online: boolean
}

const POLL_INTERVAL_MS = 5_000
const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://smarterp-backendend.onrender.com"

function formatLastSeen(ts: string | null): string {
    if (!ts) return "Never"
    const diff = Date.now() - new Date(ts).getTime()
    const secs = Math.floor(diff / 1000)
    if (secs < 60) return `${secs}s ago`
    const mins = Math.floor(secs / 60)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return new Date(ts).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })
}

export default function EmployeeTrackingPage() {
    const mapRef = useRef<any>(null)        // L.Map
    const markersRef = useRef<Map<string, any>>(new Map()) // id → L.Marker
    const containerRef = useRef<HTMLDivElement>(null)
    const leafletRef = useRef<any>(null)        // L namespace
    const mapInitializedRef = useRef(false)

    const [employees, setEmployees] = useState<EmployeeLocation[]>([])
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
    const [loading, setLoading] = useState(true)
    const [mapReady, setMapReady] = useState(false)

    // ─── Inject Leaflet CSS ─────────────────────────────────────────────────────
    useEffect(() => {
        if (document.getElementById(LEAFLET_CSS_ID)) return
        const link = document.createElement("link")
        link.id = LEAFLET_CSS_ID
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
    }, [])

    // ─── Initialise Leaflet map ─────────────────────────────────────────────────
    useEffect(() => {
        if (mapInitializedRef.current || !containerRef.current) return

        import("leaflet").then((L) => {
            if (mapInitializedRef.current || !containerRef.current) return
            mapInitializedRef.current = true
            leafletRef.current = L

            // Fix default marker icon paths (Next.js / webpack issue)
            delete (L.Icon.Default.prototype as any)._getIconUrl
            L.Icon.Default.mergeOptions({
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            })

            const map = L.map(containerRef.current!, {
                center: [20.5937, 78.9629], // Default: centre of India
                zoom: 5,
                zoomControl: true,
            })

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19,
            }).addTo(map)

            mapRef.current = map
            setMapReady(true)
        })

        const markers = markersRef.current
        return () => {
            if (mapRef.current) {
                mapRef.current.remove()
                mapRef.current = null
                mapInitializedRef.current = false
                markers.clear()
            }
        }
    }, [])

    // ─── Marker helpers ─────────────────────────────────────────────────────────
    const buildPopupHtml = (emp: EmployeeLocation) => {
        const lastSeen = formatLastSeen(emp.location_updated_at)
        const onlineClr = emp.is_online ? "#22c55e" : "#9ca3af"
        const onlineTxt = emp.is_online ? "Online" : "Offline"
        return `
      <div style="min-width:160px;font-family:sans-serif;font-size:13px;">
        <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${emp.name}</div>
        <div style="color:#6b7280;margin-bottom:6px;">${emp.position}</div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${onlineClr};"></span>
          <span style="font-weight:600;color:${onlineClr};">${onlineTxt}</span>
        </div>
        <div style="color:#9ca3af;margin-top:4px;font-size:11px;">Last seen: ${lastSeen}</div>
      </div>`
    }

    const upsertMarker = useCallback((emp: EmployeeLocation) => {
        const L = leafletRef.current
        const map = mapRef.current
        if (!L || !map || emp.latitude == null || emp.longitude == null) return

        const latlng: [number, number] = [emp.latitude, emp.longitude]

        if (markersRef.current.has(emp.id)) {
            // Smoothly move existing marker
            const marker = markersRef.current.get(emp.id)
            marker.setLatLng(latlng)
            marker.setPopupContent(buildPopupHtml(emp))
        } else {
            // Create new named marker with custom coloured icon for online/offline
            const iconHtml = `
        <div style="
          background:${emp.is_online ? "#3b82f6" : "#9ca3af"};
          color:#fff;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          width:32px;height:32px;
          display:flex;align-items:center;justify-content:center;
          box-shadow:0 2px 6px rgba(0,0,0,.35);
          border:2px solid #fff;
        ">
          <span style="transform:rotate(45deg);font-size:13px;font-weight:700;">
            ${emp.name.charAt(0).toUpperCase()}
          </span>
        </div>`

            const icon = L.divIcon({ html: iconHtml, className: "", iconSize: [32, 32], iconAnchor: [16, 32] })
            const marker = L.marker(latlng, { icon }).addTo(map)
            marker.bindPopup(buildPopupHtml(emp))
            markersRef.current.set(emp.id, marker)
        }
    }, [])

    const removeStaleMarkers = useCallback((currentIds: Set<string>) => {
        const map = mapRef.current
        if (!map) return
        markersRef.current.forEach((marker, id) => {
            if (!currentIds.has(id)) {
                map.removeLayer(marker)
                markersRef.current.delete(id)
            }
        })
    }, [])

    // ─── Fetch & update ─────────────────────────────────────────────────────────
    const fetchLocations = useCallback(async () => {
        try {
            const data: EmployeeLocation[] = await apiClient("/api/location/all")
            setEmployees(data)
            setLastRefresh(new Date())

            if (mapReady) {
                const ids = new Set(data.map(e => e.id))
                removeStaleMarkers(ids)
                data.forEach(emp => {
                    if (emp.latitude != null && emp.longitude != null) {
                        upsertMarker(emp)
                    }
                })
            }
        } catch (err) {
            logger.error("[Tracking] Failed to fetch locations:", err)
        } finally {
            setLoading(false)
        }
    }, [mapReady, upsertMarker, removeStaleMarkers])

    // Initial fetch + 5 s polling
    useEffect(() => {
        fetchLocations()
        const timer = setInterval(fetchLocations, POLL_INTERVAL_MS)
        return () => clearInterval(timer)
    }, [fetchLocations])

    // ─── Click employee in list → flyTo + open popup ────────────────────────────
    const handleEmployeeClick = (emp: EmployeeLocation) => {
        setSelectedId(emp.id)
        const map = mapRef.current
        if (!map || emp.latitude == null || emp.longitude == null) return
        map.flyTo([emp.latitude, emp.longitude], 15, { duration: 1.2 })
        const marker = markersRef.current.get(emp.id)
        if (marker) setTimeout(() => marker.openPopup(), 1300)
    }

    const withLocation = employees.filter(e => e.latitude != null)
    const withoutLocation = employees.filter(e => e.latitude == null)
    const onlineCount = withLocation.filter(e => e.is_online).length

    return (
        <OwnerLayout>
            <div className="space-y-6 animate-in fade-in duration-700">

                {/* ── Header ─────────────────────────────────────────────────────── */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent flex items-center gap-2">
                            <MapPin className="h-7 w-7 text-primary" />
                            Employee Tracking
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Live GPS location of your field staff
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {lastRefresh && (
                            <span className="text-xs text-muted-foreground hidden sm:block">
                                Updated {formatLastSeen(lastRefresh.toISOString())}
                            </span>
                        )}
                        <button
                            onClick={fetchLocations}
                            className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"
                            title="Refresh now"
                        >
                            <RefreshCw className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </div>
                </div>

                {/* ── Stats ──────────────────────────────────────────────────────── */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: "Total Employees", value: employees.length, icon: Users, color: "text-primary" },
                        { label: "Sharing Location", value: withLocation.length, icon: MapPin, color: "text-blue-500" },
                        { label: "Online Now", value: onlineCount, icon: Wifi, color: "text-green-500" },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <Card key={label} className="hover:shadow-md transition-shadow">
                            <CardContent className="flex items-center gap-3 p-4">
                                <Icon className={`h-5 w-5 ${color} shrink-0`} />
                                <div>
                                    <div className={`text-2xl font-bold ${color}`}>{value}</div>
                                    <div className="text-xs text-muted-foreground">{label}</div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* ── Main content: employee list + map ──────────────────────────── */}
                <div className="flex gap-4 h-[600px]">

                    {/* Employee list */}
                    <Card className="w-72 shrink-0 flex flex-col overflow-hidden">
                        <CardHeader className="pb-2 shrink-0">
                            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                Employees
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto p-2 space-y-1">
                            {loading ? (
                                <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                                    Loading…
                                </div>
                            ) : employees.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    No employees found
                                </div>
                            ) : (
                                <>
                                    {withLocation.map(emp => (
                                        <button
                                            key={emp.id}
                                            onClick={() => handleEmployeeClick(emp)}
                                            className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all duration-200 ${selectedId === emp.id
                                                    ? "bg-primary/10 border border-primary/30"
                                                    : "hover:bg-accent/50 border border-transparent"
                                                }`}
                                        >
                                            {/* Avatar */}
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${emp.is_online ? "bg-blue-500" : "bg-gray-400"
                                                }`}>
                                                {emp.name.charAt(0).toUpperCase()}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{emp.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{emp.position}</p>
                                                <p className="text-[10px] text-muted-foreground/70">
                                                    {formatLastSeen(emp.location_updated_at)}
                                                </p>
                                            </div>

                                            <Badge
                                                className={`text-[10px] px-1.5 py-0.5 shrink-0 ${emp.is_online
                                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                        : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                                                    }`}
                                            >
                                                {emp.is_online ? "Online" : "Offline"}
                                            </Badge>
                                        </button>
                                    ))}

                                    {withoutLocation.length > 0 && (
                                        <>
                                            <div className="px-2 py-1 text-[10px] text-muted-foreground uppercase tracking-wide font-medium mt-2">
                                                No location data
                                            </div>
                                            {withoutLocation.map(emp => (
                                                <div
                                                    key={emp.id}
                                                    className="flex items-center gap-3 p-2.5 rounded-lg opacity-50"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold shrink-0">
                                                        {emp.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{emp.name}</p>
                                                        <p className="text-xs text-muted-foreground">Not sharing</p>
                                                    </div>
                                                    <WifiOff className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Map */}
                    <Card className="flex-1 overflow-hidden relative">
                        {/* Empty state overlay */}
                        {!loading && withLocation.length === 0 && (
                            <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl gap-3">
                                <MapPin className="h-12 w-12 text-muted-foreground/30" />
                                <p className="text-sm text-muted-foreground font-medium">No location data yet</p>
                                <p className="text-xs text-muted-foreground/70 text-center max-w-xs">
                                    Employees will appear here once they log in and allow location access.
                                </p>
                            </div>
                        )}

                        {/* Leaflet map mount point */}
                        <div
                            ref={containerRef}
                            className="w-full h-full rounded-xl"
                            style={{ minHeight: 500, zIndex: 0 }}
                        />
                    </Card>
                </div>
            </div>
        </OwnerLayout>
    )
}
