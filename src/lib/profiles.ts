import type { Preferences } from '../types'
import { readLocal, writeLocal } from './storage'
import { defaults } from './defaults'

export const profileFields = ['wpm', 'mode', 'chunkSize', 'fontFamily', 'fontSize', 'fontWeight', 'theme', 'punctuation', 'commaPause', 'sentencePause', 'paragraphPause', 'paceMode', 'adaptiveLength', 'adaptiveBoundaries', 'audioProfile', 'audioVolume', 'audioMuted', 'audioPauseWithReading'] as const
export type ProfileSettings = Pick<Preferences, typeof profileFields[number]>
export interface ReadingProfile { id: string; name: string; settings: ProfileSettings; createdAt: number }

export function captureProfile(settings: Preferences): ProfileSettings {
  return Object.fromEntries(profileFields.map(key => [key, settings[key]])) as unknown as ProfileSettings
}
export function isReadingProfile(value: unknown): value is ReadingProfile {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  if (typeof item.id !== 'string' || !item.id || typeof item.name !== 'string' || !item.name.trim() || item.name.length > 80 || typeof item.createdAt !== 'number' || !Number.isFinite(item.createdAt) || !item.settings || typeof item.settings !== 'object') return false
  const s = item.settings as Record<string, unknown>
  const within = (key: string, min: number, max: number) => typeof s[key] === 'number' && Number.isFinite(s[key]) && Number(s[key]) >= min && Number(s[key]) <= max
  return profileFields.every(key => typeof s[key] === typeof defaults[key] && (typeof s[key] !== 'number' || Number.isFinite(s[key]))) && within('wpm', 100, 1500) && within('chunkSize', 2, 5) && within('fontSize', 40, 120) && within('fontWeight', 400, 700) && within('commaPause', 0, 800) && within('sentencePause', 0, 1200) && within('paragraphPause', 0, 1600) && within('audioVolume', 0, 100) && ['rsvp', 'chunk', 'traditional'].includes(String(s.mode)) && ['dark', 'light', 'system'].includes(String(s.theme)) && ['fixed', 'ramp', 'adaptive'].includes(String(s.paceMode)) && ['silence', 'white', 'pink', 'brown', 'rain'].includes(String(s.audioProfile))
}
export function readProfiles(): ReadingProfile[] { const stored = readLocal<unknown>('profiles', []); return Array.isArray(stored) ? stored.filter(isReadingProfile) : [] }
export function saveProfiles(profiles: ReadingProfile[]) { return writeLocal('profiles', profiles) }
export function exportProfiles(profiles: ReadingProfile[]) { return JSON.stringify({ format: 'focusread-profiles', version: 1, profiles }, null, 2) }
export function importProfiles(source: string): ReadingProfile[] {
  let data: unknown
  try { data = JSON.parse(source) } catch { throw new Error('Invalid profile backup JSON.') }
  if (!data || typeof data !== 'object') throw new Error('Not a FocusRead profile backup.')
  const backup = data as Record<string, unknown>
  if (backup.format !== 'focusread-profiles' || backup.version !== 1 || !Array.isArray(backup.profiles) || !backup.profiles.every(isReadingProfile)) throw new Error('Unsupported profile backup.')
  return backup.profiles
}
