# Design Document — Internal Messaging System

## Overview

This document describes the technical architecture for transforming SmartERP's existing polling-based Messages module into a real-time internal communication system. The design builds directly on the existing SSE infrastructure, `broadcastToUser`/Redis pub-sub, `createNotification`, and `apiClient` patterns already present in the codebase.

**Phase 1** delivers real-time text chat with online status, unread counts, and push notifications.  
**Phase 2** adds attachments, relative timestamps, read receipts, and typing indicators.

---

## Architecture Overview

```
Frontend (Next.js 14)                    Backend (Express + PostgreSQL)
─────────────────────────────────────    ──────────────────────────────────────
MessagingContext                         /api/messages/* routes
  └─ useMessaging hook                     └─ authenticateToken + loadPlan
       ├─ NotificationContext (SSE)              + requireFeature('messages')
       │    └─ new_message events          New tables:
       ├─ apiClient calls                   conversations
       └─ local state                       conversation_participants
                                            messages (extended)
                                            message_attachments (Phase 2)
                                            message_read_receipts (Phase 2)
                                          broadcastToUser → Redis pub-sub
                                          → employee_notifications:{userId}
```

The frontend subscribes to the **existing** `/api/notifications/sse` channel. New SSE event types (`new_message`, `status_change`, `typing_indicator`, `receipt_update`) are broadcast through the same `broadcastToUser` utility so no second SSE endpoint is needed.

---

## Database Schema

### Migration Strategy

The existing `messages` table uses a `sender_id / receiver_id` model. The new design introduces a `conversations` table and adds a `conversation_id` FK to `messages`. Migration steps:

1. Create `conversations`, `conversation_participants` tables.
2. Add nullable `conversation_id` and `message_type` columns to `messages`.
3. Backfill: for each unique `(sender_id, receiver_id)` pair, create one `conversations` row and two `conversation_participants` rows, then set `messages.conversation_id`.
4. Add NOT NULL constraint after backfill.
5. Add `content` column as alias for existing `message` column (or rename via migration flag).

This keeps backward compatibility with existing job-message routes that do not use `conversation_id`.

### New Tables

```sql
-- conversations
CREATE TABLE conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id),
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

-- conversation_participants
CREATE TABLE conversation_participants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  joined_at       TIMESTAMP DEFAULT NOW(),
  last_read_at    TIMESTAMP DEFAULT NULL,
  UNIQUE (conversation_id, user_id)
);

-- message_attachments (Phase 2)
CREATE TABLE message_attachments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  company_id  UUID NOT NULL,
  file_url    TEXT NOT NULL,
  file_name   VARCHAR(255),
  file_type   VARCHAR(100),
  file_size   INTEGER,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- message_read_receipts (Phase 2)
CREATE TABLE message_read_receipts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id),
  status     VARCHAR(20) CHECK (status IN ('delivered', 'read')),
  timestamp  TIMESTAMP DEFAULT NOW(),
  UNIQUE (message_id, user_id, status)
);
```

### Existing `messages` Table Changes

```sql
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text'
    CHECK (message_type IN ('text', 'image', 'document'));

-- After backfill:
ALTER TABLE messages ALTER COLUMN conversation_id SET NOT NULL;
```

### Indexes

```sql
CREATE INDEX IF NOT EXISTS idx_messages_conv_created    ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_company         ON messages(company_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_user   ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_read_receipts_message    ON message_read_receipts(message_id);
```

---

## Online Status Store

Online status is tracked using the existing Redis instance:

- **Key**: `online_users:{companyId}` — a Redis Hash: `{ userId: "1" }`
- **On SSE connect** (`/api/notifications/sse`): `HSET online_users:{companyId} {userId} 1` + `EXPIRE` (60s rolling TTL refreshed by heartbeat)
- **On SSE disconnect**: `HDEL online_users:{companyId} {userId}`; broadcast `status_change` to company
- **Fallback** (no Redis): in-process `Map<companyId, Set<userId>>` in `notificationHelpers.js`

`GET /api/messages/contacts` and `GET /api/messages/conversations` read this hash for the `online_status` field.

---

## Backend API Design

All routes remain under `router.use(authenticateToken, loadPlan, requireFeature('messages'))`.

### New / Changed Endpoints

#### `GET /api/messages/contacts`
Returns all users in the same company (owner sees all employees; employee sees owner + all employees). Includes `online_status` from Redis hash.

```js
// Response shape
[{
  user_id: string,
  name: string,
  role: string,       // 'owner' | 'admin' | 'employee'
  online_status: boolean
}]
```

