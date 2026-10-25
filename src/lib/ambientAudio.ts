import type { AudioProfile } from '../types'

export interface AmbientSettings {
  profile: AudioProfile
  volume: number
  muted: boolean
  pauseWithReading: boolean
  timerMinutes: number
}

type Voice = { source: AudioBufferSourceNode; gain: GainNode; profile: AudioProfile }
const FADE_SECONDS = 0.22
const IDLE_DELAY_MS = 280

/** Creates finite seamless stereo channels without fetching any audio. */
export function synthesizeChannels(profile: Exclude<AudioProfile, 'silence'>, sampleRate: number): [Float32Array, Float32Array] {
  const seconds = profile === 'rain' ? 6 : 4
  const length = Math.round(sampleRate * seconds)
  const channels: [Float32Array, Float32Array] = [new Float32Array(length), new Float32Array(length)]
  for (let channel = 0; channel < 2; channel++) {
    const samples = channels[channel]
    let seed = 0x9e3779b9 ^ (channel + 1) * 0x85ebca6b ^ profile.length * 65537
    const random = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 0x100000000 }
    let pink0 = 0, pink1 = 0, pink2 = 0, pink3 = 0, pink4 = 0, pink5 = 0
    let brown = 0, rainHiss = 0, drop = 0, dropPhase = 0
    for (let i = 0; i < length; i++) {
      const white = random() * 2 - 1
      let sample: number
      if (profile === 'white') sample = white * .28
      else if (profile === 'pink') {
        pink0 = .99886 * pink0 + white * .0555179
        pink1 = .99332 * pink1 + white * .0750759
        pink2 = .969 * pink2 + white * .153852
        pink3 = .8665 * pink3 + white * .3104856
        pink4 = .55 * pink4 + white * .5329522
        pink5 = -.7616 * pink5 - white * .016898
        sample = (pink0 + pink1 + pink2 + pink3 + pink4 + pink5 + white * .5362) * .047
      } else if (profile === 'brown') {
        brown = (brown + white * .025) / 1.001
        sample = Math.max(-1, Math.min(1, brown)) * .43
      } else {
        // Rain: a soft broad hiss, low wash, and scattered short droplet taps.
        rainHiss = rainHiss * .83 + white * .17
        brown = (brown + white * .012) / 1.0008
        if (random() < .00032) { drop = .22 + random() * .22; dropPhase = random() * Math.PI * 2 }
        drop *= .9994
        dropPhase += .08
        sample = white * .07 + rainHiss * .2 + brown * .09 + Math.sin(dropPhase) * drop * .18
      }
      samples[i] = sample
    }
    // Blend the tail into the beginning so the looping buffer has no hard seam.
    const seam = Math.min(Math.round(sampleRate * .12), Math.floor(length / 8))
    for (let i = 0; i < seam; i++) {
      const blend = (i + 1) / seam
      samples[length - seam + i] = samples[length - seam + i] * (1 - blend) + samples[seam - 1 - i] * blend
    }
  }
  return channels
}

export function createAmbientBuffer(context: AudioContext, profile: Exclude<AudioProfile, 'silence'>): AudioBuffer {
  const channels = synthesizeChannels(profile, context.sampleRate)
  const buffer = context.createBuffer(2, channels[0].length, context.sampleRate)
  channels.forEach((samples, channel) => buffer.getChannelData(channel).set(samples))
  return buffer
}

/** Audio lifetime is independent of the RSVP timer. No AudioContext exists until
 * activate() is called directly from a user gesture. */
export class AmbientAudioEngine {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private voice: Voice | null = null
  private buffers = new Map<AudioProfile, AudioBuffer>()
  private worker: Worker | null = null
  private workerRequests = new Map<number, { resolve: (channels: [Float32Array, Float32Array]) => void; reject: (reason: Error) => void }>()
  private workerRequestId = 0
  private settings: AmbientSettings = { profile: 'rain', volume: 40, muted: true, pauseWithReading: false, timerMinutes: 0 }
  private readingPlaying = false
  private activated = false
  private generation = 0
  private idleTimer: ReturnType<typeof setTimeout> | null = null
  private offTimer: ReturnType<typeof setTimeout> | null = null
  private timerMinutes = 0
  constructor(private readonly onTimerExpired: () => void, private readonly makeContext: () => AudioContext = () => new AudioContext()) {}

  get isActivated() { return this.activated }
  get hasContext() { return this.context !== null }

  private ensureContext() {
    if (!this.context) {
      const context = this.makeContext()
      const master = context.createGain()
      master.gain.value = 0
      master.connect(context.destination)
      this.context = context
      this.master = master
      this.buffers.clear()
    }
    return this.context
  }

