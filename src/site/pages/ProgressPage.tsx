import { useEffect, useState } from 'react'
import { ArrowRight, BookOpen, Clock3, Target, TrendingUp } from 'lucide-react'
import { listReadings } from '../../lib/library'
import { summarize } from '../../lib/stats'
import { formatTime } from '../../lib/readingTime'
import { defaults } from '../../lib/defaults'
import { readPreferences, writeLocal } from '../../lib/storage'
import type { ReadingRecord } from '../../types'
import { SiteLink } from '../navigation'

export default function ProgressPage() {
  const [records, setRecords] = useState<ReadingRecord[] | null>(null)
  const [error, setError] = useState(false)
  const [goal, setGoal] = useState(() => readPreferences(defaults).dailyGoalWords)
  useEffect(() => { let live = true; void listReadings().then(items => { if (live) setRecords(items) }).catch(() => { if (live) setError(true) }); return () => { live = false } }, [])
  const updateGoal = (value: number) => { const next = Math.min(20000, Math.max(100, value)); setGoal(next); writeLocal('preferences', { ...readPreferences(defaults), dailyGoalWords: next }) }
  const summary = summarize(records ?? [], goal)
  const recent = [...(records ?? [])].sort((a, b) => b.startedAt - a.startedAt).slice(0, 12)
  const peak = Math.max(1, ...summary.week.map(item => item.words))
  return <div className="page-container inner-page dashboard-page"><span className="overline">YOUR READING, ON THIS DEVICE</span><h1>Progress you can <em>make your own.</em></h1><p className="page-lede">A quiet record of the time and words you have processed. These numbers are local estimates, not a measure of comprehension.</p>
    {error && <p role="alert" className="data-notice">Reading history is unavailable in this browser.</p>}
    {!error && records === null && <p role="status" className="data-notice">Loading your local history…</p>}
    {!error && records !== null && <><div className="dashboard-stats"><article><Clock3 size={21}/><span>TIME READING</span><strong>{formatTime(summary.totalMs)}</strong></article><article><BookOpen size={21}/><span>WORDS PROCESSED</span><strong>{summary.totalWords.toLocaleString()}</strong></article><article><TrendingUp size={21}/><span>READING SESSIONS</span><strong>{summary.sessions}</strong></article><article><Target size={21}/><span>ESTIMATED WPM</span><strong>{summary.averageWpm || '—'}</strong></article></div><div className="dashboard-columns"><section className="dashboard-panel"><div className="panel-heading"><span className="overline">YOUR RHYTHM</span><h2>Last seven days</h2></div><div className="dashboard-chart" role="img" aria-label="Words processed on each of the last seven days">{summary.week.map(day => <div className="chart-day" key={day.day} title={`${day.day}: ${day.words} words`}><div className="chart-track"><span style={{ height: `${Math.max(day.words ? 7 : 2, day.words / peak * 100)}%` }}/></div><small>{day.day.slice(5)}</small></div>)}</div><p>{summary.todayWords.toLocaleString()} words today · {summary.streak} day goal streak</p></section><section className="dashboard-panel goal-panel"><div className="panel-heading"><span className="overline">A GOAL THAT FITS</span><h2>Daily reading goal</h2></div><div className="goal-count"><strong>{summary.todayWords.toLocaleString()}</strong><span>/ {goal.toLocaleString()} words</span></div><div className="goal-progress" role="progressbar" aria-label="Daily reading goal" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.min(summary.todayWords, goal)}><span style={{ width: `${summary.goalProgress * 100}%` }}/></div><label>Set your daily goal <input aria-label="Daily reading goal" type="number" min={100} max={20000} step={100} value={goal} onChange={event => updateGoal(+event.target.value)}/></label><p>Change this any time. Your target stays in this browser.</p></section></div><section className="history-section"><div className="panel-heading"><span className="overline">YOUR RECENT SESSIONS</span><h2>Reading history</h2></div>{recent.length ? <ul>{recent.map(record => <li key={record.id}><div><strong>{record.title || 'Untitled document'}</strong><small>{new Date(record.startedAt).toLocaleDateString()}</small></div><span>{record.words.toLocaleString()} words</span><span>{formatTime(record.activeMs)}</span><span>{record.activeMs ? Math.round(record.words / (record.activeMs / 60000)) : 0} WPM</span></li>)}</ul> : <div className="empty-history"><BookOpen size={25}/><h3>Your history begins with a reading session.</h3><p>Read for a few seconds and your first session will appear here.</p><SiteLink to="/app" className="solid-cta">Open reader <ArrowRight size={17}/></SiteLink></div>}</section></>}
  </div>
}
