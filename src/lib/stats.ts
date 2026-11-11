import type { ReadingRecord } from '../types'
import type { PlaybackState } from './playbackEngine'

export const MIN_WORDS = 5
export const MIN_MS = 2000

/** Counts only sequential advances while playing, so seeking never inflates words read. */
export class ReadingTracker {
  private words = 0
  private ms = 0
  private prev: PlaybackState | null = null
  private prevAt = 0
  private startedAt = 0
  private completed = false
  constructor(private now: () => number = () => performance.now(), private wall: () => number = () => Date.now()) {}
  feed(state: PlaybackState, step: number, totalWords = 0) {
    const at = this.now()
    if (this.prev?.playing) {
      this.ms += at - this.prevAt
      const delta = state.index - this.prev.index
      if (delta > 0 && delta <= step) this.words += delta
      if (state.complete && totalWords > 0) this.words += Math.min(step, totalWords - state.index)
    }
    if (state.playing && !this.prev?.playing && !this.startedAt) this.startedAt = this.wall()
    if (state.complete) this.completed = true
    this.prev = state; this.prevAt = at
  }
  /** Returns the accumulated reading if it is substantial enough to keep, then resets. */
  take(documentId: string, title: string): ReadingRecord | null {
    const words = this.words, activeMs = Math.round(this.ms), startedAt = this.startedAt || this.wall()
    const completed = this.completed
    this.words = 0; this.ms = 0; this.startedAt = 0; this.completed = false
    if (words < MIN_WORDS || activeMs < MIN_MS) return null
    return { id: `${startedAt}-${Math.random().toString(36).slice(2, 8)}`, documentId, title, day: dayKey(startedAt), startedAt, words, activeMs, completed }
  }
}

export const dayKey = (time: number) => {
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const shiftDay = (time: number, days: number) => { const d = new Date(time); d.setDate(d.getDate() + days); return d.getTime() }

export interface StatsSummary {
  totalWords: number; totalMs: number; averageWpm: number; sessions: number
  todayWords: number; goalProgress: number; streak: number; week: { day: string; words: number }[]; currentWeekWords: number; weeklyGoalProgress: number
}
export function summarize(records: ReadingRecord[], goal: number, now = Date.now(), weeklyGoal = 5000): StatsSummary {
  const byDay = new Map<string, number>()
  let totalWords = 0, totalMs = 0
  for (const r of records) { totalWords += r.words; totalMs += r.activeMs; const currentLocalDay = dayKey(r.startedAt); byDay.set(currentLocalDay, (byDay.get(currentLocalDay) ?? 0) + r.words) }
  const target = Math.max(1, goal)
  const metGoal = (offset: number) => (byDay.get(dayKey(shiftDay(now, offset))) ?? 0) >= target
  // A streak stays alive through today until the day ends.
  let streak = 0
  for (let offset = metGoal(0) ? 0 : -1; metGoal(offset); offset--) streak++
  const todayWords = byDay.get(dayKey(now)) ?? 0
  const weekStart = new Date(now); weekStart.setHours(0, 0, 0, 0); weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7))
  let currentWeekWords = 0
  for (let day = new Date(weekStart); day.getTime() <= now; day.setDate(day.getDate() + 1)) currentWeekWords += byDay.get(dayKey(day.getTime())) ?? 0
  return {
    totalWords, totalMs, sessions: records.length, todayWords, streak, currentWeekWords, weeklyGoalProgress: Math.min(1, currentWeekWords / Math.max(1, weeklyGoal)),
    averageWpm: totalMs > 0 ? Math.round(totalWords / (totalMs / 60000)) : 0,
    goalProgress: Math.min(1, todayWords / target),
    week: Array.from({ length: 7 }, (_, i) => { const day = dayKey(shiftDay(now, i - 6)); return { day, words: byDay.get(day) ?? 0 } }),
  }
}

export function compareRecentWeeks(records: ReadingRecord[], now = Date.now()) {
  const recentStart = now - 7 * 86400000
  const previousStart = now - 14 * 86400000
  const recent = records.filter(record => record.startedAt >= recentStart && record.startedAt <= now)
  const previous = records.filter(record => record.startedAt >= previousStart && record.startedAt < recentStart)
  const total = (items: ReadingRecord[]) => ({ words: items.reduce((sum, item) => sum + item.words, 0), minutes: Math.round(items.reduce((sum, item) => sum + item.activeMs, 0) / 60000), sessions: items.length, completed: items.filter(item => item.completed === true).length })
  return { recent: total(recent), previous: total(previous) }
}
export function observedWpm(record: ReadingRecord): number | undefined {
  return record.activeMs > 0 && record.words > 0 ? Math.round(record.words / (record.activeMs / 60000)) : undefined
}

export interface HeatCell { day: string; words: number; level: 0 | 1 | 2 | 3 | 4; future: boolean }
/** Monday-first columns ending with the current week. Levels are relative to the daily goal: under a quarter, under half, under the goal, goal met. */
export function heatmapWeeks(records: ReadingRecord[], goal: number, weeks = 26, now = Date.now()): HeatCell[][] {
  const byDay = new Map<string, number>()
  for (const r of records) { const key = dayKey(r.startedAt); byDay.set(key, (byDay.get(key) ?? 0) + r.words) }
  const start = new Date(now); start.setHours(0, 0, 0, 0); start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - (weeks - 1) * 7)
  const target = Math.max(1, goal), today = dayKey(now)
  return Array.from({ length: weeks }, (_, week) => Array.from({ length: 7 }, (_, weekday) => {
    const date = new Date(start); date.setDate(start.getDate() + week * 7 + weekday)
    const day = dayKey(date.getTime()), words = byDay.get(day) ?? 0, ratio = words / target
    return { day, words, future: day > today, level: (words <= 0 ? 0 : ratio < .25 ? 1 : ratio < .5 ? 2 : ratio < 1 ? 3 : 4) as HeatCell['level'] }
  }))
}

export interface DocumentStats { sessions: number; words: number; activeMs: number; wpm: number; completions: number }
/** Reading history grouped by document. Average WPM is total words over total active time, not a mean of session speeds. */
export function documentStats(records: ReadingRecord[]): Map<string, DocumentStats> {
  const stats = new Map<string, DocumentStats>()
  for (const r of records) {
    const item = stats.get(r.documentId) ?? { sessions: 0, words: 0, activeMs: 0, wpm: 0, completions: 0 }
    item.sessions++; item.words += r.words; item.activeMs += r.activeMs; if (r.completed === true) item.completions++
    stats.set(r.documentId, item)
  }
  for (const item of stats.values()) item.wpm = item.activeMs > 0 ? Math.round(item.words / (item.activeMs / 60000)) : 0
  return stats
}
