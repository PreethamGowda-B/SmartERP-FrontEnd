export interface IdentifiableNotification {
  id?: string | number | null
  created_at?: string | Date | null
  [key: string]: any
}

export function notificationIdentity(notification: IdentifiableNotification | null | undefined): string | null
export function mergeNotificationsById<T extends { id?: string | number | null; created_at?: string | Date | null }>(primary: T[], secondary?: T[]): T[]

