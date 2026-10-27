/** ORP is at 40% of the letter span, ignoring edge punctuation.
 * This yields focus→c, reading→d, speed→e, and computer→p.
 * offset shifts this position and is clamped to a letter in the word. */
export function orpIndex(word: string, offset = 0): number {
  const chars = Array.from(word)
  if (!chars.length) return 0
  const first = chars.findIndex(char => /[\p{L}\p{N}]/u.test(char))
  if (first < 0) return 0
  const letters = chars.map((char, index) => /[\p{L}\p{N}]/u.test(char) ? index : -1).filter(index => index >= 0)
  const base = letters.length === 1 ? 0 : Math.round(letters.length * .4)
  return letters[Math.min(letters.length - 1, Math.max(0, base + offset))]
}
export function splitOrp(word: string, offset = 0) {
  const chars = Array.from(word)
  const index = orpIndex(word, offset)
  return { before: chars.slice(0, index).join(''), focal: chars[index] ?? '', after: chars.slice(index + 1).join('') }
}
