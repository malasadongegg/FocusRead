import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Clock3, Volume2, VolumeX, X } from 'lucide-react'
import type { AudioProfile } from '../../types'
import type { AmbientSettings } from '../../lib/ambientAudio'
import './ambient.css'

const profiles: { id: AudioProfile; label: string; description: string }[] = [
  { id: 'white', label: 'White', description: 'Even, bright noise' },
  { id: 'pink', label: 'Pink', description: 'Soft, balanced noise' },
  { id: 'brown', label: 'Brown', description: 'Deep, warm noise' },
  { id: 'rain', label: 'Rain', description: 'Gentle rainfall' },
  { id: 'silence', label: 'Silence', description: 'No sound' },
]

export default function AmbientAudio({ settings, readingPlaying, active, error, onToggle, onProfile, onChange }: {
  settings: AmbientSettings; readingPlaying: boolean; active: boolean; error: string | null
  onToggle: () => void; onProfile: (profile: AudioProfile) => void; onChange: (patch: Partial<AmbientSettings>) => void
}) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const audible = active && !settings.muted && settings.profile !== 'silence' && (!settings.pauseWithReading || readingPlaying)
  const enabled = active && !settings.muted && settings.profile !== 'silence'
  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => { if (root.current && !root.current.contains(event.target as Node)) setOpen(false) }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', outside)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
  }, [open])
  return <div className="ambient-root" ref={root}>
    <button className={`ambient-trigger ${audible ? 'is-on' : ''}`} aria-label="Ambient audio settings" aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen(value => !value)}>
      {audible ? <Volume2 size={17}/> : <VolumeX size={17}/>}<span>Ambient audio</span><ChevronDown size={14} className={open ? 'chevron-up' : ''}/>
    </button>
    {open && <div className="ambient-popover" role="dialog" aria-label="Ambient audio settings">
      <div className="ambient-head"><div><strong>Ambient audio</strong><small>Made on your device · works offline</small></div><button className="ambient-close" aria-label="Close audio settings" onClick={() => setOpen(false)}><X size={16}/></button></div>
      <button className={`ambient-power ${enabled ? 'is-on' : ''}`} aria-label={enabled ? 'Mute ambient audio' : 'Turn on ambient audio'} onClick={onToggle} disabled={settings.profile === 'silence'}>
        {audible ? <Volume2 size={18}/> : <VolumeX size={18}/>}<span>{settings.profile === 'silence' ? 'Choose a sound to begin' : audible ? 'Sound on · tap to mute' : active && !settings.muted && settings.pauseWithReading && !readingPlaying ? 'Paused with reading' : 'Turn on ambient audio'}</span>
      </button>
      {error && <p className="ambient-error" role="alert">{error}</p>}
      <div className="ambient-label">SOUND PROFILE</div><div className="ambient-profiles">{profiles.map(profile => <button key={profile.id} className={settings.profile === profile.id ? 'selected' : ''} aria-pressed={settings.profile === profile.id} onClick={() => onProfile(profile.id)}><strong>{profile.label}</strong><small>{profile.description}</small></button>)}</div>
      <label className="ambient-volume"><span>Volume <strong>{settings.volume}%</strong></span><input aria-label="Ambient volume" type="range" min="0" max="100" value={settings.volume} onChange={event => onChange({ volume: +event.target.value })}/></label>
      <label className="ambient-check"><span>Pause sound when reading pauses</span><input type="checkbox" checked={settings.pauseWithReading} onChange={event => onChange({ pauseWithReading: event.target.checked })}/></label>
      <label className="ambient-timer"><span><Clock3 size={15}/> Auto turn off</span><select aria-label="Ambient audio timer" value={settings.timerMinutes} onChange={event => onChange({ timerMinutes: +event.target.value })}><option value="0">Off</option>{[5,10,15,30,60].map(minutes => <option key={minutes} value={minutes}>{minutes} min</option>)}</select></label>
      <p className="ambient-note">The timer starts when you turn sound on. It also runs while reading is paused.</p>
    </div>}
  </div>
}
