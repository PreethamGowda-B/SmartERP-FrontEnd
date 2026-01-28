"use client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, Clock, AlertTriangle, Info, CheckCircle } from "lucide-react"
import { EmployeeLayout } from "@/components/employee-layout"
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

const formatNotificationTime = (timeString: string) => {
  const date = new Date(timeString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return "Just now"
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
  return `${Math.floor(diffInMinutes / 1440)} days ago`
}

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead } = useNotifications()
  const { user } = useAuth()

  const employeeNotifications = notifications.filter(
    (notification) => !notification.userId || notification.userId === user?.id,
  )

  const markAsReadHandler = (id: string) => {
    markAsRead(id)
  }

  const markAllAsReadHandler = () => {
    markAllAsRead()
  }

  const unreadCount = employeeNotifications.filter((n) => !n.read).length

  return (
    <EmployeeLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="rounded-full">
                {unreadCount}
              </Badge>
            )}
          </div>
          <Button onClick={markAllAsReadHandler} disabled={unreadCount === 0}>
            <Check className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
        </div>

        <div className="space-y-4">
          {employeeNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-colors ${!notification.read ? "border-primary bg-primary/5" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{notification.title}</h3>
                      {!notification.read && <div className="w-2 h-2 bg-primary rounded-full" />}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">{formatNotificationTime(notification.time)}</p>
                  </div>
                  {!notification.read && (
                    <Button variant="ghost" size="sm" onClick={() => markAsReadHandler(notification.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {employeeNotifications.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No notifications</h3>
              <p className="text-muted-foreground">You&apos;re all caught up!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </EmployeeLayout>
  )
}
