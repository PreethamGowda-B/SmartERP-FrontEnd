"use client"

import * as React from "react"
import {
  Bell,
  Check,
  CheckCheck,
  Search,
  Filter,
  Package,
  Clock,
  CreditCard,
  Briefcase,
  AlertTriangle,
  Info,
  X,
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

export interface NotificationItem {
  id: string
  title: string
  message: string
  category: "inventory" | "attendance" | "payroll" | "task" | "system"
  priority: "high" | "medium" | "low"
  isRead: boolean
  timestamp: string
}

export function NotificationCenterDrawer() {
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([
    {
      id: "notif-1",
      title: "Low Stock Alert: Raw Steel",
      message: "Steel Beams quantity dropped below minimum reorder point (15 units remaining).",
      category: "inventory",
      priority: "high",
      isRead: false,
      timestamp: "10 mins ago",
    },
    {
      id: "notif-2",
      title: "Attendance Warning",
      message: "2 employees checked in late for today's morning shift.",
      category: "attendance",
      priority: "medium",
      isRead: false,
      timestamp: "1 hour ago",
    },
    {
      id: "notif-3",
      title: "Payroll Disbursement Ready",
      message: "Monthly payroll calculations are finalized and ready for authorization.",
      category: "payroll",
      priority: "medium",
      isRead: true,
      timestamp: "3 hours ago",
    },
    {
      id: "notif-4",
      title: "Material Request Submitted",
      message: "John Doe submitted a new material request for 50 Safety Helmets.",
      category: "task",
      priority: "low",
      isRead: false,
      timestamp: "5 hours ago",
    },
  ])

  const [filterCategory, setFilterCategory] = React.useState<string>("all")
  const [searchQuery, setSearchQuery] = React.useState("")

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const filteredNotifications = notifications.filter((n) => {
    const matchesCategory = filterCategory === "all" || n.category === filterCategory
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "inventory":
        return <Package className="h-4 w-4 text-amber-500" />
      case "attendance":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "payroll":
        return <CreditCard className="h-4 w-4 text-emerald-500" />
      case "task":
        return <Briefcase className="h-4 w-4 text-purple-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0 border border-border/80 shadow-2xl" align="end">
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
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </Button>
          )}
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
          <div className="flex gap-1 overflow-x-auto text-xs pb-1">
            {["all", "inventory", "attendance", "payroll", "task"].map((cat) => (
              <Badge
                key={cat}
                variant={filterCategory === cat ? "default" : "outline"}
                className="cursor-pointer capitalize text-[10px] px-2 py-0.5"
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
              No notifications matching your criteria.
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={cn(
                  "p-3 flex items-start gap-3 transition-colors hover:bg-muted/40 cursor-pointer",
                  !notif.isRead && "bg-primary/5"
                )}
                onClick={() => markAsRead(notif.id)}
              >
                <div className="p-2 rounded-lg bg-muted shrink-0 mt-0.5">
                  {getCategoryIcon(notif.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-semibold text-xs text-foreground truncate">
                      {notif.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {notif.timestamp}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                </div>
                {!notif.isRead && (
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
