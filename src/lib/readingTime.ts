import type { Preferences, Token } from '../types'
export const clampWpm = (value: number) => Number.isFinite(value) ? Math.min(1500, Math.max(100, Math.round(value))) : 300
export const msPerWord = (wpm: number) => 60000 / clampWpm(wpm)
/** Selected WPM is the target. Ramp starts at 65% and reaches it after rampUpWords.
 * Experimental adaptive mode spends more time on long words and less on short ones. */
export function paceWpmAt(tokens: Token[], index: number, settings: Preferences): number {
  const target = clampWpm(settings.wpm)
  if (settings.paceMode === 'ramp') return Math.max(100, target * (.65 + .35 * Math.min(1, index / Math.max(1, settings.rampUpWords))))
  if (settings.paceMode === 'adaptive') {
    const length = tokens[index]?.text.match(/[\p{L}\p{N}]/gu)?.length ?? 0
    const factor = Math.min(1.2, Math.max(.75, 1 + (length - 5) * -.055))
    return Math.max(100, Math.min(1500, target * factor))
  }
  return target
}
export function tokenDuration(tokens: Token[], index: number, settings: Preferences): number {
  const token = tokens[index]
  if (!token) return 0
  let duration = msPerWord(paceWpmAt(tokens, index, settings))
  if (settings.punctuation) {
    if (/[,;:]\s*["'”’)}\]]*$/u.test(token.text)) duration += settings.commaPause
    if (/[.!?]\s*["'”’)}\]]*$/u.test(token.text)) duration += settings.sentencePause
    if (tokens[index + 1]?.paragraphBefore) duration += settings.paragraphPause
  }
  return duration
}
export function remainingDuration(tokens: Token[], index: number, settings: Preferences): number {
  if (!settings.punctuation && settings.paceMode === 'fixed') return Math.max(0, tokens.length - index) * msPerWord(settings.wpm)
  let duration = 0
  for (let i = index; i < tokens.length; i++) duration += tokenDuration(tokens, i, settings)
  return duration
}
export const formatTime = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const hours = Math.floor(total / 3600), minutes = Math.floor((total % 3600) / 60), seconds = total % 60
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` : `${minutes}:${String(seconds).padStart(2, '0')}`
}
