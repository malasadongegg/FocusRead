import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { AmbientAudioEngine, type AmbientSettings, createAmbientBuffer } from '../src/lib/ambientAudio'
import { defaults } from '../src/lib/defaults'
import { readPreferences, writeLocal } from '../src/lib/storage'
import App from '../src/App'

const base: AmbientSettings = { profile: 'rain', volume: 40, muted: true, pauseWithReading: false, timerMinutes: 0 }
function fakeContext() {
  const gains: Array<{ gain: { value: number; cancelScheduledValues: ReturnType<typeof vi.fn>; setValueAtTime: ReturnType<typeof vi.fn>; linearRampToValueAtTime: ReturnType<typeof vi.fn> }; connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }> = []
  const sources: Array<{ buffer: AudioBuffer | null; loop: boolean; start: ReturnType<typeof vi.fn>; stop: ReturnType<typeof vi.fn>; connect: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn>; onended: (() => void) | null }> = []
  const context = {
    sampleRate: 100, currentTime: 1, destination: {}, state: 'running',
    createGain: vi.fn(() => { const node = { gain: { value: 0, cancelScheduledValues: vi.fn(), setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() }; gains.push(node); return node }),
    createBufferSource: vi.fn(() => { const node = { buffer: null, loop: false, start: vi.fn(), stop: vi.fn(), connect: vi.fn(), disconnect: vi.fn(), onended: null }; sources.push(node); return node }),
    createBuffer: vi.fn((_channels: number, length: number) => { const data = [new Float32Array(length), new Float32Array(length)]; return { length, getChannelData: (channel: number) => data[channel] } }),
    resume: vi.fn(async () => {}), suspend: vi.fn(async () => {}), close: vi.fn(async () => {}),
  }
  return { context: context as unknown as AudioContext, raw: context, gains, sources }
}

beforeEach(() => { vi.useFakeTimers(); localStorage.clear(); window.matchMedia = vi.fn().mockImplementation(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })) })
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers() })

describe('ambient audio engine', () => {
  it('starts muted, creates no context until explicit activation, and fades in at saved volume', async () => {
    const fake = fakeContext(), factory = vi.fn(() => fake.context)
    const engine = new AmbientAudioEngine(vi.fn(), factory)
    engine.update(base, false)
    expect(factory).not.toHaveBeenCalled()
    await engine.activate({ ...base, muted: false }, false)
    expect(fake.raw.resume).toHaveBeenCalled()
    expect(fake.sources[0].start).toHaveBeenCalledOnce()
    expect(fake.gains[0].gain.linearRampToValueAtTime).toHaveBeenCalledWith(.4, expect.any(Number))
    engine.destroy()
  })
  it('changes volume without replacing the source, and crossfades sound profiles', async () => {
    const fake = fakeContext(), engine = new AmbientAudioEngine(vi.fn(), () => fake.context)
    await engine.activate({ ...base, muted: false }, true)
    engine.update({ ...base, muted: false, volume: 80 }, true)
    await Promise.resolve()
    expect(fake.sources).toHaveLength(1)
    expect(fake.gains[0].gain.linearRampToValueAtTime).toHaveBeenCalledWith(.8, expect.any(Number))
    engine.update({ ...base, muted: false, volume: 80, profile: 'brown' }, true)
    for (let i = 0; i < 4; i++) await Promise.resolve()
    expect(fake.sources).toHaveLength(2)
    expect(fake.sources[0].stop).toHaveBeenCalled()
    expect(fake.sources[1].start).toHaveBeenCalled()
    expect(fake.gains[2].gain.linearRampToValueAtTime).toHaveBeenCalledWith(1, expect.any(Number))
    engine.destroy()
  })
  it('fades and suspends when reading pauses, then releases resources on mute', async () => {
    const fake = fakeContext(), engine = new AmbientAudioEngine(vi.fn(), () => fake.context)
    const on = { ...base, muted: false, pauseWithReading: true }
    await engine.activate(on, true)
    engine.update(on, false)
    vi.advanceTimersByTime(300)
    expect(fake.sources[0].stop).toHaveBeenCalled()
    expect(fake.raw.suspend).toHaveBeenCalled()
    engine.update({ ...on, muted: true }, false)
    vi.advanceTimersByTime(300)
    expect(fake.raw.close).toHaveBeenCalledOnce()
    expect(engine.hasContext).toBe(false)
    engine.destroy()
  })
  it('fades to silence and frees the context without creating another source', async () => {
    const fake = fakeContext(), engine = new AmbientAudioEngine(vi.fn(), () => fake.context)
    await engine.activate({ ...base, muted: false }, true)
    engine.update({ ...base, muted: false, profile: 'silence' }, true)
    expect(fake.sources).toHaveLength(1)
    expect(fake.sources[0].stop).toHaveBeenCalled()
    vi.advanceTimersByTime(300)
    expect(fake.raw.close).toHaveBeenCalledOnce()
    engine.destroy()
  })
  it('automatically mutes when its timer expires and clears timers on cleanup', async () => {
    const fake = fakeContext(), expired = vi.fn(), engine = new AmbientAudioEngine(expired, () => fake.context)
    await engine.activate({ ...base, muted: false, timerMinutes: 5 }, true)
    vi.advanceTimersByTime(5 * 60000 - 1)
    expect(expired).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(expired).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(300)
    expect(fake.raw.close).toHaveBeenCalled()
    engine.destroy()
    vi.advanceTimersByTime(60 * 60000)
    expect(expired).toHaveBeenCalledOnce()
  })
  it('generates all profiles locally with a continuous loop seam', () => {
    const fake = fakeContext()
    for (const profile of ['white', 'pink', 'brown', 'rain'] as const) {
      const buffer = createAmbientBuffer(fake.context, profile)
      expect(buffer.length).toBe(profile === 'rain' ? 600 : 400)
      const channel = buffer.getChannelData(0)
      expect(channel.some(sample => sample !== 0)).toBe(true)
      expect(Math.abs(channel.at(-1)! - channel[0])).toBeLessThan(.001)
    }
  })
})

it('persists profile, volume, mute, pause preference, and timer', () => {
  const saved = { ...defaults, audioProfile: 'brown' as const, audioVolume: 73, audioMuted: false, audioPauseWithReading: true, audioTimerMinutes: 15 }
  writeLocal('preferences', saved)
  expect(readPreferences(defaults)).toMatchObject({ audioProfile: 'brown', audioVolume: 73, audioMuted: false, audioPauseWithReading: true, audioTimerMinutes: 15 })
})

it('exposes compact audio controls in the reader and stays muted by default', async () => {
  vi.useRealTimers()
  render(<App />)
  fireEvent.change(screen.getByLabelText('Reading text'), { target: { value: 'one two three' } })
  fireEvent.click(screen.getByText('Start reading'))
  await screen.findByText('WORD 1')
  fireEvent.click(screen.getByLabelText('Ambient audio settings'))
  expect(screen.getByLabelText('Turn on ambient audio')).toBeInTheDocument()
  expect(screen.getByLabelText('Ambient volume')).toHaveValue('40')
  expect(screen.getByLabelText('Ambient audio timer')).toHaveValue('0')
  expect(screen.getByRole('button', { name: /Rain/ })).toHaveAttribute('aria-pressed', 'true')
})
