import { X } from 'lucide-react'
import type { ReadingRecord } from '../../types'
import { formatTime } from '../../lib/readingTime'
import { summarize } from '../../lib/stats'
import { useModalFocus } from '../../hooks/useModalFocus'

type Props = { records: ReadingRecord[]; goal: number; onGoal: (goal: number) => void; onClear: () => void; onClose: () => void }
export default function Stats({ records, goal, onGoal, onClear, onClose }: Props) {
  const dialogRef = useModalFocus(onClose)
  const s = summarize(records, goal)
  const peak = Math.max(1, ...s.week.map(d => d.words))
  const recent = [...records].sort((a, b) => b.startedAt - a.startedAt).slice(0, 8)
  return <div className="settings-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}><aside ref={dialogRef} className="settings-panel" role="dialog" aria-modal="true" aria-label="Reading statistics"><div className="settings-head"><div><div className="eyebrow">YOUR PROGRESS</div><h2>Statistics</h2></div><button className="icon-button" aria-label="Close statistics" onClick={onClose}><X size={20}/></button></div><div className="settings-body">
    <div className="stat-grid">
      <div><small>WORDS READ</small><strong>{s.totalWords.toLocaleString()}</strong></div>
      <div><small>AVERAGE WPM</small><strong>{s.averageWpm || '—'}</strong></div>
      <div><small>TIME READING</small><strong>{formatTime(s.totalMs)}</strong></div>
      <div><small>DAY STREAK</small><strong>{s.streak}</strong></div>
    </div>
    <h3>Daily goal</h3>
    <div className="goal-bar" role="progressbar" aria-label="Daily goal progress" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(s.todayWords, goal)}><span style={{ width: `${s.goalProgress * 100}%` }}/></div>
    <p className="setting-note">{s.todayWords.toLocaleString()} of {goal.toLocaleString()} words today{s.goalProgress >= 1 ? ' · goal met' : ''}</p>
    <label className="setting-row">Words per day <b>{goal.toLocaleString()}</b><input type="range" min={100} max={20000} step={100} value={goal} onChange={e => onGoal(+e.target.value)}/></label>
    <h3>Last 7 days</h3>
    <div className="week-chart" role="img" aria-label="Words read per day over the last 7 days">{s.week.map(d => <div key={d.day} title={`${d.day}: ${d.words.toLocaleString()} words`}><span style={{ height: `${Math.max(d.words ? 6 : 2, d.words / peak * 100)}%` }}/><small>{d.day.slice(8)}</small></div>)}</div>
    <h3>Recent sessions</h3>
    {recent.length ? <ul className="session-list">{recent.map(r => <li key={r.id}><span>{r.title || 'Untitled document'}</span><small>{r.words.toLocaleString()} words · {Math.round(r.words / (r.activeMs / 60000))} WPM · {r.day}</small></li>)}</ul> : <p className="setting-note">Read for a few seconds and your sessions will appear here. They stay on this device.</p>}
    {records.length > 0 && <button className="clear-history" onClick={() => { if (confirm('Delete all reading history on this device?')) onClear() }}>Clear reading history</button>}
  </div></aside></div>
}
