import type { Token } from '../types'
import { isSentenceEnd } from './preprocess'

const isSentenceStart = (tokens: Token[], index: number) => index <= 0 || tokens[index].paragraphBefore || isSentenceEnd(tokens[index - 1].text)
/** Start of the current sentence, or of the previous one when already at a start, so repeated presses walk backward. */
export function previousSentenceStart(tokens: Token[], index: number): number {
  let i = Math.min(index, tokens.length) - 1
  while (i > 0 && !isSentenceStart(tokens, i)) i--
  return Math.max(0, i)
}
export function nextSentenceStart(tokens: Token[], index: number): number {
  let i = index + 1
  while (i < tokens.length && !isSentenceStart(tokens, i)) i++
  return Math.min(i, Math.max(0, tokens.length - 1))
}
