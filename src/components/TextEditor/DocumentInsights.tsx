import { useDeferredValue, useMemo } from 'react'
import { analyzeReadability } from '../../lib/readability'

export default function DocumentInsights({ text }: { text: string }) {
  const deferredText = useDeferredValue(text)
  const analysis = useMemo(() => analyzeReadability(deferredText), [deferredText])
  if (!analysis.words) return null
  return <section className="document-insights" aria-label="Text difficulty estimate"><strong>Text shape: {analysis.level}</strong><span>{analysis.averageSentenceWords} words per sentence · {analysis.complexPercent}% long words</span><small>Estimated from sentence length and words of 9+ letters. This does not measure your comprehension or the meaning of the text.</small></section>
}
