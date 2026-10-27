import type { Mode, Preferences, Token } from '../../types'
import { splitOrp } from '../../lib/orp'
import TraditionalReader from './TraditionalReader'

function FocusWord({ word, settings }: { word: string; settings: Preferences }) {
  const { before, focal, after } = splitOrp(word, settings.orpOffset)
  return <div className="focus-word" role="text" aria-label={word} style={{ fontSize: `clamp(16px, ${110 / Math.max(Array.from(word).length, 8)}vw, ${settings.fontSize}px)`, fontWeight: settings.fontWeight, fontFamily: settings.fontFamily, color: settings.textColor }}>
    <span className="focus-before" aria-hidden="true">{before}</span><span className="focus-letter" aria-hidden="true" style={{ color: settings.orpEnabled ? settings.accentColor : settings.textColor, fontSize: `${settings.focalScale}em` }}>{focal}</span><span className="focus-after" aria-hidden="true">{after}</span>
  </div>
}

export default function Reader({ tokens, index, mode, settings }: { tokens: Token[]; index: number; mode: Mode; settings: Preferences }) {
  if (mode === 'traditional') return <TraditionalReader tokens={tokens} index={index} settings={settings}/>
  if (mode === 'chunk') return <div className="reader-stage" style={{ maxWidth: settings.readerWidth }}><div className="stage-hint">CHUNK READING · {settings.chunkSize} WORDS</div><div className="chunk-display" style={{ color: settings.textColor, fontFamily: settings.fontFamily, fontWeight: settings.fontWeight, fontSize: `clamp(1.8rem, ${settings.fontSize / 6}vw, ${settings.fontSize * .8}px)` }}>{tokens.slice(index, index + settings.chunkSize).map(t => t.text).join(' ')}</div><div className="stage-caption">Keep your eyes at the center</div></div>
  return <div className="reader-stage" style={{ maxWidth: settings.readerWidth }}><div className="stage-hint">FIX YOUR GAZE ON THE RED LETTER</div><div className={`word-lane ${settings.horizontalGuides ? '' : 'no-guides'}`} aria-live="off">
    {settings.verticalGuide && <span className="vertical-guide" style={{ backgroundColor: settings.accentColor }} />}
    <FocusWord word={tokens[index]?.text ?? ''} settings={settings} />
  </div><div className="stage-caption">One word. One moment. Total focus.</div></div>
}
