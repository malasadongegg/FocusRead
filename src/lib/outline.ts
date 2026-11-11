import { cleanLine, isSentenceEnd } from './preprocess'

export interface OutlineItem { label: string; index: number; level: number }
const MAX_LABEL = 80
const heading = /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/u

/** Finds Markdown headings and short title lines that follow a triple line break (how EPUB chapters are joined).
 * Word indexes follow the reading copy, so the same source works with display cleanup on or off. */
export function buildOutline(source: string, clean: boolean): OutlineItem[] {
  const items: OutlineItem[] = []
  let words = 0, blanks = 0
  for (const line of source.replace(/\r\n?/gu, '\n').replace(/\u00a0/gu, ' ').split('\n')) {
    const shown = clean ? cleanLine(line) : line
    const count = shown.match(/\S+/gu)?.length ?? 0
    if (!line.trim()) { blanks++; continue }
    const match = heading.exec(line)
    const title = line.trim()
    if (match) items.push({ label: match[2].slice(0, MAX_LABEL), index: words, level: match[1].length })
    else if (blanks >= 2 && words > 0 && title.length <= MAX_LABEL && !/[.!?,;:]["'”’)]*$/u.test(title) && !isSentenceEnd(title)) items.push({ label: title, index: words, level: 1 })
    blanks = 0
    words += count
  }
  return items
}
