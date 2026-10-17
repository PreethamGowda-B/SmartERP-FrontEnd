'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useCustomerNotifications } from '@/contexts/CustomerNotificationContext'

export function CustomerNotificationDrawer() {
  const router = useRouter()
  const { notifications, markAsRead, markAllAsRead, getUnreadCount } = useCustomerNotifications()
  const [open, setOpen] = useState(false)
  const unread = getUnreadCount()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full" aria-label="Customer notifications">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unread > 0 && <span className="absolute -right-0.5 -top-0.5 rounded-full bg-destructive px-1 text-[10px] font-bold text-white">{unread > 99 ? '99+' : unread}</span>}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
        <SheetHeader className="flex flex-row items-center justify-between border-b p-4">
          <SheetTitle>Service updates</SheetTitle>
          {unread > 0 && <Button variant="ghost" size="sm" onClick={() => void markAllAsRead()}><CheckCheck className="mr-1 h-4 w-4" />Read all</Button>}
        </SheetHeader>
        <div className="flex-1 divide-y overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">Job, invoice, payment and service messages will appear here.</p>
          ) : notifications.map((item) => {
            const details = item.data || (item as any).details || {}
            return (
              <button
                key={item.id}
                className={`block w-full p-4 text-left hover:bg-muted/50 ${item.read ? '' : 'bg-primary/5'}`}
                onClick={() => {
                  if (!item.read) void markAsRead(item.id)
                  setOpen(false)
                  const jobId = details.job_id || details.jobId
                  const target = jobId ? `/customer/job/${encodeURIComponent(String(jobId))}` : details.url
                  if (target) router.push(target)
                }}
              >
                <span className="block text-sm font-semibold">{item.title || details.title || 'Service update'}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{item.message || details.message || ''}</span>
                <span className="mt-2 block text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</span>
              </button>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}
