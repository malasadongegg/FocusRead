import type { Token } from '../types'

/** Whitespace delimits words. Offsets retain the original text for traditional mode. */
export function tokenize(text: string): Token[] {
  const tokens: Token[] = []
  const regex = /\S+/gu
  let match: RegExpExecArray | null
  let previousEnd = 0
  while ((match = regex.exec(text))) {
    tokens.push({ text: match[0], start: match.index, end: match.index + match[0].length,
      paragraphBefore: /\n\s*\n/u.test(text.slice(previousEnd, match.index)) })
    previousEnd = match.index + match[0].length
  }
  return tokens
}