#### `POST /api/messages/conversations/start`
Get-or-create a conversation between `current_user` and `other_user_id`. Verifies both users share the same `company_id`. Creates conversation + two participant rows in a single transaction.

```js
// Request body
{ other_user_id: string }

// Response
{ conversation_id: string, created: boolean }
```

#### `GET /api/messages/conversations` *(upgraded)*
Returns all conversations for the authenticated user sorted by `updated_at DESC`. Computes `unread_count` via `messages.created_at > cp.last_read_at WHERE sender_id != currentUser`. Includes `other_user_online` from Redis hash.

```js
// Response shape (per item)
{
  conversation_id: string,
  other_user_id: string,
  other_user_name: string,
  other_user_role: string,
  last_message: string,       // max 80 chars
  last_message_time: string,  // ISO UTC
  unread_count: number,
  is_last_message_mine: boolean,
  other_user_online: boolean
}
```

#### `GET /api/messages/conversation/:conversationId` *(upgraded)*
Returns paginated messages (page size 50, newest-first via `?page=`) filtered by `messages_history_days`. Verifies the requester is a participant.

```js
// Response
{
  messages: [{
    id, conversation_id, sender_id, sender_name,
    content, message_type, created_at,
    is_mine: boolean,
    attachment?: { file_url, file_name, file_type, file_size }  // Phase 2
  }],
  has_more: boolean
}
```

#### `POST /api/messages` *(upgraded)*
Sends a message. Requires `conversation_id` + `content`. Validates participant membership. Inserts into `messages`, updates `conversations.updated_at`, then:
1. `broadcastToUser(recipientId, { type: 'new_message', ... })`
2. `createNotification(...)` for push + SSE notification toast

#### `PATCH /api/messages/conversation/:conversationId/read` *(upgraded)*
Updates `conversation_participants.last_read_at = NOW()` for the current user. Phase 2: also upserts `message_read_receipts` rows and broadcasts `receipt_update` to sender.

#### `GET /api/messages/unread-count` *(upgraded)*
Counts messages where `created_at > last_read_at` and `sender_id != currentUser` across all conversations for the user.

#### `GET /api/messages/search`
```
GET /api/messages/search?q={query}&conversationId={id}
```
Case-insensitive `ILIKE` search on `messages.content` within a conversation, scoped to `company_id`. Returns up to 50 matches. Requires `q.length >= 2` and participant membership check.

#### `POST /api/messages/typing` *(Phase 2)*
Broadcasts `typing_indicator` SSE event to recipient. Not persisted to DB.

```js
// Request body
{ conversation_id: string, typing: boolean }
```

#### `POST /api/messages/upload` *(Phase 2)*
Accepts `multipart/form-data` with `attachment` field. Uses `multer-storage-cloudinary`. Enforces 10 MB limit. Returns `{ file_url, file_name, file_type, file_size }`.

---

## SSE Event Protocol

All events flow through the existing `employee_notifications:{userId}` Redis channel via `broadcastToUser`. The frontend `NotificationContext` already listens on this channel — it needs to be extended to handle new event types.

### Event Shapes

```ts
// new_message — sent to recipient
{ type: 'new_message', data: {
    conversation_id: string,
    message_id: string,
    sender_id: string,
    sender_name: string,
    content: string,
    message_type: 'text' | 'image' | 'document',
    created_at: string
}}

// status_change — broadcast to all company SSE connections
{ type: 'status_change', data: {
    user_id: string,
    online: boolean
}}

// typing_indicator — sent to recipient (Phase 2)
{ type: 'typing_indicator', data: {
    conversation_id: string,
    user_id: string,
    user_name: string,
    typing: boolean
}}

// receipt_update — sent to sender (Phase 2)
{ type: 'receipt_update', data: {
    conversation_id: string,
    message_ids: string[],
    status: 'delivered' | 'read'
}}
```

---

## Frontend Architecture

### File Structure

```
app/
  owner/messages/page.tsx          ← replace polling with MessagingContext
  employee/messages/page.tsx       ← new page (same pattern as owner)

components/messaging/
  MessagingLayout.tsx              ← two-panel shell (list + chat)
  ConversationList.tsx             ← left panel
  ConversationItem.tsx             ← single row in list
  ContactsList.tsx                 ← contacts tab (no existing conversation)
  ChatArea.tsx                     ← right panel: header + messages + input
  MessageBubble.tsx                ← text / image / document bubble
  MessageInput.tsx                 ← textarea + send + attach (Phase 2)
  DateSeparator.tsx                ← "Today" / "Yesterday" dividers (Phase 2)
  TypingIndicator.tsx              ← animated dots (Phase 2)
  AttachmentPreview.tsx            ← lightbox + doc card (Phase 2)

contexts/
  messaging-context.tsx            ← MessagingProvider + useMessaging

hooks/
  useMessaging.ts                  ← core state logic
  useOnlineStatus.ts               ← 30s poll fallback for online status
  useTypingIndicator.ts            ← debounced typing events (Phase 2)
  useTimestamps.ts                 ← 60s interval refresh (Phase 2)

types/
  messaging.ts                     ← shared TypeScript types
```

