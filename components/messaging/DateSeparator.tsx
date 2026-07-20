"use client"

import { format, isToday, isYesterday } from "date-fns"

interface DateSeparatorProps {
  date: Date
}

function formatDateLabel(date: Date): string {
  if (isToday(date)) return "Today"
  if (isYesterday(date)) return "Yesterday"
  return format(date, "MMMM d, yyyy")
}

export function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <div className="flex items-center gap-3 my-3 px-1">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[11px] font-medium text-muted-foreground shrink-0 px-1">
        {formatDateLabel(date)}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}
