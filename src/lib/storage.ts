import type { Preferences, Session } from '../types'
const prefix = 'focusread.v1.'
export function readLocal<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(prefix + key); return raw ? JSON.parse(raw) as T : fallback } catch { return fallback }
}
export function writeLocal(key: string, value: unknown) {
  try { localStorage.setItem(prefix + key, JSON.stringify(value)); return true } catch { return false }
}
export const readSession = () => readLocal<Session | null>('session', null)
export const readPreferences = (defaults: Preferences) => ({ ...defaults, ...readLocal<Partial<Preferences>>('preferences', {}) })
