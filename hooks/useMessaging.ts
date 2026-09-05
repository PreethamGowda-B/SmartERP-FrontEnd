"use client"

import { useReducer, useCallback, useRef } from 'react'
import { apiClient } from '@/lib/apiClient'
import { toast } from 'sonner'
import type {
  MessagingState, Contact, ConversationItem, Message, MessageAttachment,
  SSEMessagingEvent, NewMessageEvent, StatusChangeEvent,
  TypingIndicatorEvent, ReceiptUpdateEvent
} from '@/types/messaging'

// Initial state
const initialState: MessagingState = {
  contacts: [],
  conversations: [],
  activeConversationId: null,
  messages: [],
  hasMore: false,
  loadingMessages: false,
  loadingConversations: false,
  searchQuery: '',
  sending: false,
  typingUsers: {},
}

// Actions (discriminated union)
type Action =
  | { type: 'SET_CONTACTS'; payload: Contact[] }
  | { type: 'SET_CONVERSATIONS'; payload: ConversationItem[] }
  | { type: 'SET_ACTIVE_CONVERSATION'; payload: string }
  | { type: 'SET_MESSAGES'; payload: { messages: Message[]; hasMore: boolean } }
  | { type: 'APPEND_MESSAGES'; payload: { messages: Message[]; hasMore: boolean } }
  | { type: 'PREPEND_MESSAGE'; payload: Message }         // optimistic send
  | { type: 'REPLACE_MESSAGE'; payload: { tempId: string; message: Message } }
  | { type: 'REMOVE_MESSAGE'; payload: string }           // remove by id
  | { type: 'RECEIVE_MESSAGE'; payload: NewMessageEvent }
  | { type: 'UPDATE_ONLINE_STATUS'; payload: StatusChangeEvent }
  | { type: 'SET_LOADING_MESSAGES'; payload: boolean }
  | { type: 'SET_LOADING_CONVERSATIONS'; payload: boolean }
  | { type: 'SET_SENDING'; payload: boolean }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'MARK_CONVERSATION_READ'; payload: string }
  | { type: 'UPDATE_SENT_CONVERSATION'; payload: { conversation_id: string; content: string; created_at: string } }
  | { type: 'SET_TYPING'; payload: TypingIndicatorEvent }
  | { type: 'CLEAR_TYPING'; payload: { userId: string } }
  | { type: 'UPDATE_RECEIPTS'; payload: ReceiptUpdateEvent }

