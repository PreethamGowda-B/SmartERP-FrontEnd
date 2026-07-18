"use client"

import { useReducer, useCallback, useRef } from 'react'
import { apiClient } from '@/lib/apiClient'
import { toast } from 'sonner'
import type {
  MessagingState, Contact, ConversationItem, Message,
  SSEMessagingEvent, NewMessageEvent, StatusChangeEvent
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
}

// Actions (discriminated union)
type Action =
  | { type: 'SET_CONTACTS'; payload: Contact[] }
  | { type: 'SET_CONVERSATIONS'; payload: ConversationItem[] }
  | { type: 'SET_ACTIVE_CONVERSATION'; payload: string }
  | { type: 'SET_MESSAGES'; payload: { messages: Message[]; hasMore: boolean } }
  | { type: 'APPEND_MESSAGES'; payload: { messages: Message[]; hasMore: boolean } }
  | { type: 'PREPEND_MESSAGE'; payload: Message }  // optimistic send
  | { type: 'REPLACE_MESSAGE'; payload: { tempId: string; message: Message } }
  | { type: 'REMOVE_MESSAGE'; payload: string }   // remove by id
  | { type: 'RECEIVE_MESSAGE'; payload: NewMessageEvent }
  | { type: 'UPDATE_ONLINE_STATUS'; payload: StatusChangeEvent }
  | { type: 'SET_LOADING_MESSAGES'; payload: boolean }
  | { type: 'SET_LOADING_CONVERSATIONS'; payload: boolean }
  | { type: 'SET_SENDING'; payload: boolean }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'MARK_CONVERSATION_READ'; payload: string }

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
        messages: state.messages.map(m => m.id === action.payload.tempId ? action.payload.message : m)
      }
    case 'REMOVE_MESSAGE':
      return { ...state, sending: false, messages: state.messages.filter(m => m.id !== action.payload) }
    case 'RECEIVE_MESSAGE': {
      const { conversation_id, message_id, sender_id, sender_name, content, message_type, created_at } = action.payload
      const newMsg: Message = {
        id: message_id, conversation_id, sender_id, sender_name,
        content, message_type, created_at, is_mine: false
      }
      // Update conversation list in-place
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
      // Only append if this is the active conversation
      if (state.activeConversationId === conversation_id) {
        return { ...state, conversations: updatedConvs, messages: [...state.messages, newMsg] }
      }
      return { ...state, conversations: updatedConvs }
    }
    case 'UPDATE_ONLINE_STATUS': {
      const { user_id, online } = action.payload
      const updatedContacts = state.contacts.map(c =>
        c.user_id === user_id ? { ...c, online_status: online } : c
      )
      const updatedConvs = state.conversations.map(c =>
        c.other_user_id === user_id ? { ...c, other_user_online: online } : c
      )
      return { ...state, contacts: updatedContacts, conversations: updatedConvs }
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
    default:
      return state
  }
}

export function useMessaging(currentUserId: string) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const pageRef = useRef(1)
  const activeConvRef = useRef<string | null>(null)

  // Keep activeConvRef in sync
  const setActive = useCallback((id: string) => {
    activeConvRef.current = id
    dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: id })
  }, [])

  // Load contacts + conversations on mount
  const loadInitialData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING_CONVERSATIONS', payload: true })
    try {
      // Load contacts and conversations in parallel; handle each failure independently
      const [contactsResult, conversationsResult] = await Promise.allSettled([
        apiClient('/api/messages/contacts'),
        apiClient('/api/messages/conversations'),
      ])

      const contacts = contactsResult.status === 'fulfilled' && Array.isArray(contactsResult.value)
        ? contactsResult.value
        : []
      const conversations = conversationsResult.status === 'fulfilled' && Array.isArray(conversationsResult.value)
        ? conversationsResult.value
        : []

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

  // Open a conversation with a user
  const openConversation = useCallback(async (userId: string) => {
    try {
      // 1. Get or create conversation
      const { conversation_id } = await apiClient('/api/messages/conversations/start', {
        method: 'POST',
        body: JSON.stringify({ other_user_id: userId }),
      })
      // 2. Set active
      setActive(conversation_id)
      // 3. Optimistic reset unread
      dispatch({ type: 'MARK_CONVERSATION_READ', payload: conversation_id })
      // 4. Load messages
      dispatch({ type: 'SET_LOADING_MESSAGES', payload: true })
      pageRef.current = 1
      const data = await apiClient(`/api/messages/conversation/${conversation_id}?page=1`)
      const msgs: Message[] = (data.messages ?? []).reverse() // backend returns newest-first, flip for display
      dispatch({ type: 'SET_MESSAGES', payload: { messages: msgs, hasMore: data.has_more ?? false } })
      // 5. Mark as read on backend
      apiClient(`/api/messages/conversation/${conversation_id}/read`, { method: 'PATCH' }).catch(() => {})
    } catch (err: any) {
      dispatch({ type: 'SET_LOADING_MESSAGES', payload: false })
      toast.error(err?.message || 'Failed to open conversation')
    }
  }, [setActive])

  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    const conversationId = activeConvRef.current
    if (!conversationId || !content.trim() || state.sending) return

    const tempId = `temp_${Date.now()}`
    const optimisticMsg: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      sender_name: 'You',
      content: content.trim(),
      message_type: 'text',
      created_at: new Date().toISOString(),
      is_mine: true,
    }

    dispatch({ type: 'SET_SENDING', payload: true })
    dispatch({ type: 'PREPEND_MESSAGE', payload: optimisticMsg })

    try {
      const result = await apiClient('/api/messages', {
        method: 'POST',
        body: JSON.stringify({ conversation_id: conversationId, content: content.trim() }),
      })
      dispatch({ type: 'REPLACE_MESSAGE', payload: { tempId, message: { ...result, is_mine: true } } })
      // Update conversation list in-place
      dispatch({
        type: 'RECEIVE_MESSAGE',
        payload: {
          conversation_id: conversationId,
          message_id: result.id,
          sender_id: currentUserId,
          sender_name: 'You',
          content: content.trim(),
          message_type: 'text',
          created_at: result.created_at,
        },
      })
      // Undo the unread increment that RECEIVE_MESSAGE would add for own message
      dispatch({ type: 'MARK_CONVERSATION_READ', payload: conversationId })
    } catch (err: any) {
      dispatch({ type: 'REMOVE_MESSAGE', payload: tempId })
      toast.error(err?.message || 'Failed to send message')
    }
  }, [state.sending, currentUserId])

  // Load more (older) messages
  const loadMoreMessages = useCallback(async () => {
    const conversationId = activeConvRef.current
    if (!conversationId || !state.hasMore || state.loadingMessages) return
    dispatch({ type: 'SET_LOADING_MESSAGES', payload: true })
    pageRef.current += 1
    try {
      const data = await apiClient(`/api/messages/conversation/${conversationId}?page=${pageRef.current}`)
      const olderMsgs: Message[] = (data.messages ?? []).reverse()
      // Prepend older messages
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
      // Auto-mark as read if this conversation is currently open
      if (activeConvRef.current === event.data.conversation_id) {
        apiClient(`/api/messages/conversation/${event.data.conversation_id}/read`, { method: 'PATCH' }).catch(() => {})
      }
    } else if (event.type === 'status_change') {
      dispatch({ type: 'UPDATE_ONLINE_STATUS', payload: event.data })
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
    }
  }
}
