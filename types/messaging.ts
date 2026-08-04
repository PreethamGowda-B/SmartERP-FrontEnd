// Contact — a user in the same company (returned by GET /api/messages/contacts)
export interface Contact {
  user_id: string
  name: string
  role: 'owner' | 'admin' | 'employee'
  online_status: boolean
}

// ConversationItem — returned by GET /api/messages/conversations
export interface ConversationItem {
  conversation_id: string
  other_user_id: string
  other_user_name: string
  other_user_role: 'owner' | 'admin' | 'employee'
  last_message: string | null
  last_message_time: string | null // ISO UTC
  unread_count: number
  is_last_message_mine: boolean
  other_user_online: boolean
}

// MessageAttachment — file attached to a message
export interface MessageAttachment {
  file_url: string
  file_name: string
  file_type: string    // MIME type
  file_size: number    // bytes
  media_url?: string
  media_type?: string
}

// Message — a single chat message
export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_name: string
  content: string
  message_type: 'text' | 'image' | 'document'
  created_at: string // ISO UTC
  is_mine: boolean
  receipt?: 'sent' | 'delivered' | 'read'   // only on own messages
  attachment?: MessageAttachment              // Phase 2
}

// MessagingState — the state shape for MessagingContext
export interface MessagingState {
  contacts: Contact[]
  conversations: ConversationItem[]
  activeConversationId: string | null
  messages: Message[]
  hasMore: boolean
  loadingMessages: boolean
  loadingConversations: boolean
  searchQuery: string
  sending: boolean
  typingUsers: Record<string, { name: string; until: number }>  // userId → typing expiry
}

// MessagingActions — the actions available from useMessaging
export interface MessagingActions {
  openConversation: (userId: string) => Promise<void>
  sendMessage: (content: string, attachment?: MessageAttachment) => Promise<void>
  loadMoreMessages: () => Promise<void>
  markAsRead: (conversationId: string) => Promise<void>
  setSearchQuery: (q: string) => void
  refreshConversations: () => Promise<void>
  handleSSEEvent: (event: SSEMessagingEvent) => void
  sendTyping: (typing: boolean) => void
}

// SSE event types coming from the backend
export type SSEMessagingEvent =
  | { type: 'new_message'; data: NewMessageEvent }
  | { type: 'status_change'; data: StatusChangeEvent }
  | { type: 'typing_indicator'; data: TypingIndicatorEvent }
  | { type: 'receipt_update'; data: ReceiptUpdateEvent }

export interface NewMessageEvent {
  conversation_id: string
  message_id: string
  sender_id: string
  sender_name: string
  content: string
  message_type: 'text' | 'image' | 'document'
  created_at: string
  attachment?: MessageAttachment
}

export interface StatusChangeEvent {
  user_id: string
  online: boolean
}

export interface TypingIndicatorEvent {
  conversation_id: string
  user_id: string
  user_name: string
  typing: boolean
}

export interface ReceiptUpdateEvent {
  conversation_id: string
  message_ids: string[]
  status: 'delivered' | 'read'
}

// Combined list item for the conversation list (contact with or without conversation)
export type ConversationListItem =
  | (ConversationItem & { hasConversation: true })
  | (Contact & { hasConversation: false; conversation_id: null })
