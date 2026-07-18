# Requirements Document

## Introduction

This document specifies requirements for transforming SmartERP's existing Messages module into a complete real-time internal communication system. The system enables direct messaging between Owner and Employees within a company, similar in UX to WhatsApp/Microsoft Teams. It is delivered in two phases: Phase 1 covers the core real-time text chat experience; Phase 2 adds rich media (images, PDFs), message timestamps with relative formatting, read receipts, and typing indicators.

The system builds on the existing stack: Node.js/Express + PostgreSQL backend, Next.js 14 frontend, the existing SSE notification infrastructure (via `broadcastToUser` / Redis pub-sub), and Cloudinary for file storage. Multi-tenant isolation is enforced at every layer via `company_id`. Access is role-scoped: Owner sees all company employees; Employee sees the Owner and all colleagues; Customer access remains scoped to job-based conversations (unchanged by this spec).

---

## Glossary

- **Messaging_System**: The internal real-time messaging feature described in this document.
- **Conversation**: A persistent, bilateral chat thread between exactly two internal users within the same company.
- **Message**: A single text or media item sent within a Conversation.
- **Participant**: A user who is a member of a Conversation.
- **Sender**: The user who authored a Message.
- **Recipient**: The Participant who receives a Message and is not the Sender.
- **Owner**: A user with role `owner` or `admin` in the SmartERP users table.
- **Employee**: A user with role `employee` in the SmartERP users table.
- **Customer**: A user accessing SmartERP via the customer portal — out of scope for this spec.
- **Company**: A tenant identified by `company_id`; all data is strictly isolated per Company.
- **Online_Status**: A boolean indicator of whether a user currently has an active SSE connection.
- **Unread_Count**: The number of Messages in a Conversation that the Recipient has not yet viewed.
- **Read_Receipt**: A per-message acknowledgement of the delivery and read state (sent → delivered → read).
- **Typing_Indicator**: A transient signal that a Participant is currently composing a Message.
- **Attachment**: A file (image or document) uploaded via Cloudinary and linked to a Message.
- **SSE**: Server-Sent Events — the existing real-time push channel used by the notification system.
- **apiClient**: The authenticated HTTP client in `lib/apiClient.ts` used by all frontend API calls.
- **broadcastToUser**: The existing utility in `utils/notificationHelpers.js` that publishes SSE events to a specific user via Redis pub-sub.
- **Plan**: The subscription plan object loaded by `loadPlan` middleware; governs `messages_history_days`.

---

## Requirements

### Requirement 1: Database Schema for Internal Messaging

**User Story:** As a developer, I want well-structured database tables for conversations, messages, attachments, and read receipts, so that the messaging feature has a reliable, queryable, and multi-tenant-safe data foundation.

#### Acceptance Criteria

1. THE Messaging_System SHALL maintain a `conversations` table with columns: `id` (UUID PK), `company_id` (UUID FK → companies, NOT NULL), `created_at` (TIMESTAMP), `updated_at` (TIMESTAMP).
2. THE Messaging_System SHALL maintain a `conversation_participants` table with columns: `id` (UUID PK), `conversation_id` (UUID FK → conversations ON DELETE CASCADE), `user_id` (UUID FK → users), `joined_at` (TIMESTAMP), `last_read_at` (TIMESTAMP DEFAULT NULL), with a UNIQUE constraint on `(conversation_id, user_id)`.
3. THE Messaging_System SHALL maintain a `messages` table with columns: `id` (UUID PK), `conversation_id` (UUID FK → conversations ON DELETE CASCADE), `sender_id` (UUID FK → users), `company_id` (UUID FK → companies, NOT NULL), `content` (TEXT, CHECK length > 0 AND length ≤ 2000), `message_type` (VARCHAR(20) DEFAULT 'text', CHECK IN ('text', 'image', 'document')), `created_at` (TIMESTAMP DEFAULT NOW()), `updated_at` (TIMESTAMP DEFAULT NOW()).
4. THE Messaging_System SHALL maintain a `message_attachments` table with columns: `id` (UUID PK), `message_id` (UUID FK → messages ON DELETE CASCADE), `company_id` (UUID NOT NULL), `file_url` (TEXT NOT NULL), `file_name` (VARCHAR(255)), `file_type` (VARCHAR(100)), `file_size` (INTEGER), `created_at` (TIMESTAMP DEFAULT NOW()).
5. THE Messaging_System SHALL maintain a `message_read_receipts` table with columns: `id` (UUID PK), `message_id` (UUID FK → messages ON DELETE CASCADE), `user_id` (UUID FK → users), `status` (VARCHAR(20) CHECK IN ('delivered', 'read')), `timestamp` (TIMESTAMP DEFAULT NOW()), with a UNIQUE constraint on `(message_id, user_id, status)`.
6. THE Messaging_System SHALL create indexes on: `messages(conversation_id, created_at)`, `messages(company_id)`, `conversation_participants(user_id)`, `message_read_receipts(message_id)`.
7. IF the `company_id` column does not exist on the legacy `messages` table, THEN THE Messaging_System SHALL add it via a migration; IF the column already exists, THE Messaging_System SHALL verify that the NOT NULL constraint and the FK reference to `companies` are present and add any missing constraints without re-running the column addition.

