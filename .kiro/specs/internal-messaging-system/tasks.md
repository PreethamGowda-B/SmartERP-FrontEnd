# Implementation Plan — Internal Messaging System (Phase 1)

## Overview
Transform SmartERP's polling-based Messages module into a real-time internal communication system. Phase 1 delivers real-time text chat with online status, unread counts, and push notifications.

- [x] 1. Backend: Database Migration & New Schema
  - Create SQL migration file adding `conversations`, `conversation_participants` tables
  - Add `conversation_id`, `content`, `message_type` columns to existing `messages` table
  - Add all required indexes
  - **Requirements:** R1
  - [x] 1.1 Create migration file `004_internal_messaging.sql` with `conversations` and `conversation_participants` tables and indexes
  - [x] 1.2 Update `autoMigrate.js` to include the new migration

- [x] 2. Backend: New API Endpoints
  - Implement all new/upgraded endpoints on the backend messages route
  - **Requirements:** R2, R3, R5, R7, R8, R9
  - [x] 2.1 Add `GET /api/messages/contacts` endpoint returning all company users with online status
  - [x] 2.2 Add `POST /api/messages/conversations/start` get-or-create endpoint
  - [x] 2.3 Upgrade `GET /api/messages/conversations` to use new conversation-based model with unread counts and online status
  - [x] 2.4 Upgrade `GET /api/messages/conversation/:conversationId` to use conversation_id (paginated, plan-scoped)
  - [x] 2.5 Upgrade `POST /api/messages` to use conversation_id + broadcastToUser SSE event
  - [x] 2.6 Upgrade `PATCH /api/messages/conversation/:conversationId/read` to update `last_read_at`
  - [x] 2.7 Upgrade `GET /api/messages/unread-count` to use conversation_participants model
  - [x] 2.8 Add `GET /api/messages/search` endpoint for message content search

- [x] 3. Backend: Online Status (Redis)
  - Integrate online status tracking into the SSE connect/disconnect lifecycle
  - **Requirements:** R7
  - [x] 3.1 Update `notifications.js` SSE route to set/clear Redis hash `online_users:{companyId}` on connect/disconnect
  - [x] 3.2 Add `status_change` broadcast to `broadcastToUser` when user comes online/goes offline

- [x] 4. Frontend: TypeScript Types
  - Create shared messaging types file
  - **Requirements:** Design — types/messaging.ts
  - [x] 4.1 Create `types/messaging.ts` with all interfaces (Contact, ConversationItem, Message, MessagingState, MessagingActions)

- [x] 5. Frontend: MessagingContext & useMessaging Hook
  - Build the core state management for messaging
  - **Requirements:** R3, R4, R5
  - [x] 5.1 Create `hooks/useMessaging.ts` with full state logic (conversations, messages, send, mark-as-read, SSE integration)
  - [x] 5.2 Create `contexts/messaging-context.tsx` with MessagingProvider and useMessaging export

- [x] 6. Frontend: Messaging UI Components
  - Build all UI components defined in the design
  - **Requirements:** R4, R3
  - [x] 6.1 Create `components/messaging/MessagingLayout.tsx` — two-panel grid shell
  - [x] 6.2 Create `components/messaging/ConversationList.tsx` — left panel with search
  - [x] 6.3 Create `components/messaging/ConversationItem.tsx` — single conversation row with online dot, unread badge
  - [x] 6.4 Create `components/messaging/ChatArea.tsx` — right panel header + scrollable messages + input
  - [x] 6.5 Create `components/messaging/MessageBubble.tsx` — own/other message bubbles
  - [x] 6.6 Create `components/messaging/MessageInput.tsx` — controlled textarea with send on Enter

- [x] 7. Frontend: NotificationContext SSE Extension
  - Extend existing notification context to forward messaging SSE events
  - **Requirements:** R3, R7
  - [x] 7.1 Update `contexts/notification-context.tsx` to handle `new_message` and `status_change` SSE event types and forward them to MessagingContext callback

- [x] 8. Frontend: Owner & Employee Messages Pages
  - Replace polling-based pages with the new MessagingLayout
  - **Requirements:** R4
  - [x] 8.1 Replace `app/owner/messages/page.tsx` with new MessagingLayout-based page using MessagingProvider
  - [x] 8.2 Replace `app/employee/messages/page.tsx` internal-messaging section — keep job conversations tab, add internal messages tab using MessagingLayout

- [x] 9. Frontend: Online Status Polling Fallback
  - Implement 30s polling fallback when no SSE status_change is received
  - **Requirements:** R7
  - [x] 9.1 Create `hooks/useOnlineStatus.ts` — polls GET /api/messages/conversations every 30s to refresh online indicators