function reducer(state: MessagingState, action: Action): MessagingState {
  switch (action.type) {
    case 'SET_CONTACTS':
      return { ...state, contacts: action.payload }
    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload, loadingConversations: false }
    case 'SET_ACTIVE_CONVERSATION':
      return { ...state, activeConversationId: action.payload, messages: [], hasMore: false }
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload.messages, hasMore: action.payload.hasMore, loadingMessages: false }
    case 'APPEND_MESSAGES':
      return {
        ...state,
        messages: [...state.messages, ...action.payload.messages],
        hasMore: action.payload.hasMore,
        loadingMessages: false
      }
    case 'PREPEND_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] }
    case 'REPLACE_MESSAGE':
      return {
        ...state,
        sending: false,
        messages: state.messages.map(m =>
          String(m.id) === String(action.payload.tempId) ? action.payload.message : m
        )
      }
    case 'REMOVE_MESSAGE':
      return {
        ...state,
        sending: false,
        messages: state.messages.filter(m => String(m.id) !== String(action.payload))
      }
    case 'RECEIVE_MESSAGE': {
      const { conversation_id, message_id, sender_id, sender_name, content, message_type, created_at, attachment, erp_record_type, erp_record_id } = action.payload
      const newMsg: Message = {
        id: String(message_id), conversation_id, sender_id, sender_name,
        content, message_type, created_at, is_mine: false,
        ...(attachment ? { attachment } : {}),
        ...(erp_record_type ? { erp_record_type } : {}),
        ...(erp_record_id ? { erp_record_id } : {}),
      }
      const updatedConvs = state.conversations.map(c =>
        c.conversation_id === conversation_id
          ? {
              ...c,
              last_message: content,
              last_message_time: created_at,
              unread_count: state.activeConversationId === conversation_id ? 0 : c.unread_count + 1,
            }
          : c
      ).sort((a, b) => {
        if (a.conversation_id === conversation_id) return -1
        if (b.conversation_id === conversation_id) return 1
        return 0
      })
      if (state.activeConversationId === conversation_id) {
        return { ...state, conversations: updatedConvs, messages: [...state.messages, newMsg] }
      }
      return { ...state, conversations: updatedConvs }
    }
    case 'UPDATE_ONLINE_STATUS': {
      const { user_id, online } = action.payload
      return {
        ...state,
        contacts: state.contacts.map(c => c.user_id === user_id ? { ...c, online_status: online } : c),
        conversations: state.conversations.map(c => c.other_user_id === user_id ? { ...c, other_user_online: online } : c),
      }
    }
    case 'SET_LOADING_MESSAGES':
      return { ...state, loadingMessages: action.payload }
    case 'SET_LOADING_CONVERSATIONS':
      return { ...state, loadingConversations: action.payload }
    case 'SET_SENDING':
      return { ...state, sending: action.payload }
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload }
    case 'MARK_CONVERSATION_READ':
      return {
        ...state,
        conversations: state.conversations.map(c =>
          c.conversation_id === action.payload ? { ...c, unread_count: 0 } : c
        )
      }
    case 'UPDATE_SENT_CONVERSATION': {
      const { conversation_id, content, created_at } = action.payload
      const updatedConvs = state.conversations.map(c =>
        c.conversation_id === conversation_id
          ? { ...c, last_message: content, last_message_time: created_at }
          : c
      ).sort((a, b) => {
        if (a.conversation_id === conversation_id) return -1
        if (b.conversation_id === conversation_id) return 1
        return 0
      })
      return { ...state, conversations: updatedConvs }
    }
    case 'SET_TYPING': {
      const { user_id, user_name, typing } = action.payload
      if (!typing) {
        const updated = { ...state.typingUsers }
        delete updated[user_id]
        return { ...state, typingUsers: updated }
      }
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [user_id]: { name: user_name, until: Date.now() + 5000 }
        }
      }
    }
    case 'CLEAR_TYPING': {
      const updated = { ...state.typingUsers }
      delete updated[action.payload.userId]
      return { ...state, typingUsers: updated }
    }
    case 'UPDATE_RECEIPTS': {
      const { message_ids, status } = action.payload
      const idSet = new Set(message_ids.map(String))
      return {
        ...state,
        messages: state.messages.map(m => {
          if (!idSet.has(String(m.id)) || !m.is_mine) return m
          // Only upgrade receipt status (sent → delivered → read)
          const order = { sent: 0, delivered: 1, read: 2 }
          const current = m.receipt ?? 'sent'
          if ((order[status] ?? 0) > (order[current] ?? 0)) {
            return { ...m, receipt: status }
          }
          return m
        })
      }
    }
    default:
      return state
  }
}