---

### Requirement 2: Conversation Initialization and Participant Access Control

**User Story:** As an Owner or Employee, I want the system to automatically create or retrieve the correct conversation when I open a chat, so that I never have duplicate threads and I can only access conversations within my company.

#### Acceptance Criteria

1. WHEN an authenticated user requests a conversation with another user, THE Messaging_System SHALL return an existing Conversation between those two users if one already exists within the same Company, or create a new one if none exists (upsert / get-or-create pattern).
2. THE Messaging_System SHALL enforce that both participants share the same `company_id`; IF either participant belongs to a different company, THEN THE Messaging_System SHALL return HTTP 403.
3. WHEN a Conversation is created, THE Messaging_System SHALL insert both users as Participants in `conversation_participants` within the same database transaction.
4. THE Messaging_System SHALL enforce role-based visibility: an Owner SHALL be allowed to initiate or view conversations with any Employee in the same Company; an Employee SHALL be allowed to initiate or view conversations with the Owner and with any other Employee in the same Company.
5. IF a user attempts to access a Conversation where they are not a Participant, THEN THE Messaging_System SHALL return HTTP 403.
6. THE Messaging_System SHALL expose a `GET /api/messages/conversations` endpoint that returns all Conversations for the authenticated user, sorted by `updated_at` descending, including: `conversation_id`, `other_user_id`, `other_user_name`, `other_user_role`, `last_message` (text preview, max 80 chars), `last_message_time`, `unread_count`, `is_last_message_mine`, `other_user_online` (boolean).
7. THE Messaging_System SHALL expose a `GET /api/messages/contacts` endpoint that requires authentication and enforces role-based authorization, returning all users in the same company (for the Owner: all Employees; for an Employee: Owner + all Employees), including `user_id`, `name`, `role`, `online_status`, regardless of whether a Conversation exists — so a user can start a new chat from the contacts list.

---

### Requirement 3: Sending and Receiving Text Messages

**User Story:** As a user, I want to send and receive text messages in real-time without refreshing the page, so that I can have natural, fluid conversations with colleagues.

#### Acceptance Criteria

1. WHEN a Sender submits a message, THE Messaging_System SHALL insert a new row into the `messages` table with `message_type = 'text'` and return it in the HTTP 201 response within 500ms under normal load.
2. THE Messaging_System SHALL validate that `content` is not empty and does not exceed 2000 characters; IF either condition is violated, THEN THE Messaging_System SHALL return HTTP 400 with a descriptive error message.
3. WHEN a message is inserted, THE Messaging_System SHALL call `broadcastToUser` to push a real-time SSE event of type `new_message` to the Recipient's active SSE connection, containing: `conversation_id`, `message_id`, `sender_id`, `sender_name`, `content`, `message_type`, `created_at`.
4. WHEN the Recipient's SSE connection receives a `new_message` event, THE Messaging_System frontend SHALL append the message to the active conversation view without a full page reload, IF the Recipient currently has that Conversation open.
5. WHEN a `new_message` SSE event is received for a Conversation that is NOT currently open, THE Messaging_System frontend SHALL increment the Unread_Count badge for that Conversation in the conversation list.
6. THE Messaging_System SHALL expose a `GET /api/messages/conversation/:conversationId` endpoint that returns paginated messages (newest-first, page size 50) for a given Conversation, filtered by the Plan's `messages_history_days` limit.
7. IF a user requests messages for a Conversation where they are not a Participant, THEN THE Messaging_System SHALL return HTTP 403.
8. WHEN a message is sent, THE Messaging_System SHALL update `conversations.updated_at` to `NOW()` so conversation lists remain sorted correctly.

