"use client"

import * as React from "react"
import {
  Bell,
  CheckCheck,
  Search,
  Package,
  Clock,
  CreditCard,
  Briefcase,
  Info,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useNotifications, Notification } from "@/contexts/notification-context"

function formatRelativeTime(dateString: string): string {
  if (!dateString) return "Just now"
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return "Recently"
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return "Just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
}

export function NotificationCenterDrawer() {
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    refreshNotifications,
  } = useNotifications()

  const [filterCategory, setFilterCategory] = React.useState<string>("all")
  const [searchQuery, setSearchQuery] = React.useState("")
  const [refreshing, setRefreshing] = React.useState(false)

  const unreadCount = getUnreadCount()

  const handleManualRefresh = async () => {
    setRefreshing(true)
    await refreshNotifications()
    setRefreshing(false)
  }

  const filteredNotifications = notifications.filter((n) => {
    const typeStr = (n.type || "system").toLowerCase()
    const matchesCategory =
      filterCategory === "all" ||
      (filterCategory === "task" && (typeStr === "job" || typeStr === "task" || typeStr === "material_request")) ||
      typeStr.includes(filterCategory)
    const matchesSearch =
      (n.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.message || "").toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getCategoryIcon = (type: string) => {
    const t = (type || "").toLowerCase()
    if (t.includes("inventory")) return <Package className="h-4 w-4 text-amber-500" />
    if (t.includes("attendance") || t.includes("clock")) return <Clock className="h-4 w-4 text-blue-500" />
    if (t.includes("payroll") || t.includes("salary")) return <CreditCard className="h-4 w-4 text-emerald-500" />
    if (t.includes("job") || t.includes("task") || t.includes("material")) return <Briefcase className="h-4 w-4 text-purple-500" />
    return <Info className="h-4 w-4 text-primary" />
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full shrink-0"
          aria-label="Open notifications"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0 border border-border/80 shadow-2xl z-[9999]" align="end">
        {/* Header */}
        <div className="p-4 border-b border-border/70 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={handleManualRefresh}
              title="Refresh notifications"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
                onClick={() => markAllAsRead()}
              >
                <CheckCheck className="h-3.5 w-3.5 text-emerald-500" /> Read all
              </Button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="p-2.5 border-b border-border/60 bg-background space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto text-xs pb-1 scrollbar-none">
            {["all", "job", "inventory", "attendance", "payroll"].map((cat) => (
              <Badge
                key={cat}
                variant={filterCategory === cat ? "default" : "outline"}
                className="cursor-pointer capitalize text-[10px] px-2 py-0.5 shrink-0"
                onClick={() => setFilterCategory(cat)}
              >
                {cat}
              </Badge>
            ))}
          </div>
        </div>

        {/* Notification Stream */}
        <div className="max-h-80 overflow-y-auto divide-y divide-border/50">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              {notifications.length === 0
                ? "No notifications yet."
                : "No notifications matching your criteria."}
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={cn(
                  "p-3 flex items-start gap-3 transition-colors hover:bg-muted/40 cursor-pointer",
                  !notif.read && "bg-primary/5 font-medium"
                )}
                onClick={() => {
                  if (!notif.read) markAsRead(notif.id)
                }}
              >
                <div className="p-2 rounded-lg bg-muted shrink-0 mt-0.5">
                  {getCategoryIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-semibold text-xs text-foreground truncate">
                      {notif.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatRelativeTime(notif.created_at)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                </div>
                {!notif.read && (
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