### `MessagingContext` State Shape

```ts
interface MessagingState {
  // Contacts (merged with conversations)
  contacts: Contact[]              // all company users
  conversations: ConversationItem[]

  // Active conversation
  activeConversationId: string | null
  messages: Message[]
  hasMore: boolean
  loadingMessages: boolean

  // UI
  searchQuery: string
  sending: boolean
  typingUsers: Record<string, { name: string; until: number }> // Phase 2
}

interface MessagingActions {
  openConversation: (userId: string) => Promise<void>
  sendMessage: (content: string) => Promise<void>
  loadMoreMessages: () => Promise<void>
  markAsRead: (conversationId: string) => Promise<void>
  setSearchQuery: (q: string) => void
  sendTyping: (typing: boolean) => void  // Phase 2
}
```

### SSE Integration with `NotificationContext`

`MessagingContext` subscribes to `NotificationContext` events (already available via `useNotifications`). The `notification-context.tsx` SSE handler is extended with a new branch:

```ts
// In notification-context.tsx onmessage handler (addition):
} else if (data.type === 'new_message') {
  messagingDispatch({ type: 'RECEIVE_MESSAGE', payload: data.data })
} else if (data.type === 'status_change') {
  messagingDispatch({ type: 'UPDATE_ONLINE_STATUS', payload: data.data })
} else if (data.type === 'typing_indicator') {   // Phase 2
  messagingDispatch({ type: 'SET_TYPING', payload: data.data })
} else if (data.type === 'receipt_update') {      // Phase 2
  messagingDispatch({ type: 'UPDATE_RECEIPTS', payload: data.data })
}
```

`MessagingContext` exposes an `onSSEEvent` callback that `NotificationContext` calls — this avoids direct coupling between contexts.

### Conversation List Logic

The list merges `contacts` (from `GET /api/messages/contacts`) with `conversations` (from `GET /api/messages/conversations`):

- Contacts that have an existing conversation: show last message, unread badge, timestamp.
- Contacts with no conversation: show "Start a conversation" placeholder, zero unread.
- Sort: unread first, then by `last_message_time DESC`.
- Search: client-side `name.toLowerCase().includes(query)` with 300ms debounce; switches to server search (`GET /api/messages/search`) when a conversation is open and query ≥ 2 chars.

### `openConversation` Flow

```
1. Call POST /api/messages/conversations/start  → { conversation_id }
2. Set activeConversationId in state
3. Reset unread count to 0 in conversations list (optimistic)
4. Call GET /api/messages/conversation/:id?page=1
5. Append messages to state
6. Call PATCH /api/messages/conversation/:id/read
7. Scroll to bottom
```

### `sendMessage` Flow

```
1. Validate content (non-empty, ≤ 2000 chars)
2. Optimistic append to messages state with temp id
3. Call POST /api/messages  { conversation_id, content }
4. Replace temp message with server response on success
5. Remove temp message on error + show toast
6. Update conversation list: last_message, last_message_time (in-place, no refetch)
```

### `RECEIVE_MESSAGE` (SSE) Flow

```
IF activeConversationId === event.conversation_id:
  → append message to messages list
  → call PATCH /conversation/:id/read (auto-mark as read)
  → scroll to bottom
ELSE:
  → increment unread_count on matching conversation (in-place)
  → move conversation to top of list (in-place sort)
```

---

## Phase 2 Additions

### Relative Timestamps (`useTimestamps`)

- `date-fns` `formatDistanceToNow` for relative labels.
- A `setInterval(60_000)` re-renders timestamp display.
- `Intl.DateTimeFormat` for local timezone conversion.
- Date separators grouped by `format(date, 'yyyy-MM-dd')` comparison between adjacent messages.

### Typing Indicator (`useTypingIndicator`)

- `keydown` on `MessageInput` → call `POST /api/messages/typing { typing: true }` (debounced, only on first keydown after 3s silence).
- After send or 3s no keydown → call `POST /api/messages/typing { typing: false }`.
- Receiver: on `typing_indicator` SSE event, set `typingUsers[userId] = { name, until: now + 5000 }`. Auto-hide via `clearTimeout`.

### Read Receipts (`MessageBubble` Phase 2)

