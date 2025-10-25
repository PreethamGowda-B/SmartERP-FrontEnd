# SmartERP Cloud Data Sync Implementation Guide

## Overview

This document describes the complete implementation of cloud data syncing and user account persistence for SmartERP. The system ensures that all user data (jobs, employees, notifications, chat messages) is automatically synced across devices using secure JWT authentication with httpOnly cookies.

## Architecture

### Core Components

1. **Authentication Layer** (`lib/auth.ts`)
   - JWT-based authentication with httpOnly cookies
   - Secure token refresh mechanism
   - User session management

2. **Data Sync Service** (`lib/data-sync-service.ts`)
   - Singleton service managing all data synchronization
   - Real-time sync with configurable intervals
   - Fallback to local storage for offline support
   - Cross-device synchronization

3. **API Client** (`lib/apiClient.ts`)
   - Centralized HTTP client with automatic retry logic
   - Credential inclusion for cookie-based auth
   - Token refresh on 401 responses

4. **Data Contexts**
   - `AuthContext`: User authentication and session management
   - `JobContext`: Job data persistence and syncing
   - `NotificationContext`: Notification management
   - `EmployeeContext`: Employee data persistence
   - `ChatContext`: Chat message persistence

5. **UI Components**
   - `SyncStatusIndicator`: Real-time sync status display
   - `WorkspaceLoadingSkeleton`: Loading state UI
   - `SyncOverlay`: Full-screen sync indicator

## Data Flow

### Login Flow

\`\`\`
User Login
    ↓
signIn() → Backend API (/api/auth/login)
    ↓
JWT Token + httpOnly Cookie Set
    ↓
User stored in localStorage
    ↓
AuthContext triggers dataSyncService.syncAllData()
    ↓
All data synced from backend:
  - Jobs (/api/jobs)
  - Notifications (/api/notifications)
  - Employees (/api/employees)
  - Chat (/api/chat)
    ↓
Continuous sync started (5-second intervals)
    ↓
User redirected to dashboard
\`\`\`

### Multi-Device Sync

\`\`\`
Device A: User updates job
    ↓
Job saved locally + sent to backend
    ↓
Backend stores update
    ↓
Device B: Continuous sync fetches updated job
    ↓
Job updated in local storage
    ↓
UI reflects changes automatically
\`\`\`

### Offline Support

\`\`\`
Backend unavailable
    ↓
API call fails
    ↓
Local storage data used
    ↓
Changes queued locally
    ↓
Backend comes online
    ↓
Queued changes synced
\`\`\`

## Configuration

All sync settings are centralized in `lib/data-persistence-config.ts`:

\`\`\`typescript
SYNC_CONFIG = {
  SYNC_INTERVAL: 5000,           // 5 seconds
  INITIAL_SYNC_TIMEOUT: 10000,   // 10 seconds
  RETRY_INTERVAL: 3000,          // 3 seconds
  OFFLINE_FIRST: true,           // Use local data if backend unavailable
  CROSS_TAB_SYNC: true,          // Sync across browser tabs
  AUTO_RETRY: true,              // Automatic retry on failure
  MAX_RETRIES: 3,                // Maximum retry attempts
}
\`\`\`

## API Endpoints Required

The backend must implement these endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Token refresh

### Data Endpoints
- `GET /api/jobs` - Fetch all jobs for user
- `POST /api/jobs` - Create new job
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job

- `GET /api/employees` - Fetch all employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

- `GET /api/notifications` - Fetch notifications
- `PUT /api/notifications/:id/read` - Mark as read

- `GET /api/chat` - Fetch chat messages
- `POST /api/chat` - Send message
- `PUT /api/chat/:id/read` - Mark message as read

## Security Features

1. **JWT Authentication**
   - Tokens stored in httpOnly cookies (not accessible to JavaScript)
   - Automatic token refresh on 401 responses
   - Secure credential transmission

2. **Data Validation**
   - Field normalization to handle various backend formats
   - Type checking and validation
   - Error handling and fallbacks

3. **User Isolation**
   - Data linked to user ID from authentication
   - User-specific data filtering
   - Secure logout clears all user data

4. **Cross-Tab Sync**
   - Storage events trigger data updates across tabs
   - Consistent state across browser windows
   - Real-time synchronization

## Usage Examples

### Using Synced Data in Components

\`\`\`tsx
import { useJobs } from "@/contexts/job-context"
import { useEmployees } from "@/contexts/employee-context"

export function MyComponent() {
  const { jobs, isLoading } = useJobs()
  const { employees } = useEmployees()

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      <h1>Jobs: {jobs.length}</h1>
      <h1>Employees: {employees.length}</h1>
    </div>
  )
}
\`\`\`

### Checking Sync Status

\`\`\`tsx
import { useIsSyncing, useSyncStatus } from "@/lib/sync-hooks"

export function SyncIndicator() {
  const isSyncing = useIsSyncing()
  const status = useSyncStatus()

  return (
    <div>
      {isSyncing && <p>Syncing...</p>}
      {status.jobs && <p>Syncing jobs...</p>}
      {status.employees && <p>Syncing employees...</p>}
    </div>
  )
}
\`\`\`

### Adding Data

\`\`\`tsx
import { useJobs } from "@/contexts/job-context"

export function CreateJobForm() {
  const { addJob } = useJobs()

  const handleSubmit = async (jobData) => {
    await addJob(jobData)
    // Data automatically synced to backend
  }

  return <form onSubmit={handleSubmit}>...</form>
}
\`\`\`

## Troubleshooting

### Data Not Syncing

1. Check browser console for errors
2. Verify backend API is running
3. Check network tab for failed requests
4. Verify user is authenticated (check localStorage for `smarterp_user`)

### Stale Data

1. Manual refresh: Clear localStorage and reload
2. Force sync: Call `dataSyncService.syncAllData()`
3. Check sync interval in `SYNC_CONFIG`

### Cross-Device Sync Not Working

1. Ensure same user logged in on both devices
2. Check network connectivity
3. Verify backend is storing data correctly
4. Check sync interval timing

## Performance Optimization

1. **Sync Interval**: Adjust `SYNC_INTERVAL` based on needs
   - Faster sync = more network requests
   - Slower sync = potential stale data

2. **Data Filtering**: Only sync necessary data
   - Use user ID to filter data
   - Implement pagination for large datasets

3. **Caching**: Leverage browser caching
   - Set appropriate cache headers
   - Use ETags for conditional requests

4. **Compression**: Enable gzip compression
   - Reduces network payload
   - Faster sync times

## Future Enhancements

1. **WebSocket Support**: Real-time updates via WebSocket
2. **Conflict Resolution**: Handle concurrent edits
3. **Data Encryption**: End-to-end encryption for sensitive data
4. **Offline Queue**: Queue changes while offline
5. **Sync Analytics**: Track sync performance metrics
