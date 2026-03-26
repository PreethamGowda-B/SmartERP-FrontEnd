import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'SmartERP_Offline';
const STORE_NAME = 'attendance_sync';

export interface PendingAttendance {
  id?: number;
  type: 'clock-in' | 'clock-out';
  timestamp: string;
  status: 'pending' | 'syncing' | 'failed';
}

export async function initDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

export async function savePendingAttendance(action: PendingAttendance) {
  const db = await initDB();
  return db.add(STORE_NAME, action);
}

export async function getPendingAttendance(): Promise<PendingAttendance[]> {
  const db = await initDB();
  return db.getAll(STORE_NAME);
}

export async function deletePendingAttendance(id: number) {
  const db = await initDB();
  return db.delete(STORE_NAME, id);
}

export async function clearAllPending() {
  const db = await initDB();
  return db.clear(STORE_NAME);
}