Receipt icon rendered below sent bubbles:
- No receipt row → single gray ✓ (sent)
- `status = 'delivered'` → double gray ✓✓
- `status = 'read'` → double blue ✓✓

Backend inserts a `delivered` receipt row in the same transaction as the message insert. `PATCH /conversation/:id/read` upserts `read` receipts and broadcasts `receipt_update` to sender.

### Attachments

Upload flow:
1. User selects file → `POST /api/messages/upload` (FormData).
2. On success, `sendMessage` includes `{ conversation_id, content: '', message_type, attachment: { file_url, file_name, file_type, file_size } }`.
3. Backend inserts `messages` + `message_attachments` in one transaction.
4. `MessageBubble` renders inline `<img>` (max-w-[240px]) for images or a doc card for documents.
5. Image tap opens a Dialog lightbox (Radix `Dialog` component already available).

---

## Multi-Tenant Isolation Checklist

Every backend query includes `company_id` as a parameterized filter. Key enforcement points:

| Endpoint | Isolation Mechanism |
|---|---|
| `POST /conversations/start` | JOIN verify both users have same `company_id` |
| `GET /conversations` | `conversations.company_id = $companyId` |
| `GET /conversation/:id` | participant check (participant.company_id implicit via FK) |
| `POST /messages` | participant membership check before insert |
| `PATCH /conversation/:id/read` | participant membership check |
| `GET /search` | `messages.company_id = $companyId` |
| SSE broadcasts | `broadcastToUser` called only after company_id verification |

No string interpolation in SQL. All values passed as positional parameters (`$1`, `$2`, ...).

---

## Component Breakdown

### `MessagingLayout`

Two-panel layout using CSS Grid (`grid-cols-[320px_1fr]` on desktop, single column on mobile). Left panel is always mounted to preserve scroll position; right panel conditionally renders `ChatArea` or an empty state.

### `ConversationList`

```tsx
// Props
interface ConversationListProps {
  items: (ConversationItem | Contact)[]
  activeId: string | null
  onSelect: (userId: string) => void
  searchQuery: string
  onSearchChange: (q: string) => void
}
```

Renders `ConversationItem` for each entry. Uses `ScrollArea` from Radix for the list container.

### `ConversationItem`

Displays: `Avatar` with initials, online dot (absolute positioned on avatar), name, role `Badge`, last message preview (60 char truncate), relative timestamp, unread `Badge`. Highlights active item.

### `ChatArea`

Three vertical sections: header (avatar + name + online status + search icon), scrollable message list, input area. `useEffect` scrolls to bottom on new messages. Virtualization is not needed for the initial 50-message page size.

### `MessageBubble`

```tsx
interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showTimestamp: boolean  // Phase 2
  receipt?: 'sent' | 'delivered' | 'read'  // Phase 2
}
```

Own messages: right-aligned, `bg-primary text-primary-foreground`. Other messages: left-aligned, `bg-muted`. Max width `max-w-[70%]`.

### `MessageInput`

Controlled `Textarea` (auto-resize, max 120px). Enter sends (Shift+Enter = newline). Sends `typing` events on keydown. Paperclip button triggers hidden file `<input>` (Phase 2).

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Send fails | Remove optimistic message; show Sonner toast error |
| SSE disconnects | `NotificationContext` auto-reconnects (3s backoff); polling fallback every 30s |
| Upload fails | Clear attachment preview; show toast |
| 403 on conversation access | Redirect to messages list; show toast |
| Network timeout on load | Show skeleton + retry button |

---

## Requirements Traceability

| Requirement | Design Section |
|---|---|
| R1 — Database Schema | Database Schema section |
| R2 — Conversation Init & Access Control | `POST /conversations/start`, `GET /conversations` |
| R3 — Sending & Receiving | `POST /messages`, SSE `new_message`, `sendMessage` flow |
| R4 — Conversation List UI | `ConversationList`, `MessagingContext` state |
| R5 — Mark as Read | `PATCH /conversation/:id/read`, `openConversation` flow |
| R6 — Push Notifications | `createNotification` in `POST /messages` handler |
| R7 — Online Status | Redis Hash, `status_change` SSE, `useOnlineStatus` |
| R8 — Search | `GET /search`, client-side name filter |
| R9 — Multi-Tenant Isolation | Multi-Tenant Isolation Checklist |
| R10 — Attachments | Phase 2 Attachments section |
| R11 — Timestamps | `useTimestamps`, `DateSeparator` |
| R12 — Read Receipts | Phase 2 Read Receipts section |
| R13 — Typing Indicator | `useTypingIndicator`, `TypingIndicator` component |