---

### Requirement 4: Conversation List UI (Owner and Employee Pages)

**User Story:** As an Owner or Employee, I want a WhatsApp-style conversation sidebar showing all company contacts with their online status, last message, and unread count, so that I can instantly see who I need to reply to.

#### Acceptance Criteria

1. THE Messaging_System frontend SHALL render a left-panel conversation list on both `/owner/messages` and `/employee/messages` pages, showing all company contacts regardless of whether a prior conversation exists.
2. WHEN a contact has no prior Conversation, THE Messaging_System frontend SHALL display that contact with a "Start a conversation" placeholder and zero unread count.
3. THE Messaging_System frontend SHALL display for each contact: avatar with initials, full name, role badge, Online_Status indicator (green dot if online), last message preview (truncated to 60 characters), relative timestamp (e.g. "2m ago", "Yesterday"), and Unread_Count badge.
4. WHEN a new SSE `new_message` event arrives, THE Messaging_System frontend SHALL update the conversation list in-place — updating last message preview with the actual message content, timestamp, and Unread_Count — without triggering a full list refetch; IF the in-place update cannot be applied, THE Messaging_System frontend SHALL NOT fall back to a full refetch.
5. THE Messaging_System frontend SHALL support searching conversations by contact name or message content via a debounced input field (300ms debounce).
6. THE Messaging_System frontend SHALL sort conversations with unread messages to the top, followed by most recently active conversations.
7. WHEN the user opens a Conversation, THE Messaging_System frontend SHALL immediately reset the Unread_Count to 0 for that Conversation in the UI and call the mark-as-read endpoint.

---

### Requirement 5: Mark as Read and Unread Counts

**User Story:** As a user, I want messages to be automatically marked as read when I open a conversation, so that my unread count accurately reflects messages I haven't seen.

#### Acceptance Criteria

1. WHEN a user opens a Conversation, THE Messaging_System SHALL call `PATCH /api/messages/conversation/:conversationId/read` to update `conversation_participants.last_read_at` to `NOW()` for that user.
2. THE Messaging_System SHALL compute Unread_Count for a Conversation as the count of messages with `created_at > last_read_at` where `sender_id != current_user_id`.
3. THE Messaging_System SHALL expose a `GET /api/messages/unread-count` endpoint that returns the total unread count across all Conversations for the authenticated user, scoped to `company_id`.
4. WHEN the mark-as-read call completes, THE Messaging_System frontend SHALL update the global notification badge (existing unread count indicator in the layout) to reflect the new total.
5. WHILE a user has a Conversation open, THE Messaging_System SHALL automatically mark any new incoming messages in that Conversation as read immediately upon receipt via SSE, excluding messages sent by the current user.

---

### Requirement 6: Push Notifications for New Messages

**User Story:** As a user, I want to receive a push notification and toast alert when a new message arrives while I'm on another page or have the app in the background, so that I never miss important communications.

#### Acceptance Criteria

1. WHEN a message is sent, THE Messaging_System SHALL call `createNotification` with `type = 'message'`, `priority = 'high'` if sender is Owner else `'medium'`, and `data.url` pointing to the recipient's messages page (`/owner/messages` or `/employee/messages`).
2. THE Messaging_System SHALL include the sender's name in the notification `title` and the first 80 characters of the message content in the notification `message`.
3. WHEN the Recipient's device has a registered FCM token, THE Messaging_System SHALL deliver a push notification via the existing `sendMulticastPush` function.
4. WHEN the Recipient has an active SSE connection (app open in browser), THE Messaging_System frontend notification context SHALL display a toast with an action button "View" that navigates to the messages page.
5. THE Messaging_System SHALL NOT send a push notification to the Sender (self-notification prevention via existing `actor_id` guard in `createNotification`).

---

### Requirement 7: Real-Time Online Status

