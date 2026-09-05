"use client"

import { useState, useMemo } from "react"
import { OwnerLayout } from "@/components/owner-layout"
import { MessagingProvider, useMessagingContext } from "@/contexts/messaging-context"
import { MessagingLayout } from "@/components/messaging/MessagingLayout"
import { ConversationList } from "@/components/messaging/ConversationList"
import { ChatArea } from "@/components/messaging/ChatArea"

function OwnerMessagingInner() {
  const {
    contacts,
    conversations,
    activeConversationId,
    messages,
    hasMore,
    loadingMessages,
    loadingConversations,
    searchQuery,
    sending,
    typingUsers,
    actions,
  } = useMessagingContext()

  const [mobileShowChat, setMobileShowChat] = useState(false)

  // Find the active conversation's other user info
  const activeConv = useMemo(
    () => conversations.find(c => c.conversation_id === activeConversationId),
    [conversations, activeConversationId]
  )

  // If no active conv yet but we have a contact match
  const activeContact = useMemo(() => {
    if (activeConv) return null
    return contacts.find(c => {
      // Check if any conversation maps to this contact
      const conv = conversations.find(cv => cv.other_user_id === c.user_id)
      return conv?.conversation_id === activeConversationId
    })
  }, [activeConv, contacts, conversations, activeConversationId])

  const otherUserName = activeConv?.other_user_name ?? activeContact?.name ?? ""
  const otherUserRole = activeConv?.other_user_role ?? activeContact?.role ?? "employee"
  const otherUserOnline = activeConv?.other_user_online ?? activeContact?.online_status ?? false

  const handleSelect = async (userId: string, conversationId?: string | null) => {
    await actions.openConversation(userId, conversationId)
    setMobileShowChat(true)
  }

  const handleBack = () => setMobileShowChat(false)

  return (
    <MessagingLayout
      showChat={mobileShowChat}
      leftPanel={
        <ConversationList
          contacts={contacts}
          conversations={conversations}
          activeConversationId={activeConversationId}
          searchQuery={searchQuery}
          onSearchChange={actions.setSearchQuery}
          onSelect={handleSelect}
          loading={loadingConversations}
        />
      }
      rightPanel={
        <ChatArea
          conversationId={activeConversationId}
          otherUserName={otherUserName}
          otherUserRole={otherUserRole}
          otherUserOnline={otherUserOnline}
          messages={messages}
          hasMore={hasMore}
          loadingMessages={loadingMessages}
          sending={sending}
          typingUsers={typingUsers}
          onSend={actions.sendMessage}
          onLoadMore={actions.loadMoreMessages}
          onTyping={actions.sendTyping}
          onBack={handleBack}
        />
      }
    />
  )
}

export default function OwnerMessagesPage() {
  return (
    <OwnerLayout>
      <div className="-m-4 lg:-m-8">
        <MessagingProvider>
          <OwnerMessagingInner />
        </MessagingProvider>
      </div>
    </OwnerLayout>
  )
}
