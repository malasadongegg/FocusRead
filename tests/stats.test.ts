import { beforeEach, describe, expect, it } from 'vitest'
import { PlaybackEngine, type PlaybackState } from '../src/lib/playbackEngine'
import { closeLibrary, clearReadings, listReadings, putReadings } from '../src/lib/library'
import { createLibraryBackup, parseBackupReadings, parseLibraryBackup } from '../src/lib/libraryBackup'
import { ReadingTracker, dayKey, summarize } from '../src/lib/stats'
import { tokenize } from '../src/lib/tokenizer'
import { defaults } from '../src/lib/defaults'
import type { ReadingRecord } from '../src/types'

const rec = (day: string, words: number, activeMs = 60000, id = day + words): ReadingRecord => ({ id, documentId: 'd', title: 'T', day, startedAt: Date.parse(day + 'T12:00:00'), words, activeMs })
const st = (index: number, playing: boolean): PlaybackState => ({ index, playing, complete: false, elapsedMs: 0 })

describe('ReadingTracker', () => {
  it('counts sequential advances and ignores seeks', () => {
    let t = 0
    const tracker = new ReadingTracker(() => t, () => Date.parse('2026-10-26T10:00:00'))
    tracker.feed(st(0, true), 1)
    for (let i = 1; i <= 10; i++) { t += 200; tracker.feed(st(i, true), 1) }
    t += 200; tracker.feed(st(500, true), 1) // seek forward
    t += 200; tracker.feed(st(500, false), 1)
    const record = tracker.take('d', 'Doc')
    expect(record).toMatchObject({ words: 10, day: '2026-10-26', documentId: 'd' })
    expect(record!.activeMs).toBe(2400)
    expect(tracker.take('d', 'Doc')).toBeNull()
  })
  it('counts chunk steps as words and discards trivial sessions', () => {
    let t = 0
    const tracker = new ReadingTracker(() => t)
    tracker.feed(st(0, true), 3)
    for (let i = 1; i <= 4; i++) { t += 700; tracker.feed(st(i * 3, true), 3) }
    tracker.feed(st(12, false), 3)
    expect(tracker.take('d', 'x')!.words).toBe(12)
    tracker.feed(st(0, true), 1); t += 300; tracker.feed(st(1, false), 1)
    expect(tracker.take('d', 'x')).toBeNull()
  })
})

describe('summarize', () => {
  const now = new Date('2026-10-26T15:00:00').getTime()
  it('computes totals, average WPM, goal and 7-day window', () => {
    const s = summarize([rec('2026-10-26', 600, 120000), rec('2026-10-25', 400, 80000, 'b')], 1000, now)
    expect(s).toMatchObject({ totalWords: 1000, averageWpm: 300, todayWords: 600, goalProgress: 0.6, sessions: 2 })
    expect(s.week).toHaveLength(7)
    expect(s.week[6]).toEqual({ day: '2026-10-26', words: 600 })
  })
  it('streak counts consecutive goal days and survives an unfinished today', () => {
    const days = ['2026-10-25', '2026-10-24', '2026-10-23'].map(d => rec(d, 1000))
    expect(summarize(days, 1000, now).streak).toBe(3)
    expect(summarize([...days, rec('2026-10-26', 1000)], 1000, now).streak).toBe(4)
    expect(summarize([rec('2026-10-24', 1000), rec('2026-10-23', 1000)], 1000, now).streak).toBe(0)
    expect(summarize([], 1000, now)).toMatchObject({ streak: 0, averageWpm: 0 })
  })
  it('dayKey uses the local calendar day', () => { expect(dayKey(new Date(2026, 0, 5, 23, 59).getTime())).toBe('2026-01-05') })
})

describe('reading history persistence and backup', () => {
  beforeEach(async () => {
    await closeLibrary()
    await new Promise<void>((resolve, reject) => { const q = indexedDB.deleteDatabase('focusread-library'); q.onsuccess = () => resolve(); q.onerror = () => reject(q.error) })
  })
  it('stores and clears readings', async () => {
    await putReadings([rec('2026-10-26', 100)])
    expect(await listReadings()).toHaveLength(1)
    await clearReadings()
    expect(await listReadings()).toEqual([])
  })
  it('round-trips readings through the backup and stays compatible with older backups', () => {
    const source = createLibraryBackup([], [rec('2026-10-26', 100), { bad: true } as unknown as ReadingRecord])
    expect(parseBackupReadings(source)).toHaveLength(1)
    expect(parseLibraryBackup(source)).toEqual([])
    expect(parseBackupReadings(JSON.stringify({ format: 'focusread-library', version: 1, documents: [] }))).toEqual([])
    expect(parseBackupReadings('{nope')).toEqual([])
  })
})

describe('PlaybackEngine timing', () => {
  it('stays on the fixed timeline across mid-playback WPM changes and late callbacks', () => {
    let now = 0
    type Job = { at: number; fn: () => void }
    let job: Job | null = null
    const clock = { now: () => now, set: (fn: () => void, d: number) => { job = { at: now + d, fn }; return 1 as unknown as ReturnType<typeof setTimeout> }, clear: () => { job = null } }
    let last: PlaybackState = st(0, false)
    const engine = new PlaybackEngine({ ...defaults, wpm: 600 }, s => { last = s }, clock)
    engine.load(tokenize(Array.from({ length: 200 }, (_, i) => 'w' + i).join(' ')))
    engine.play()
    const run = (until: number, jitter = 0) => { while (job && (job as Job).at <= until) { const j = job as Job; job = null; now = j.at + jitter; j.fn() } now = until }
    run(1000, 7) // 600 WPM = 100 ms/word, callbacks 7 ms late
    expect(last.index).toBe(10)
    engine.update({ ...defaults, wpm: 300 })
    run(1000 + 2000) // 200 ms/word => ~10 more
    expect(last.index).toBeGreaterThanOrEqual(19); expect(last.index).toBeLessThanOrEqual(21)
    engine.destroy()
    expect(job).toBeNull()
  })
})
