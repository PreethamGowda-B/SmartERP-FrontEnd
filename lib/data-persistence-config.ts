/**
 * Configuration for data persistence and cloud syncing
 * This file centralizes all sync settings and API endpoints
 */

export const SYNC_CONFIG = {
  // Sync intervals (in milliseconds)
  SYNC_INTERVAL: 5000, // 5 seconds for real-time updates
  INITIAL_SYNC_TIMEOUT: 10000, // 10 seconds for initial sync
  RETRY_INTERVAL: 3000, // 3 seconds between retries

  // API Endpoints
  API_ENDPOINTS: {
    JOBS: "/api/jobs",
    NOTIFICATIONS: "/api/notifications",
    EMPLOYEES: "/api/employees",
    CHAT: "/api/chat",
    AUTH_LOGIN: "/api/auth/login",
    AUTH_SIGNUP: "/api/auth/signup",
    AUTH_LOGOUT: "/api/auth/logout",
    AUTH_REFRESH: "/api/auth/refresh",
  },

  // Local Storage Keys
  STORAGE_KEYS: {
    USER: "smarterp_user",
    USER_ID: "smarterp_user_id",
    JOBS: "smarterp-jobs",
    NOTIFICATIONS: "smarterp-notifications",
    EMPLOYEES: "smarterp-employees",
    CHAT_MESSAGES: "smarterp-chat-messages",
  },

  // Sync behavior
  SYNC_BEHAVIOR: {
    // Enable offline-first mode (use local data if backend unavailable)
    OFFLINE_FIRST: true,
    // Enable cross-tab sync (sync data across browser tabs)
    CROSS_TAB_SYNC: true,
    // Enable automatic retry on sync failure
    AUTO_RETRY: true,
    // Maximum retry attempts
    MAX_RETRIES: 3,
  },

  // Data normalization
  FIELD_MAPPINGS: {
    jobs: {
      id: ["id", "_db_row.id"],
      title: ["title", "name", "jobTitle"],
      description: ["description", "details"],
      assignedEmployees: ["assignedEmployees", "assigned_to", "assignedTo"],
    },
    employees: {
      id: ["id", "_db_row.id"],
      name: ["name", "fullName"],
      position: ["position", "role"],
      email: ["email"],
      phone: ["phone"],
      status: ["status"],
    },
    notifications: {
      id: ["id"],
      type: ["type"],
      title: ["title"],
      message: ["message"],
      time: ["time", "createdAt"],
      read: ["read"],
      priority: ["priority"],
    },
    chat: {
      id: ["id", "_db_row.id"],
      sender: ["sender", "senderName"],
      senderId: ["senderId", "sender_id"],
      message: ["message", "content", "text"],
      time: ["time", "createdAt"],
      unread: ["unread"],
    },
  },
}

/**
 * Get the base API URL
 */
export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
}

/**
 * Get full API endpoint URL
 */
export function getApiEndpoint(endpoint: keyof typeof SYNC_CONFIG.API_ENDPOINTS): string {
  return `${getApiBaseUrl()}${SYNC_CONFIG.API_ENDPOINTS[endpoint]}`
}
