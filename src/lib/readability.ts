import { tokenize } from './tokenizer'

export interface ReadabilitySummary { words: number; sentences: number; averageSentenceWords: number; complexWords: number; complexPercent: number; level: 'short and simple' | 'moderate' | 'dense' }

/** A transparent text-shape estimate, not a validated grade or comprehension score. */
export function analyzeReadability(text: string): ReadabilitySummary {
  const tokens = tokenize(text)
  const words = tokens.length
  if (!words) return { words: 0, sentences: 0, averageSentenceWords: 0, complexWords: 0, complexPercent: 0, level: 'short and simple' }
  const sentenceEnds = tokens.filter(token => /[.!?]["'”’)}\]]*$/u.test(token.text)).length
  const sentences = Math.max(1, sentenceEnds)
  const complexWords = tokens.filter(token => (token.text.match(/[\p{L}\p{N}]/gu)?.length ?? 0) >= 9).length
  const averageSentenceWords = Math.round(words / sentences * 10) / 10
  const complexPercent = Math.round(complexWords / words * 100)
  const level = averageSentenceWords >= 23 || complexPercent >= 25 ? 'dense' : averageSentenceWords >= 14 || complexPercent >= 12 ? 'moderate' : 'short and simple'
  return { words, sentences, averageSentenceWords, complexWords, complexPercent, level }
}