export function useMessaging(currentUserId: string) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const pageRef = useRef(1)
  const activeConvRef = useRef<string | null>(null)
  const typingTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const lastTypingSentRef = useRef<number>(0)
  const isTypingRef = useRef(false)

  // Keep activeConvRef in sync
  const setActive = useCallback((id: string) => {
    activeConvRef.current = id
    dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: id })
  }, [])

  // Load contacts + conversations on mount
  const loadInitialData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING_CONVERSATIONS', payload: true })
    try {
      const [contactsResult, conversationsResult] = await Promise.allSettled([
        apiClient('/api/messages/contacts'),
        apiClient('/api/messages/conversations'),
      ])
      const contacts = contactsResult.status === 'fulfilled' && Array.isArray(contactsResult.value)
        ? contactsResult.value : []
      const conversations = conversationsResult.status === 'fulfilled' && Array.isArray(conversationsResult.value)
        ? conversationsResult.value : []
      dispatch({ type: 'SET_CONTACTS', payload: contacts })
      dispatch({ type: 'SET_CONVERSATIONS', payload: conversations })
    } catch (err) {
      console.warn('[useMessaging] loadInitialData error:', err)
      dispatch({ type: 'SET_LOADING_CONVERSATIONS', payload: false })
    }
  }, [])

  const refreshConversations = useCallback(async () => {
    try {
      const conversations = await apiClient('/api/messages/conversations')
      dispatch({ type: 'SET_CONVERSATIONS', payload: Array.isArray(conversations) ? conversations : [] })
    } catch { /* silent */ }
  }, [])

  // Open a conversation with a user (instantaneous activation for known conversations)
  const openConversation = useCallback(async (userId: string, knownConversationId?: string | null) => {
    try {
      // Check if conversation ID is already known
      let targetConvId = knownConversationId
      if (!targetConvId) {
        const existing = state.conversations.find(c => c.other_user_id === userId)
        if (existing) {
          targetConvId = existing.conversation_id
        }
      }

      const mapMessage = (m: any): Message => {
        const mediaUrl = m.attachment?.media_url || m.attachment?.file_url || m.media_url
        const isImg = m.message_type === 'image' || m.attachment?.media_type === 'image' || m.attachment?.file_type?.startsWith('image/')
        const isAud = m.message_type === 'audio' || m.attachment?.media_type === 'audio' || m.attachment?.file_type?.startsWith('audio/')
        const attachment = m.attachment || (mediaUrl ? {
          file_url: mediaUrl,
          media_url: mediaUrl,
          file_name: m.file_name || (isAud ? 'Voice Note' : isImg ? 'Photo' : 'Attachment'),
          file_type: isImg ? 'image/jpeg' : isAud ? 'audio/webm' : 'application/octet-stream',
          media_type: isImg ? 'image' : isAud ? 'audio' : 'document',
          file_size: m.file_size || 0,
        } : undefined)

        return {
          ...m,
          id: String(m.id),
          attachment,
          message_type: isAud ? 'audio' : isImg ? 'image' : (m.message_type || 'text')
        }
      }

      if (targetConvId) {
        // INSTANT UI RESPONSE: switch active conversation and clear unread badge immediately
        setActive(targetConvId)
        dispatch({ type: 'MARK_CONVERSATION_READ', payload: targetConvId })
        dispatch({ type: 'SET_LOADING_MESSAGES', payload: true })
        pageRef.current = 1

        const data = await apiClient(`/api/messages/conversation/${targetConvId}?page=1`)
        const msgs: Message[] = (data.messages ?? []).reverse().map(mapMessage)
        dispatch({ type: 'SET_MESSAGES', payload: { messages: msgs, hasMore: data.has_more ?? false } })
        apiClient(`/api/messages/conversation/${targetConvId}/read`, { method: 'PATCH' }).catch(() => {})
      } else {
        // First contact: create conversation via backend
        dispatch({ type: 'SET_LOADING_MESSAGES', payload: true })
        const { conversation_id } = await apiClient('/api/messages/conversations/start', {
          method: 'POST',
          body: JSON.stringify({ other_user_id: userId }),
        })
        setActive(conversation_id)
        dispatch({ type: 'MARK_CONVERSATION_READ', payload: conversation_id })
        pageRef.current = 1
        const data = await apiClient(`/api/messages/conversation/${conversation_id}?page=1`)
        const msgs: Message[] = (data.messages ?? []).reverse().map(mapMessage)
        dispatch({ type: 'SET_MESSAGES', payload: { messages: msgs, hasMore: data.has_more ?? false } })
        apiClient(`/api/messages/conversation/${conversation_id}/read`, { method: 'PATCH' }).catch(() => {})
      }
    } catch (err: any) {
      dispatch({ type: 'SET_LOADING_MESSAGES', payload: false })
      toast.error(err?.message || 'Failed to open conversation')
    }
  }, [setActive, state.conversations])

  // Send a message (optionally with an attachment)
  const sendMessage = useCallback(async (content: string, attachment?: MessageAttachment) => {
    const conversationId = activeConvRef.current
    if (!conversationId || (!content.trim() && !attachment) || state.sending) return

    // Stop typing indicator before sending
    sendTypingRaw(conversationId, false)

    const isImg = attachment?.file_type?.startsWith('image/') || attachment?.media_type === 'image'
    const isAud = attachment?.media_type === 'audio' || attachment?.file_type?.startsWith('audio/')

    const tempId = `temp_${Date.now()}`
    const optimisticMsg: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      sender_name: 'You',
      content: content.trim(),
      message_type: attachment
        ? (isImg ? 'image' : isAud ? 'audio' : 'document')
        : 'text',
      created_at: new Date().toISOString(),
      is_mine: true,
      receipt: 'sent',
      ...(attachment ? { attachment } : {}),
    }

    dispatch({ type: 'SET_SENDING', payload: true })
    dispatch({ type: 'PREPEND_MESSAGE', payload: optimisticMsg })

    try {
      const body: Record<string, unknown> = {
        conversation_id: conversationId,
        content: content.trim(),
      }
      if (attachment) {
        body.message_type = optimisticMsg.message_type
        body.attachment = attachment
      }

      const result = await apiClient('/api/messages', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      dispatch({
        type: 'REPLACE_MESSAGE',
        payload: {
          tempId,
          message: {
            ...result,
            id: String(result.id),
            is_mine: true,
            receipt: result.receipt ?? 'sent',
            ...(attachment ? { attachment } : {})
          }
        }
      })
      dispatch({
        type: 'UPDATE_SENT_CONVERSATION',
        payload: {
          conversation_id: conversationId,
          content: content.trim() || (attachment?.file_name ?? 'Attachment'),
          created_at: result.created_at
        }
      })
    } catch (err: any) {
      dispatch({ type: 'REMOVE_MESSAGE', payload: tempId })
      toast.error(err?.message || 'Failed to send message')
    }
  }, [state.sending, currentUserId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Internal — send typing event without debounce guard (used by sendMessage)
  function sendTypingRaw(conversationId: string, typing: boolean) {
    apiClient('/api/messages/typing', {
      method: 'POST',
      body: JSON.stringify({ conversation_id: conversationId, typing }),
    }).catch(() => {})
    isTypingRef.current = typing
    if (!typing) lastTypingSentRef.current = 0
  }

  // Debounced typing indicator — call on every keydown in MessageInput
  const sendTyping = useCallback((typing: boolean) => {
    const conversationId = activeConvRef.current
    if (!conversationId) return

    if (typing) {
      const now = Date.now()
      // Only re-send typing=true if 3s has elapsed since last send
      if (now - lastTypingSentRef.current > 3000) {
        lastTypingSentRef.current = now
        isTypingRef.current = true
        apiClient('/api/messages/typing', {
          method: 'POST',
          body: JSON.stringify({ conversation_id: conversationId, typing: true }),
        }).catch(() => {})
      }
      // Auto-stop after 4s of silence
      clearTimeout(typingTimerRef.current['stop'])
      typingTimerRef.current['stop'] = setTimeout(() => {
        sendTypingRaw(conversationId, false)
      }, 4000)
    } else {
      clearTimeout(typingTimerRef.current['stop'])
      if (isTypingRef.current) {
        sendTypingRaw(conversationId, false)
      }
    }
  }, [])

  // Load more (older) messages
  const loadMoreMessages = useCallback(async () => {
    const conversationId = activeConvRef.current
    if (!conversationId || !state.hasMore || state.loadingMessages) return
    dispatch({ type: 'SET_LOADING_MESSAGES', payload: true })
    pageRef.current += 1
    try {
      const data = await apiClient(`/api/messages/conversation/${conversationId}?page=${pageRef.current}`)
      const olderMsgs: Message[] = (data.messages ?? []).reverse()
      dispatch({ type: 'SET_MESSAGES', payload: {
        messages: [...olderMsgs, ...state.messages],
        hasMore: data.has_more ?? false
      }})
    } catch {
      pageRef.current -= 1
      dispatch({ type: 'SET_LOADING_MESSAGES', payload: false })
    }
  }, [state.hasMore, state.loadingMessages, state.messages])

  const markAsRead = useCallback(async (conversationId: string) => {
    dispatch({ type: 'MARK_CONVERSATION_READ', payload: conversationId })
    apiClient(`/api/messages/conversation/${conversationId}/read`, { method: 'PATCH' }).catch(() => {})
  }, [])

  const setSearchQuery = useCallback((q: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: q })
  }, [])

  // SSE event handler — called by NotificationContext
  const handleSSEEvent = useCallback((event: SSEMessagingEvent) => {
    if (event.type === 'new_message') {
      dispatch({ type: 'RECEIVE_MESSAGE', payload: event.data })
      if (activeConvRef.current === event.data.conversation_id) {
        apiClient(`/api/messages/conversation/${event.data.conversation_id}/read`, { method: 'PATCH' }).catch(() => {})
      }
    } else if (event.type === 'status_change') {
      dispatch({ type: 'UPDATE_ONLINE_STATUS', payload: event.data })
    } else if (event.type === 'typing_indicator') {
      const { user_id, conversation_id, typing } = event.data
      // Only show typing for the active conversation
      if (activeConvRef.current === conversation_id) {
        dispatch({ type: 'SET_TYPING', payload: event.data })
        if (typing) {
          // Auto-clear after 5s as safety net
          clearTimeout(typingTimerRef.current[user_id])
          typingTimerRef.current[user_id] = setTimeout(() => {
            dispatch({ type: 'CLEAR_TYPING', payload: { userId: user_id } })
          }, 5000)
        } else {
          clearTimeout(typingTimerRef.current[user_id])
        }
      }
    } else if (event.type === 'receipt_update') {
      dispatch({ type: 'UPDATE_RECEIPTS', payload: event.data })
    }
  }, [])

  return {
    state,
    actions: {
      loadInitialData,
      openConversation,
      sendMessage,
      loadMoreMessages,
      markAsRead,
      setSearchQuery,
      refreshConversations,
      handleSSEEvent,
      sendTyping,
    }
  }
}
