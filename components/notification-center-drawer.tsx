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
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
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
  const router = useRouter()
  const [isOpen, setIsOpen] = React.useState(false)
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
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full shrink-0 hover:bg-muted"
          aria-label="Open notifications"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse shadow-xs">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-background z-[9999]">
        {/* Header */}
        <SheetHeader className="p-4 border-b border-border/70 flex flex-col gap-2 bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <SheetTitle className="text-base font-bold tracking-tight">Enterprise Notifications</SheetTitle>
                <p className="text-xs text-muted-foreground">Real-time alerts across all SmartERP modules</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={handleManualRefresh}
                title="Refresh notifications"
              >
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              </Button>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
                  onClick={() => markAllAsRead()}
                >
                  <CheckCheck className="h-3.5 w-3.5 text-emerald-500" /> Read all
                </Button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative pt-1">
            <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs rounded-xl"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
            {[
              { id: "all", label: "All" },
              { id: "task", label: "Jobs" },
              { id: "inventory", label: "Inventory" },
              { id: "payroll", label: "Payroll" },
              { id: "attendance", label: "Attendance" },
            ].map((cat) => (
              <Badge
                key={cat.id}
                variant={filterCategory === cat.id ? "default" : "outline"}
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg cursor-pointer whitespace-nowrap transition-colors",
                  filterCategory === cat.id ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                )}
                onClick={() => setFilterCategory(cat.id)}
              >
                {cat.label}
              </Badge>
            ))}
          </div>
        </SheetHeader>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/40">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto" />
              <p className="text-xs font-bold text-muted-foreground">No notifications found</p>
              <p className="text-[11px] text-muted-foreground/70">System alerts and workflow updates will appear here.</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const handleNotificationClick = () => {
                if (!notif.read) {
                  markAsRead(notif.id)
                }
                setIsOpen(false)

                // Deep-link routing
                if (notif.data?.url) {
                  router.push(notif.data.url)
                } else if (notif.type?.includes('job_action') || notif.type?.includes('work_request')) {
                  router.push('/owner/jobs')
                } else if (notif.type?.includes('dispute') || notif.type?.includes('issue')) {
                  router.push('/owner/invoice-issues')
                } else if (notif.type?.includes('invoice')) {
                  router.push('/owner/finance/invoices')
                } else if (notif.type?.includes('payment')) {
                  router.push('/owner/finance/payments')
                } else if (notif.type?.includes('material') || notif.type?.includes('inventory')) {
                  router.push('/owner/inventory/forecasts')
                } else if (notif.type?.includes('attendance')) {
                  router.push('/owner/attendance')
                }
              }

              return (
                <div
                  key={notif.id}
                  className={cn(
                    "p-3.5 flex items-start gap-3 transition-colors hover:bg-muted/40 cursor-pointer group",
                    !notif.read && "bg-primary/5 font-medium"
                  )}
                  onClick={handleNotificationClick}
                >
                  <div className="p-2 rounded-xl bg-muted shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    {getCategoryIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-bold text-xs text-foreground truncate">
                        {notif.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                        {formatRelativeTime(notif.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{notif.message}</p>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </div>
              )
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
