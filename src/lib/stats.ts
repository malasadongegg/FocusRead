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
  constructor(private now: () => number = () => performance.now(), private wall: () => number = () => Date.now()) {}
  feed(state: PlaybackState, step: number) {
    const at = this.now()
    if (this.prev?.playing) {
      this.ms += at - this.prevAt
      const delta = state.index - this.prev.index
      if (delta > 0 && delta <= step) this.words += delta
    }
    if (state.playing && !this.prev?.playing && !this.startedAt) this.startedAt = this.wall()
    this.prev = state; this.prevAt = at
  }
  /** Returns the accumulated reading if it is substantial enough to keep, then resets. */
  take(documentId: string, title: string): ReadingRecord | null {
    const words = this.words, activeMs = Math.round(this.ms), startedAt = this.startedAt || this.wall()
    this.words = 0; this.ms = 0; this.startedAt = 0
    if (words < MIN_WORDS || activeMs < MIN_MS) return null
    return { id: `${startedAt}-${Math.random().toString(36).slice(2, 8)}`, documentId, title, day: dayKey(startedAt), startedAt, words, activeMs }
  }
}

export const dayKey = (time: number) => {
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const shiftDay = (time: number, days: number) => { const d = new Date(time); d.setDate(d.getDate() + days); return d.getTime() }

export interface StatsSummary {
  totalWords: number; totalMs: number; averageWpm: number; sessions: number
  todayWords: number; goalProgress: number; streak: number; week: { day: string; words: number }[]
}
export function summarize(records: ReadingRecord[], goal: number, now = Date.now()): StatsSummary {
  const byDay = new Map<string, number>()
  let totalWords = 0, totalMs = 0
  for (const r of records) { totalWords += r.words; totalMs += r.activeMs; byDay.set(r.day, (byDay.get(r.day) ?? 0) + r.words) }
  const target = Math.max(1, goal)
  const metGoal = (offset: number) => (byDay.get(dayKey(shiftDay(now, offset))) ?? 0) >= target
  // A streak stays alive through today until the day ends.
  let streak = 0
  for (let offset = metGoal(0) ? 0 : -1; metGoal(offset); offset--) streak++
  const todayWords = byDay.get(dayKey(now)) ?? 0
  return {
    totalWords, totalMs, sessions: records.length, todayWords, streak,
    averageWpm: totalMs > 0 ? Math.round(totalWords / (totalMs / 60000)) : 0,
    goalProgress: Math.min(1, todayWords / target),
    week: Array.from({ length: 7 }, (_, i) => { const day = dayKey(shiftDay(now, i - 6)); return { day, words: byDay.get(day) ?? 0 } }),
  }
}
