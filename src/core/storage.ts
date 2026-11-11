/**
 * Key-value storage adapter.
 * Prototype uses the webview's localStorage (works inside Tauri).
 * Swap this implementation for tauri-plugin-store / SQLite later without
 * touching any module that calls it.
 */
const PREFIX = "mealplanner:";

export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* storage unavailable — prototype keeps working in memory */
    }
  },
  remove(key: string): void {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      /* ignore */
    }
  },
};
