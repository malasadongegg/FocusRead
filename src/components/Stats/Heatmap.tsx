import { useMemo } from 'react'
import type { ReadingRecord } from '../../types'
import { heatmapWeeks } from '../../lib/stats'

/** One-hue calendar of words per day. Color is never the only channel: every cell has a tooltip and the table view lists the same values. */
export default function Heatmap({ records, goal, weeks = 26 }: { records: ReadingRecord[]; goal: number; weeks?: number }) {
  const columns = useMemo(() => heatmapWeeks(records, goal, weeks), [records, goal, weeks])
  const active = columns.flat().filter(cell => cell.words > 0).reverse()
  return <figure className="heatmap"><div className="heatmap-grid" role="img" aria-label={`Words read per day over the last ${weeks} weeks. ${active.length} days with reading.`}>{columns.map((column, i) => <div key={i}>{column.map(cell => <span key={cell.day} className={`heat heat-${cell.future ? 'future' : cell.level}`} title={cell.future ? undefined : `${cell.day}: ${cell.words.toLocaleString()} words`}/>)}</div>)}</div>
    <figcaption><span>Less</span>{[0, 1, 2, 3, 4].map(level => <span key={level} className={`heat heat-${level}`} aria-hidden="true"/>)}<span>More · strongest = daily goal met</span></figcaption>
    <details><summary>View as table</summary>{active.length ? <table><thead><tr><th scope="col">Day</th><th scope="col">Words</th></tr></thead><tbody>{active.slice(0, 60).map(cell => <tr key={cell.day}><td>{cell.day}</td><td>{cell.words.toLocaleString()}</td></tr>)}</tbody></table> : <p className="setting-note">No reading days in this period yet.</p>}</details>
  </figure>
}
