export default function ProgressBar({ index, total, onSeek }: { index: number; total: number; onSeek: (index: number) => void }) {
  const percent = total ? Math.round(((index + 1) / total) * 100) : 0
  return <div className="progress-wrap"><div className="progress-label"><span>WORD {Math.min(index + 1, total).toLocaleString()} <em>/ {total.toLocaleString()}</em></span><span>{percent}% COMPLETE</span></div><input aria-label="Reading progress" type="range" min="0" max={Math.max(0, total - 1)} value={index} onChange={e => onSeek(+e.target.value)} style={{ '--progress': `${total > 1 ? index / (total - 1) * 100 : 0}%` } as React.CSSProperties}/></div>
}
