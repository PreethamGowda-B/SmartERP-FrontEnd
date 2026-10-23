/**
 * Browser connectivity state is only a hint. An offline classification is
 * appropriate only after fetch itself failed with a network TypeError.
 */
export function isOfflineFetchFailure(error, deviceReportsOffline) {
  return deviceReportsOffline === true && error?.name === 'TypeError';
}
