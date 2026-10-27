import { useLayoutEffect, useMemo, useRef } from 'react'
import type { Preferences, Token } from '../../types'

/** Keep the full passage mounted. A position change updates only two DOM nodes. */
export default function TraditionalReader({ tokens, index, settings }: { tokens: Token[]; index: number; settings: Preferences }) {
  const nodes = useRef<(HTMLSpanElement | null)[]>([])
  const previous = useRef<number | null>(null)
  const content = useMemo(() => tokens.map((token, i) => <span key={i}>{token.paragraphBefore && <><br/><br/></>}<span ref={node => { nodes.current[i] = node }}>{token.text}</span>{' '}</span>), [tokens])
  useLayoutEffect(() => {
    if (previous.current !== null) nodes.current[previous.current]?.classList.remove('traditional-active')
    const current = nodes.current[index]
    current?.classList.add('traditional-active')
    previous.current = index
    if (current) {
      const lane = current.closest('.traditional-reader')
      if (lane && (current.offsetTop < lane.scrollTop || current.offsetTop > lane.scrollTop + lane.clientHeight - current.offsetHeight)) current.scrollIntoView({ block: 'center', behavior: 'instant' })
    }
  }, [index, tokens])
  return <div className="traditional-reader" style={{ maxWidth: settings.readerWidth, fontFamily: settings.fontFamily, color: settings.textColor, fontSize: Math.max(18, settings.fontSize / 3), fontWeight: settings.fontWeight }} aria-live="off">{content}</div>
}
