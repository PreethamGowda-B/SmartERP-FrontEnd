"use client"

import { useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Search } from "lucide-react"
import { ConversationItem } from "./ConversationItem"
import type { Contact, ConversationItem as ConversationItemType } from "@/types/messaging"

interface ConversationListProps {
  contacts: Contact[]
  conversations: ConversationItemType[]
  activeConversationId: string | null
  searchQuery: string
  onSearchChange: (q: string) => void
  onSelect: (userId: string, conversationId?: string | null) => void
  loading: boolean
}

export function ConversationList({
  contacts,
  conversations,
  activeConversationId,
  searchQuery,
  onSearchChange,
  onSelect,
  loading,
}: ConversationListProps) {
  // Build a merged list: contacts enriched with their conversation data if it exists
  const mergedList = useMemo(() => {
    const convByUserId = new Map(conversations.map(c => [c.other_user_id, c]))

    const items = contacts.map(contact => {
      const conv = convByUserId.get(contact.user_id)
      return {
        userId: contact.user_id,
        name: contact.name,
        role: contact.role,
        online: contact.online_status,
        hasConversation: !!conv,
        conversationId: conv?.conversation_id ?? null,
        lastMessage: conv?.last_message ?? null,
        lastMessageTime: conv?.last_message_time ?? null,
        unreadCount: conv?.unread_count ?? 0,
        isLastMessageMine: conv?.is_last_message_mine ?? false,
      }
    })

    // Sort: unread first, then by last message time desc, then no-conversation last
    return items.sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1
      if (b.unreadCount > 0 && a.unreadCount === 0) return 1
      if (a.hasConversation && !b.hasConversation) return -1
      if (!a.hasConversation && b.hasConversation) return 1
      if (a.lastMessageTime && b.lastMessageTime) {
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      }
      return a.name.localeCompare(b.name)
    })
  }, [contacts, conversations])

  // Client-side filter by name
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return mergedList
    const q = searchQuery.toLowerCase()
    return mergedList.filter(item => item.name.toLowerCase().includes(q))
  }, [mergedList, searchQuery])

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search people…"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-3 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "No results found" : "No contacts yet"}
            </p>
          </div>
        ) : (
          filtered.map(item => (
            <ConversationItem
              key={item.userId}
              name={item.name}
              role={item.role}
              online={item.online}
              lastMessage={item.lastMessage}
              lastMessageTime={item.lastMessageTime}
              unreadCount={item.unreadCount}
              isActive={item.conversationId === activeConversationId}
              isLastMessageMine={item.isLastMessageMine}
              hasConversation={item.hasConversation}
              onClick={() => onSelect(item.userId, item.conversationId)}
            />
          ))
        )}
      </div>
    </div>
  )
}