**User Story:** As a user, I want to see which colleagues are currently online, so that I know who is available to respond quickly.

#### Acceptance Criteria

1. WHEN a user establishes an SSE connection, THE Messaging_System SHALL record the user as online by updating an in-memory or Redis-backed status store keyed by `user_id`.
2. WHEN a user's SSE connection closes or times out, THE Messaging_System SHALL mark that user as offline within 30 seconds.
3. THE `GET /api/messages/contacts` and `GET /api/messages/conversations` endpoints SHALL include an `online_status` boolean field for each contact, derived from the status store.
4. THE Messaging_System frontend SHALL poll `GET /api/messages/conversations` every 30 seconds to refresh Online_Status indicators when no SSE `status_change` event has been received.
5. WHEN a user's Online_Status changes, THE Messaging_System SHALL broadcast a `status_change` SSE event containing `user_id` and `online` (boolean) to all users in the same Company who have active SSE connections.

---

### Requirement 8: Search Conversations and Messages

**User Story:** As a user, I want to search across conversations by contact name and within a conversation by message text, so that I can find important information quickly.

#### Acceptance Criteria

1. THE Messaging_System frontend SHALL provide a search input in the conversation list sidebar that filters contacts/conversations by name using a 300ms debounce.
2. THE Messaging_System SHALL expose a `GET /api/messages/search?q={query}&conversationId={id}` endpoint that performs a case-insensitive full-text search on `messages.content` within a specific Conversation, scoped to `company_id`, returning up to 50 matching messages with their `created_at` timestamps.
3. WHEN the search query is empty, THE Messaging_System frontend SHALL immediately return to the full conversation view without making a search API call; IF the system is already displaying search results when the query becomes empty, THE Messaging_System frontend SHALL replace the search results with the full conversation view immediately.
4. THE Messaging_System SHALL scope all search queries to the authenticated user's `company_id` to enforce multi-tenant isolation.
5. IF the search query is fewer than 2 characters, THE Messaging_System SHALL not execute the search API call.

---

### Requirement 9: Multi-Tenant Isolation

**User Story:** As a security-conscious platform operator, I want every database query and SSE broadcast to be strictly scoped to the user's company, so that no data from one tenant is ever accessible to another.

#### Acceptance Criteria

1. THE Messaging_System SHALL include `company_id` as a mandatory filter on every SQL query that reads or writes to `conversations`, `messages`, `conversation_participants`, `message_attachments`, and `message_read_receipts`.
2. WHEN creating a Conversation, THE Messaging_System SHALL verify via a JOIN that both participant `user_id` values belong to the same `company_id` row in the `users` table before inserting.
3. THE Messaging_System SHALL use parameterized queries for all database operations; string interpolation into SQL SHALL NOT be used.
4. WHEN broadcasting an SSE `new_message` or `status_change` event, THE Messaging_System SHALL only call `broadcastToUser` for users whose `company_id` matches the sender's `company_id`.
5. THE Messaging_System SHALL apply `requireFeature('messages')` and `authenticateToken` middleware globally to all `/api/messages/*` routes.

---

### Requirement 10: Phase 2 — Image and Document Attachments

**User Story:** As a user, I want to send images and PDF/document files in a conversation, so that I can share visual evidence, reports, or instructions with colleagues without leaving the app.

#### Acceptance Criteria

1. THE Messaging_System SHALL expose a `POST /api/messages/upload` endpoint that accepts a `multipart/form-data` request with a single file field `attachment`, uploads the file to Cloudinary via the existing `multer-storage-cloudinary` integration, and returns `{ file_url, file_name, file_type, file_size }`.
2. WHEN the uploaded file is an image (MIME type `image/*`), THE Messaging_System SHALL store `message_type = 'image'`; WHEN the file is a PDF or document (MIME type `application/pdf` or `application/msword` or `application/vnd.openxmlformats-officedocument.*`), THE Messaging_System SHALL store `message_type = 'document'`.
3. THE Messaging_System SHALL enforce a maximum file size of 10 MB per upload; IF the file exceeds this limit, THEN THE Messaging_System SHALL return HTTP 413 with the message "File too large (max 10 MB)".
4. WHEN a message with `message_type = 'image'` is received, THE Messaging_System frontend SHALL render an inline image thumbnail (max 240px wide) with a tap-to-expand lightbox.
5. WHEN a message with `message_type = 'document'` is received, THE Messaging_System frontend SHALL render a document card showing file name, file size, and a download link.
6. WHEN an attachment message is sent, THE Messaging_System SHALL insert a row in both `messages` and `message_attachments` within a single database transaction; IF either insert fails, THEN THE Messaging_System SHALL rollback both; THE Messaging_System frontend SHALL only render the message as sent after the transaction completes successfully.

