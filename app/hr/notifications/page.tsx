"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, Clock, AlertTriangle, Info, CheckCircle, BellOff } from "lucide-react"
import { HRLayout } from "@/components/hr-layout"
import { useNotifications } from "@/contexts/notification-context"
import { useAuth } from "@/contexts/auth-context"

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "success":
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case "warning":
      return <Clock className="h-5 w-5 text-yellow-500" />
    case "alert":
      return <AlertTriangle className="h-5 w-5 text-red-500" />
    default:
      return <Info className="h-5 w-5 text-blue-500" />
  }
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "destructive"
    case "medium":
      return "default"
    default:
      return "secondary"
  }
}

const formatNotificationTime = (timeString: string) => {
  const date = new Date(timeString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return "Just now"
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
  return `${Math.floor(diffInMinutes / 1440)} days ago`
}

export default function HRNotificationsPage() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications()
  const { user } = useAuth()
  const [filter, setFilter] = useState("all")

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread") return !notification.read
    if (filter === "high") return notification.priority === "high"
    return true
  })

  const unreadCount = notifications.filter((n) => !n.read).length
  const highPriorityCount = notifications.filter((n) => n.priority === "high" && !n.read).length

  return (
    <HRLayout>
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="rounded-full">
                {unreadCount}
              </Badge>
            )}
          </div>
          <Button onClick={markAllAsRead} disabled={unreadCount === 0} className="rounded-xl shadow-lg">
            <Check className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm bg-primary/5">
            <CardContent className="p-4 flex items-center gap-3">
               <div className="p-2 bg-primary/10 rounded-lg">
                 <Bell className="h-5 w-5 text-primary" />
               </div>
               <div>
                  <p className="text-sm font-medium text-primary">Total</p>
                  <p className="text-2xl font-bold">{notifications.length}</p>
               </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-red-500/5">
            <CardContent className="p-4 flex items-center gap-3">
               <div className="p-2 bg-red-500/10 rounded-lg">
                 <AlertTriangle className="h-5 w-5 text-red-500" />
               </div>
               <div>
                  <p className="text-sm font-medium text-red-500">High Priority</p>
                  <p className="text-2xl font-bold">{highPriorityCount}</p>
               </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-green-500/5">
            <CardContent className="p-4 flex items-center gap-3">
               <div className="p-2 bg-green-500/10 rounded-lg">
                 <CheckCircle className="h-5 w-5 text-green-500" />
               </div>
               <div>
                  <p className="text-sm font-medium text-green-500">Unread</p>
                  <p className="text-2xl font-bold">{unreadCount}</p>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2">
          <Button 
            variant={filter === "all" ? "default" : "outline"} 
            onClick={() => setFilter("all")}
            className="rounded-xl"
          >
            All
          </Button>
          <Button 
            variant={filter === "unread" ? "default" : "outline"} 
            onClick={() => setFilter("unread")}
            className="rounded-xl"
          >
            Unread ({unreadCount})
          </Button>
          <Button 
            variant={filter === "high" ? "default" : "outline"} 
            onClick={() => setFilter("high")}
            className="rounded-xl"
          >
            High Priority
          </Button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-all duration-300 border-none shadow-sm hover:shadow-md ${!notification.read ? "bg-white dark:bg-zinc-900 border-l-4 border-l-primary shadow-primary/10" : "bg-muted/30 opacity-80"}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-sm tracking-tight">{notification.title}</h3>
                      <Badge variant={getPriorityColor(notification.priority)} className="text-[10px] h-4 rounded-md uppercase font-bold tracking-wider px-1">
                        {notification.priority}
                      </Badge>
                      {!notification.read && <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />}
                    </div>
                    <p className="text-sm text-muted-foreground leading-snug">{notification.message}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground font-medium">
                       <Clock className="w-3 h-3" />
                       {formatNotificationTime(notification.created_at)}
                    </div>
                  </div>
                  {!notification.read && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => markAsRead(notification.id)}
                      className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredNotifications.length === 0 && (
            <Card className="border-dashed border-2 bg-transparent">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                   <BellOff className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-bold">No notifications found</h3>
                <p className="text-muted-foreground max-w-xs mx-auto text-sm mt-1">
                  {filter === "all" ? "You're all caught up! No recent activity to report." : `No ${filter} notifications matching your criteria.`}
                </p>
                <Button variant="outline" className="mt-6 rounded-xl" onClick={() => setFilter("all")}>
                   View All Notifications
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </HRLayout>
  )
}
