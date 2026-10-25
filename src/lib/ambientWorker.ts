import { synthesizeChannels } from './ambientAudio'
import type { AudioProfile } from '../types'

self.onmessage = (event: MessageEvent<{ id: number; profile: Exclude<AudioProfile, 'silence'>; sampleRate: number }>) => {
  const { id, profile, sampleRate } = event.data
  const channels = synthesizeChannels(profile, sampleRate)
  ;(self as unknown as { postMessage: (message: unknown, transfer: Transferable[]) => void }).postMessage({ id, channels }, channels.map(channel => channel.buffer as ArrayBuffer))
}
