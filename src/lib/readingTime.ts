import type { Preferences, Token } from '../types'
export const clampWpm = (value: number) => Math.min(1500, Math.max(100, Math.round(value)))
export const msPerWord = (wpm: number) => 60000 / clampWpm(wpm)
export function tokenDuration(tokens: Token[], index: number, settings: Preferences): number {
  const token = tokens[index]
  if (!token) return 0
  let duration = msPerWord(settings.wpm)
  if (settings.punctuation) {
    if (/[,;:]\s*["'”’)}\]]*$/u.test(token.text)) duration += settings.commaPause
    if (/[.!?]\s*["'”’)}\]]*$/u.test(token.text)) duration += settings.sentencePause
    if (tokens[index + 1]?.paragraphBefore) duration += settings.paragraphPause
  }
  return duration
}
export function remainingDuration(tokens: Token[], index: number, settings: Preferences): number {
  if (!settings.punctuation) return Math.max(0, tokens.length - index) * msPerWord(settings.wpm)
  let duration = 0
  for (let i = index; i < tokens.length; i++) duration += tokenDuration(tokens, i, settings)
  return duration
}
export const formatTime = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const hours = Math.floor(total / 3600), minutes = Math.floor((total % 3600) / 60), seconds = total % 60
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` : `${minutes}:${String(seconds).padStart(2, '0')}`
}
