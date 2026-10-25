import type { Preferences, Token } from '../types'
import { tokenDuration } from './readingTime'

export interface PlaybackState { index: number; playing: boolean; complete: boolean; elapsedMs: number }
type Listener = (state: PlaybackState) => void
type Clock = { now: () => number; set: (fn: () => void, delay: number) => ReturnType<typeof setTimeout>; clear: (id: ReturnType<typeof setTimeout>) => void }
const browserClock: Clock = { now: () => performance.now(), set: (fn, delay) => setTimeout(fn, delay), clear: id => clearTimeout(id) }

/** A single deadline and a single pending timeout. Late callbacks use the deadline,
 * never a chain of interval delays. Hidden tabs pause via the owning hook. */
export class PlaybackEngine {
  private tokens: Token[] = []
  private settings: Preferences
  private listener: Listener
  private clock: Clock
  private timer: ReturnType<typeof setTimeout> | null = null
  private deadline = 0
  private remaining = 0
  private startedAt = 0
  private state: PlaybackState = { index: 0, playing: false, complete: false, elapsedMs: 0 }
  constructor(settings: Preferences, listener: Listener, clock: Clock = browserClock) {
    this.settings = settings; this.listener = listener; this.clock = clock
  }
  snapshot() { return { ...this.state, elapsedMs: this.elapsed() } }
  private durationAt(index: number) {
    const size = this.settings.mode === 'chunk' ? this.settings.chunkSize : 1
    let duration = 0
    for (let i = index; i < Math.min(this.tokens.length, index + size); i++) duration += tokenDuration(this.tokens, i, this.settings)
    return duration
  }
  private stepSize() { return this.settings.mode === 'chunk' ? this.settings.chunkSize : 1 }
  private emit() { this.listener(this.snapshot()) }
  private clearTimer() { if (this.timer !== null) this.clock.clear(this.timer); this.timer = null }
  private schedule() {
    this.clearTimer()
    if (!this.state.playing) return
    this.timer = this.clock.set(() => {
      this.timer = null
      if (!this.state.playing) return
      const now = this.clock.now()
      if (now < this.deadline - 1) { this.schedule(); return }
      // Catch up against the fixed timeline, with a guard for throttled callbacks.
      let next = this.state.index
      let deadline = this.deadline
      let steps = 0
      do {
        next += this.stepSize()
        if (next >= this.tokens.length) {
          this.state = { ...this.state, index: Math.max(0, this.tokens.length - 1), playing: false, complete: true, elapsedMs: this.elapsed() }
          this.clearTimer(); this.emit(); return
        }
        deadline += this.durationAt(next)
        steps++
      } while (deadline <= now && steps < 100)
      this.state.index = next
      this.deadline = steps === 100 ? now + this.durationAt(next) : deadline
      this.emit(); this.schedule()
    }, Math.max(1, this.deadline - this.clock.now()))
  }
  elapsed() { return this.state.elapsedMs + (this.state.playing ? this.clock.now() - this.startedAt : 0) }
  load(tokens: Token[], index = 0, elapsedMs = 0) {
    this.pause(); this.tokens = tokens; this.state = { index: Math.min(Math.max(0, index), Math.max(0, tokens.length - 1)), playing: false, complete: false, elapsedMs }
    this.remaining = this.durationAt(this.state.index); this.emit()
  }
  play() {
    if (this.state.playing || !this.tokens.length) return
    if (this.state.complete) { this.state.index = 0; this.state.complete = false; this.remaining = this.durationAt(0) }
    this.state.playing = true; this.startedAt = this.clock.now()
    this.deadline = this.startedAt + (this.remaining || this.durationAt(this.state.index))
    this.emit(); this.schedule()
  }
  pause() {
    if (!this.state.playing) return
    this.remaining = Math.max(0, this.deadline - this.clock.now())
    this.state.elapsedMs = this.elapsed(); this.state.playing = false
    this.clearTimer(); this.emit()
  }
  seek(index: number) {
    if (!this.tokens.length) return
    this.state.index = Math.min(Math.max(0, Math.floor(index)), this.tokens.length - 1)
    this.state.complete = false; this.remaining = this.durationAt(this.state.index)
    if (this.state.playing) { this.deadline = this.clock.now() + this.remaining; this.schedule() }
    this.emit()
  }
  skip(direction: number) { this.seek(this.state.index + direction * this.stepSize()) }
  restart() { this.seek(0); this.state.elapsedMs = 0; this.startedAt = this.clock.now(); this.emit() }
  update(settings: Preferences) {
    const oldDuration = this.durationAt(this.state.index)
    const fraction = this.state.playing ? Math.max(0, this.deadline - this.clock.now()) / Math.max(1, oldDuration) : this.remaining / Math.max(1, oldDuration)
    this.settings = settings
    this.remaining = Math.max(1, this.durationAt(this.state.index) * fraction)
    if (this.state.playing) { this.deadline = this.clock.now() + this.remaining; this.schedule() }
    this.emit()
  }
  destroy() { this.pause(); this.clearTimer() }
}
