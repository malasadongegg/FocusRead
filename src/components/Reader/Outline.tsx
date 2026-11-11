import { X } from 'lucide-react'
import { useModalFocus } from '../../hooks/useModalFocus'
import type { OutlineItem } from '../../lib/outline'

export default function Outline({ items, index, onSeek, onClose }: { items: OutlineItem[]; index: number; onSeek: (index: number) => void; onClose: () => void }) {
  const dialogRef = useModalFocus(onClose)
  const current = items.reduce((found, item, position) => item.index <= index ? position : found, -1)
  return <div className="settings-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}><aside ref={dialogRef} className="settings-panel" role="dialog" aria-modal="true" aria-label="Contents"><div className="settings-head"><div><div className="eyebrow">JUMP TO A SECTION</div><h2>Contents</h2></div><button className="icon-button" aria-label="Close contents" onClick={onClose}><X size={20}/></button></div><div className="settings-body"><ul className="outline-list">{items.map((item, position) => <li key={`${item.index}-${position}`} style={{ paddingLeft: `${(Math.min(item.level, 4) - 1) * 14}px` }}><button type="button" aria-current={position === current ? 'true' : undefined} onClick={() => { onSeek(item.index); onClose() }}>{item.label}<small>Word {(item.index + 1).toLocaleString()}</small></button></li>)}</ul></div></aside></div>
}
