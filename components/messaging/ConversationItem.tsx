"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ConversationItemProps {
  name: string
  role: "owner" | "admin" | "employee"
  online: boolean
  lastMessage: string | null
  lastMessageTime: string | null
  unreadCount: number
  isActive: boolean
  isLastMessageMine: boolean
  hasConversation: boolean
  onClick: () => void
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return ""
  const date = new Date(iso)
  if (isNaN(date.getTime())) return ""
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "now"
  if (diffMin < 60) return `${diffMin}m`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH}h`
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" })
}

function roleLabel(role: string) {
  if (role === "owner") return "Owner"
  if (role === "admin") return "Admin"
  return "Employee"
}

export function ConversationItem({
  name,
  role,
  online,
  lastMessage,
  lastMessageTime,
  unreadCount,
  isActive,
  isLastMessageMine,
  hasConversation,
  onClick,
}: ConversationItemProps) {
  const initials = name.charAt(0).toUpperCase()
  const preview = hasConversation
    ? lastMessage
      ? (isLastMessageMine ? "You: " : "") + lastMessage.slice(0, 60)
      : null
    : null

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left flex items-center gap-3 px-3.5 py-3 transition-colors border-b border-border/40 relative",
        isActive
          ? "bg-primary/10 border-l-4 border-l-primary text-foreground shadow-xs dark:bg-primary/20"
          : "hover:bg-muted/60 text-foreground",
        unreadCount > 0 && !isActive && "bg-primary/5"
      )}
    >
      {/* Avatar with online indicator */}
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10">
          <AvatarFallback className={cn("font-semibold text-xs", isActive ? "bg-primary/20 text-primary" : "bg-muted text-foreground")}>
            {initials}
          </AvatarFallback>
        </Avatar>
        {online && (
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className={cn("text-xs sm:text-sm font-semibold truncate", isActive && "text-primary font-bold")}>
            {name}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="h-4.5 min-w-4.5 px-1 text-[10px] font-bold rounded-full"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
            {lastMessageTime && (
              <span className="text-[10px] text-muted-foreground whitespace-nowrap font-mono">
                {formatRelativeTime(lastMessageTime)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge
            variant={isActive ? "outline" : "secondary"}
            className={cn("text-[9px] px-1.5 py-0 h-4 shrink-0 font-medium capitalize", isActive && "border-primary/40 text-primary bg-primary/10")}
          >
            {roleLabel(role)}
          </Badge>
          <p className="text-xs text-muted-foreground truncate">
            {preview ?? (
              <span className="italic text-muted-foreground/60">Start a conversation</span>
            )}
          </p>
        </div>
      </div>
    </button>
  )
}
