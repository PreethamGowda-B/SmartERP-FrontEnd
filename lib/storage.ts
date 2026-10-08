/**
 * Resilient In-Memory & Web Storage Adapter for SmartERP
 *
 * Prevents DOMException / SecurityError crashes in:
 * - Incognito / Private Browsing modes
 * - Strict third-party cookie blocking
 * - Embedded WebViews (Android / iOS)
 * - Storage Quota Exceeded conditions
 * - Server-side rendering (SSR) environments
 */

type MemoryStore = Map<string, string>;

const memoryLocalStorage: MemoryStore = new Map();
const memorySessionStorage: MemoryStore = new Map();

function isStorageAvailable(type: "localStorage" | "sessionStorage"): boolean {
  if (typeof window === "undefined") return false;
  try {
    const storage = window[type];
    if (!storage) return false;
    const testKey = `__storage_test_${Math.random()}`;
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

const canUseLocalStorage = typeof window !== "undefined" && isStorageAvailable("localStorage");
const canUseSessionStorage = typeof window !== "undefined" && isStorageAvailable("sessionStorage");

export const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      if (canUseLocalStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {}
    return memoryLocalStorage.get(key) ?? null;
  },

  setItem(key: string, value: string): void {
    try {
      if (canUseLocalStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {}
    memoryLocalStorage.set(key, value);
  },

  removeItem(key: string): void {
    try {
      if (canUseLocalStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {}
    memoryLocalStorage.delete(key);
  },

  getJSON<T = unknown>(key: string, fallback: T | null = null): T | null {
    const raw = this.getItem(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  setJSON<T = unknown>(key: string, value: T): void {
    try {
      this.setItem(key, JSON.stringify(value));
    } catch {}
  },
};

export const safeSessionStorage = {
  getItem(key: string): string | null {
    try {
      if (canUseSessionStorage) {
        return window.sessionStorage.getItem(key);
      }
    } catch {}
    return memorySessionStorage.get(key) ?? null;
  },

  setItem(key: string, value: string): void {
    try {
      if (canUseSessionStorage) {
        window.sessionStorage.setItem(key, value);
      }
    } catch {}
    memorySessionStorage.set(key, value);
  },

  removeItem(key: string): void {
    try {
      if (canUseSessionStorage) {
        window.sessionStorage.removeItem(key);
      }
    } catch {}
    memorySessionStorage.delete(key);
  },

  getJSON<T = unknown>(key: string, fallback: T | null = null): T | null {
    const raw = this.getItem(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  setJSON<T = unknown>(key: string, value: T): void {
    try {
      this.setItem(key, JSON.stringify(value));
    } catch {}
  },
};
