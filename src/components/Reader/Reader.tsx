import type { Mode, Preferences, Token } from '../../types'
import { splitOrp } from '../../lib/orp'
import { focalFontSize } from '../../lib/focalSizing'
import TraditionalReader from './TraditionalReader'
const emptyIndices: number[] = []

function FocusWord({ word, settings, annotated }: { word: string; settings: Preferences; annotated: boolean }) {
  const { before, focal, after } = splitOrp(word, settings.orpOffset)
  return <div className={`focus-word ${annotated ? 'annotated-word' : ''}`} role="text" aria-label={word} style={{ fontSize: focalFontSize(word, settings.fontSize, settings.readerWidth), fontWeight: settings.fontWeight, fontFamily: settings.fontFamily, color: settings.textColor }}>
    <span className="focus-before" aria-hidden="true">{before}</span><span className="focus-letter" aria-hidden="true" style={{ color: settings.orpEnabled ? settings.accentColor : settings.textColor, fontSize: `${settings.focalScale}em` }}>{focal}</span><span className="focus-after" aria-hidden="true">{after}</span>
  </div>
}

export default function Reader({ tokens, index, mode, settings, annotatedIndices = emptyIndices }: { tokens: Token[]; index: number; mode: Mode; settings: Preferences; annotatedIndices?: number[] }) {
  if (mode === 'traditional') return <TraditionalReader tokens={tokens} index={index} settings={settings} annotatedIndices={annotatedIndices}/>
  if (mode === 'chunk') return <div className="reader-stage" style={{ maxWidth: settings.readerWidth }}><div className="stage-hint">CHUNK READING · {settings.chunkSize} WORDS</div><div className="chunk-display" style={{ color: settings.textColor, fontFamily: settings.fontFamily, fontWeight: settings.fontWeight, fontSize: `clamp(1.8rem, ${settings.fontSize / 6}vw, ${settings.fontSize * .8}px)` }}>{tokens.slice(index, index + settings.chunkSize).map(t => t.text).join(' ')}</div><div className="stage-caption">Keep your eyes at the center</div></div>
  return <div className="reader-stage" style={{ maxWidth: settings.readerWidth }}><div className="stage-hint">FIX YOUR GAZE ON THE RED LETTER</div><div className={`word-lane ${settings.horizontalGuides ? '' : 'no-guides'}`} aria-live="off">
    {settings.verticalGuide && <span className="vertical-guide" style={{ backgroundColor: settings.accentColor }} />}
    <FocusWord word={tokens[index]?.text ?? ''} settings={settings} annotated={annotatedIndices.includes(index)} />
  </div><div className="stage-caption">One word. One moment. Total focus.</div></div>
}
