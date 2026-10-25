import { Minus, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { clampWpm, msPerWord } from '../../lib/readingTime'
export default function WPMControl({ value, fine, onChange, compact = false }: { value: number; fine: boolean; onChange: (value: number) => void; compact?: boolean }) {
  const step = fine ? 1 : 10
  const [draft, setDraft] = useState(String(value))
  useEffect(() => setDraft(String(value)), [value])
  const commit = () => { const number = Number(draft); if (draft && Number.isFinite(number)) onChange(clampWpm(number)); else setDraft(String(value)) }
  return <div className={compact ? 'wpm-control compact' : 'wpm-control'}>
    <div className="wpm-heading"><span>READING SPEED</span><strong>{value} <small>WPM</small></strong></div>
    <div className="wpm-row"><button aria-label="Decrease WPM" className="icon-button" onClick={() => onChange(clampWpm(value - step))}><Minus size={16}/></button><input aria-label="Reading speed" type="range" min="100" max="1500" step={step} value={value} onChange={e => onChange(+e.target.value)} /><button aria-label="Increase WPM" className="icon-button" onClick={() => onChange(clampWpm(value + step))}><Plus size={16}/></button></div>
    {!compact && <><div className="speed-presets">{[[150,'Relaxed'],[250,'Normal'],[300,'Focused'],[450,'Fast'],[600,'Advanced'],[900,'Extreme']].map(([speed,label]) => <button key={speed} className={value === speed ? 'preset active' : 'preset'} onClick={() => onChange(Number(speed))}>{speed}<small>{label}</small></button>)}</div><div className="speed-foot"><label>Exact speed <input aria-label="Exact WPM" type="number" min="100" max="1500" step={step} value={draft} onChange={e => { setDraft(e.target.value); const number = Number(e.target.value); if (number >= 100 && number <= 1500) onChange(clampWpm(number)) }} onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}/></label><span>{Math.round(msPerWord(value))} ms / word</span></div></>}
  </div>
}
