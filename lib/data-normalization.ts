/**
 * Utility functions for normalizing data from various backend formats
 */

import { SYNC_CONFIG } from "./data-persistence-config"

/**
 * Normalize a single field value by checking multiple possible field names
 */
function getNormalizedField(obj: any, fieldNames: string[]): any {
  for (const fieldName of fieldNames) {
    const value = getNestedValue(obj, fieldName)
    if (value !== undefined && value !== null) {
      return value
    }
  }
  return undefined
}

/**
 * Get nested object value using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((current, prop) => current?.[prop], obj)
}

/**
 * Normalize job data from backend
 */
export function normalizeJob(job: any): any {
  const mappings = SYNC_CONFIG.FIELD_MAPPINGS.jobs

  return {
    id: getNormalizedField(job, mappings.id) ?? String(job.id ?? ""),
    title: getNormalizedField(job, mappings.title) ?? "",
    description: getNormalizedField(job, mappings.description) ?? "",
    assignedEmployees: Array.isArray(getNormalizedField(job, mappings.assignedEmployees))
      ? getNormalizedField(job, mappings.assignedEmployees).map((a: any) => String(a))
      : [],
    ...job,
  }
}

/**
 * Normalize employee data from backend
 */
export function normalizeEmployee(employee: any): any {
  const mappings = SYNC_CONFIG.FIELD_MAPPINGS.employees

  return {
    id: getNormalizedField(employee, mappings.id) ?? String(employee.id ?? ""),
    name: getNormalizedField(employee, mappings.name) ?? "",
    position: getNormalizedField(employee, mappings.position) ?? "",
    email: getNormalizedField(employee, mappings.email) ?? "",
    phone: getNormalizedField(employee, mappings.phone) ?? "",
    status: getNormalizedField(employee, mappings.status) ?? "active",
    ...employee,
  }
}

/**
 * Normalize notification data from backend
 */
export function normalizeNotification(notification: any): any {
  const mappings = SYNC_CONFIG.FIELD_MAPPINGS.notifications

  return {
    id: getNormalizedField(notification, mappings.id) ?? String(notification.id ?? ""),
    type: getNormalizedField(notification, mappings.type) ?? "info",
    title: getNormalizedField(notification, mappings.title) ?? "",
    message: getNormalizedField(notification, mappings.message) ?? "",
    time: getNormalizedField(notification, mappings.time) ?? new Date().toISOString(),
    read: getNormalizedField(notification, mappings.read) ?? false,
    priority: getNormalizedField(notification, mappings.priority) ?? "medium",
    ...notification,
  }
}

/**
 * Normalize chat message data from backend
 */
export function normalizeChatMessage(message: any): any {
  const mappings = SYNC_CONFIG.FIELD_MAPPINGS.chat

  return {
    id: getNormalizedField(message, mappings.id) ?? String(message.id ?? ""),
    sender: getNormalizedField(message, mappings.sender) ?? "",
    senderId: getNormalizedField(message, mappings.senderId) ?? "",
    message: getNormalizedField(message, mappings.message) ?? "",
    time: getNormalizedField(message, mappings.time) ?? new Date().toISOString(),
    unread: getNormalizedField(message, mappings.unread) ?? false,
    ...message,
  }
}