  private async prepareBuffer(context: AudioContext, profile: Exclude<AudioProfile, 'silence'>): Promise<AudioBuffer> {
    const cached = this.buffers.get(profile)
    if (cached) return cached
    if (typeof Worker === 'undefined') {
      const buffer = createAmbientBuffer(context, profile)
      this.buffers.set(profile, buffer)
      return buffer
    }
    if (!this.worker) {
      this.worker = new Worker(new URL('./ambientWorker.ts', import.meta.url), { type: 'module' })
      this.worker.onmessage = (event: MessageEvent<{ id: number; channels: [Float32Array, Float32Array] }>) => {
        const pending = this.workerRequests.get(event.data.id)
        if (!pending) return
        this.workerRequests.delete(event.data.id)
        pending.resolve(event.data.channels)
      }
      this.worker.onerror = () => {
        for (const pending of this.workerRequests.values()) pending.reject(new Error('Audio worker failed'))
        this.workerRequests.clear()
      }
    }
    const id = ++this.workerRequestId
    const channels = await new Promise<[Float32Array, Float32Array]>((resolve, reject) => {
      this.workerRequests.set(id, { resolve, reject })
      this.worker!.postMessage({ id, profile, sampleRate: context.sampleRate })
    })
    if (context !== this.context) throw new Error('Audio context changed')
    const buffer = context.createBuffer(2, channels[0].length, context.sampleRate)
    channels.forEach((samples, channel) => buffer.getChannelData(channel).set(samples))
    this.buffers.set(profile, buffer)
    return buffer
  }

  /** Call from the Turn on / unmute click handler before leaving its gesture. */
  async activate(settings: AmbientSettings, readingPlaying: boolean): Promise<void> {
    this.settings = settings
    this.readingPlaying = readingPlaying
    if (settings.profile === 'silence' || settings.muted) return
    const context = this.ensureContext()
    this.activated = true
    const resume = context.resume() // starts in the user gesture, including Safari
    this.resetOffTimer()
    await resume
    await this.sync()
  }

  update(settings: AmbientSettings, readingPlaying: boolean) {
    const timerChanged = settings.timerMinutes !== this.timerMinutes
    const wasMuted = this.settings.muted
    this.settings = settings
    this.readingPlaying = readingPlaying
    if (timerChanged || settings.muted !== wasMuted) this.resetOffTimer()
    void this.sync()
  }

  private resetOffTimer() {
    if (this.offTimer) clearTimeout(this.offTimer)
    this.offTimer = null
    this.timerMinutes = this.settings.timerMinutes
    if (this.activated && !this.settings.muted && this.settings.profile !== 'silence' && this.timerMinutes > 0) {
      this.offTimer = setTimeout(() => {
        this.offTimer = null
        this.update({ ...this.settings, muted: true }, this.readingPlaying)
        this.onTimerExpired()
      }, this.timerMinutes * 60000)
    }
  }

  private fadeMaster(target: number, seconds: number) {
    if (!this.context || !this.master) return
    const now = this.context.currentTime
    const gain = this.master.gain
    gain.cancelScheduledValues(now)
    gain.setValueAtTime(gain.value, now)
    gain.linearRampToValueAtTime(target, now + seconds)
  }

  private retireVoice() {
    if (!this.context || !this.voice) return
    const old = this.voice
    this.voice = null
    const now = this.context.currentTime
    old.gain.gain.cancelScheduledValues(now)
    old.gain.gain.setValueAtTime(old.gain.gain.value, now)
    old.gain.gain.linearRampToValueAtTime(0, now + FADE_SECONDS)
    old.source.stop(now + FADE_SECONDS + .01)
    old.source.onended = () => { old.source.disconnect(); old.gain.disconnect() }
  }

  private async sync() {
    const generation = ++this.generation
    if (this.idleTimer) clearTimeout(this.idleTimer)
    this.idleTimer = null
    if (!this.activated) return
    const shouldPlay = !this.settings.muted && this.settings.profile !== 'silence' && (!this.settings.pauseWithReading || this.readingPlaying)
    if (!shouldPlay) {
      this.fadeMaster(0, FADE_SECONDS)
      this.retireVoice()
      if (this.context) this.idleTimer = setTimeout(() => {
        if (generation !== this.generation) return
        if (this.settings.muted || this.settings.profile === 'silence') this.releaseContext()
        else void this.context?.suspend().catch(() => {})
      }, IDLE_DELAY_MS)
      return
    }
    const context = this.ensureContext()
    try { await context.resume() } catch { return }
    if (generation !== this.generation || context !== this.context) return
    this.fadeMaster(Math.max(0, Math.min(1, this.settings.volume / 100)), .09)
    if (this.voice?.profile === this.settings.profile) return
    const profile = this.settings.profile as Exclude<AudioProfile, 'silence'>
    let buffer: AudioBuffer
    try { buffer = await this.prepareBuffer(context, profile) } catch { return }
    if (generation !== this.generation) return
    const source = context.createBufferSource()
    const gain = context.createGain()
    source.buffer = buffer
    source.loop = true
    gain.gain.value = 0
    source.connect(gain)
    gain.connect(this.master!)
    source.start()
    gain.gain.setValueAtTime(0, context.currentTime)
    gain.gain.linearRampToValueAtTime(1, context.currentTime + FADE_SECONDS)
    this.retireVoice()
    this.voice = { source, gain, profile }
  }

  private releaseContext() {
    this.retireVoice()
    const context = this.context
    this.context = null
    this.master = null
    this.buffers.clear()
    this.worker?.terminate()
    this.worker = null
    for (const pending of this.workerRequests.values()) pending.reject(new Error('Audio stopped'))
    this.workerRequests.clear()
    this.activated = false
    if (context) void context.close().catch(() => {})
  }

  /** Used when leaving the reader and on unmount. */
  destroy() {
    ++this.generation
    if (this.idleTimer) clearTimeout(this.idleTimer)
    if (this.offTimer) clearTimeout(this.offTimer)
    this.idleTimer = null
    this.offTimer = null
    this.releaseContext()
  }
}
