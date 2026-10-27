import { X } from 'lucide-react'
import { useState } from 'react'
import type { PracticeGoal } from '../../types'

export default function Practice({ wordCount, onStart, onClose }: { wordCount: number; onStart: (goal: PracticeGoal) => void; onClose: () => void }) {
  const [wpm, setWpm] = useState(350)
  const [minutes, setMinutes] = useState(2)
  const needed = wpm * minutes
  return <div className="settings-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}><aside className="settings-panel" role="dialog" aria-modal="true" aria-label="Guided practice"><div className="settings-head"><div><div className="eyebrow">BUILD A STEADY RHYTHM</div><h2>Guided practice</h2></div><button className="icon-button" aria-label="Close practice" onClick={onClose}><X size={20}/></button></div><div className="settings-body">
    <p className="setting-note">Practice with the text in your editor. Speed ramps up to your target over the first 100 words. The reader pauses after your selected active reading time.</p>
    <label className="setting-row">Target WPM <b>{wpm}</b><input aria-label="Practice target WPM" type="range" min="100" max="1500" step="10" value={wpm} onChange={e => setWpm(+e.target.value)}/></label>
    <label className="setting-row">Practice length<select aria-label="Practice length" value={minutes} onChange={e => setMinutes(+e.target.value)}>{[2,5,10].map(value => <option key={value} value={value}>{value} minutes</option>)}</select></label>
    <p className="setting-note">The editor has {wordCount.toLocaleString()} words. At the target speed, {minutes} minutes is about {needed.toLocaleString()} words. Practice also ends when the text ends.</p>
    <button className="primary-button practice-start" disabled={!wordCount} onClick={() => onStart({ wpm, minutes })}>Start practice</button>
    {!wordCount && <p className="setting-note" role="status">Paste or import text before starting practice.</p>}
  </div></aside></div>
}
