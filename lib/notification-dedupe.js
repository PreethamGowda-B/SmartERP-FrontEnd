/** Stable identity helpers for notification list and live-event reconciliation. */
function notificationIdentity(notification) {
  if (notification?.id === undefined || notification?.id === null || notification.id === '') return null;
  return String(notification.id);
}

function mergeNotificationsById(primary, secondary = []) {
  const result = [];
  const seen = new Set();
  for (const item of [...(Array.isArray(primary) ? primary : []), ...(Array.isArray(secondary) ? secondary : [])]) {
    const id = notificationIdentity(item);
    if (id !== null && seen.has(id)) continue;
    if (id !== null) seen.add(id);
    result.push(item);
  }
  return result.sort((a, b) => new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime());
}

module.exports = { notificationIdentity, mergeNotificationsById };
