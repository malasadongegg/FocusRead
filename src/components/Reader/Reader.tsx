import { useEffect, useRef } from 'react'
import type { Mode, Preferences, Token } from '../../types'
import { splitOrp } from '../../lib/orp'

function FocusWord({ word, settings }: { word: string; settings: Preferences }) {
  const { before, focal, after } = splitOrp(word, settings.orpOffset)
  return <div className="focus-word" style={{ fontSize: `clamp(16px, ${110 / Math.max(Array.from(word).length, 8)}vw, ${settings.fontSize}px)`, fontWeight: settings.fontWeight, fontFamily: settings.fontFamily, color: settings.textColor }}>
    <span className="focus-before">{before}</span><span className="focus-letter" style={{ color: settings.orpEnabled ? settings.accentColor : settings.textColor, fontSize: `${settings.focalScale}em` }}>{focal}</span><span className="focus-after">{after}</span>
  </div>
}

export default function Reader({ tokens, index, mode, settings }: { tokens: Token[]; index: number; mode: Mode; settings: Preferences }) {
  const activeRef = useRef<HTMLSpanElement>(null)
  useEffect(() => { if (mode === 'traditional') activeRef.current?.scrollIntoView({ block: 'center', behavior: settings.reducedMotion ? 'instant' : 'smooth' }) }, [index, mode, settings.reducedMotion])
  if (mode === 'traditional') return <div className="traditional-reader" style={{ maxWidth: settings.readerWidth, fontFamily: settings.fontFamily, color: settings.textColor, fontSize: Math.max(18, settings.fontSize / 3), fontWeight: settings.fontWeight }} aria-live="off">
    {tokens.map((token, i) => <span key={i}>{token.paragraphBefore && <><br/><br/></>}<span ref={i === index ? activeRef : undefined} className={i === index ? 'traditional-active' : ''} style={i === index ? { backgroundColor: settings.accentColor } : undefined}>{token.text}</span>{' '}</span>)}
  </div>
  if (mode === 'chunk') return <div className="reader-stage" style={{ maxWidth: settings.readerWidth }}><div className="stage-hint">CHUNK READING · {settings.chunkSize} WORDS</div><div className="chunk-display" style={{ color: settings.textColor, fontFamily: settings.fontFamily, fontWeight: settings.fontWeight, fontSize: `clamp(1.8rem, ${settings.fontSize / 6}vw, ${settings.fontSize * .8}px)` }}>{tokens.slice(index, index + settings.chunkSize).map(t => t.text).join(' ')}</div><div className="stage-caption">Keep your eyes at the center</div></div>
  return <div className="reader-stage" style={{ maxWidth: settings.readerWidth }}><div className="stage-hint">FIX YOUR GAZE ON THE RED LETTER</div><div className={`word-lane ${settings.horizontalGuides ? '' : 'no-guides'}`}>
    {settings.verticalGuide && <span className="vertical-guide" style={{ backgroundColor: settings.accentColor }} />}
    <FocusWord word={tokens[index]?.text ?? ''} settings={settings} />
  </div><div className="stage-caption">One word. One moment. Total focus.</div></div>
}