---

### Requirement 11: Phase 2 — Message Timestamps

**User Story:** As a user, I want to see accurate, human-readable timestamps on each message, so that I can understand the context and timeline of a conversation.

#### Acceptance Criteria

1. THE Messaging_System frontend SHALL display a relative timestamp below each message bubble (e.g. "Just now", "5m ago", "2h ago", "Yesterday at 14:30", full date for messages older than 7 days).
2. THE Messaging_System frontend SHALL group messages by calendar date with a centered date separator (e.g. "Today", "Yesterday", "12 Jul 2025") whenever the date changes between consecutive messages.
3. THE Messaging_System frontend SHALL update relative timestamps without a page reload; timestamps SHALL refresh every 60 seconds using a client-side interval.
4. THE Messaging_System SHALL store all timestamps in UTC in the database; THE Messaging_System frontend SHALL convert to the user's local timezone for display using the browser's `Intl.DateTimeFormat`.

---

### Requirement 12: Phase 2 — Read Receipts

**User Story:** As a user, I want to see whether my sent messages have been delivered and read, so that I know my communication was received.

#### Acceptance Criteria

1. WHEN a message is inserted into the database, THE Messaging_System SHALL automatically insert a `message_read_receipts` row with `status = 'delivered'` for the Recipient within the same transaction.
2. WHEN the Recipient opens the Conversation, THE Messaging_System SHALL upsert a `message_read_receipts` row with `status = 'read'` for all unread messages visible on screen, and broadcast a `receipt_update` SSE event to the Sender containing `message_ids` and `status = 'read'`.
3. THE Messaging_System frontend SHALL render a receipt icon below each sent message bubble: a single checkmark (✓) for sent (stored, no delivery receipt yet), double checkmark (✓✓) for delivered, and double blue checkmark (✓✓) for read.
4. WHEN the Sender's SSE connection receives a `receipt_update` event, THE Messaging_System frontend SHALL update the receipt icons for the affected messages without a full re-render.
5. THE Messaging_System SHALL NOT expose read receipt data for messages the authenticated user did not send; IF a user queries receipts for another user's messages, THEN THE Messaging_System SHALL return HTTP 403.

---

### Requirement 13: Phase 2 — Typing Indicator

**User Story:** As a user, I want to see when my conversation partner is typing, so that I know a response is coming and I don't send a duplicate message.

#### Acceptance Criteria

1. WHEN a user is actively typing in the message input (keydown event fires), THE Messaging_System frontend SHALL call `POST /api/messages/typing` with `{ conversation_id, typing: true }`.
2. WHEN the user stops typing for 3 seconds or sends a message, THE Messaging_System frontend SHALL call `POST /api/messages/typing` with `{ conversation_id, typing: false }`.
3. WHEN the backend receives a typing event, THE Messaging_System SHALL broadcast a `typing_indicator` SSE event to the Recipient containing `{ conversation_id, user_id, user_name, typing: boolean }`.
4. WHEN the Recipient's SSE receives a `typing_indicator` event with `typing: true`, THE Messaging_System frontend SHALL display an animated "typing…" indicator below the last message in that Conversation; WHEN a `typing_indicator` event with `typing: false` is received, THE Messaging_System frontend SHALL prevent any new typing indicator from appearing and allow the existing one to fade naturally via the 5-second timeout.
5. THE Messaging_System frontend SHALL automatically hide the typing indicator after 5 seconds if no follow-up `typing_indicator` event is received; IF a typing event was delayed or missed and arrives late, THE Messaging_System frontend SHALL display the indicator for any typing event received within the last 5 seconds.
6. THE Messaging_System SHALL NOT persist typing events to the database; typing state SHALL be transient and transmitted only via SSE.
