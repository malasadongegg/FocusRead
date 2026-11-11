import { X } from 'lucide-react'
import { useModalFocus } from '../../hooks/useModalFocus'
import { readerShortcuts } from '../../lib/shortcuts'

export default function ShortcutHelp({ onClose }: { onClose: () => void }) {
  const dialogRef = useModalFocus(onClose)
  return <div className="settings-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}><aside ref={dialogRef} className="settings-panel" role="dialog" aria-modal="true" aria-label="Keyboard shortcuts"><div className="settings-head"><div><div className="eyebrow">WHILE READING</div><h2>Keyboard shortcuts</h2></div><button className="icon-button" aria-label="Close shortcuts" onClick={onClose}><X size={20}/></button></div><div className="settings-body"><table className="shortcut-table"><tbody>{readerShortcuts.map(item => <tr key={item.action}><th scope="row">{item.keys.map((key, i) => <span key={key}>{i > 0 && <span aria-hidden="true"> + </span>}<kbd>{key}</kbd></span>)}</th><td>{item.action}</td></tr>)}</tbody></table><p className="setting-note">Shortcuts are paused while a panel or text field has focus.</p></div></aside></div>
}
