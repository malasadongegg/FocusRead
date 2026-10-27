import { useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import { PlaybackEngine, type PlaybackState } from '../../lib/playbackEngine'
import { defaults } from '../../lib/defaults'
import { splitOrp } from '../../lib/orp'
import { tokenize } from '../../lib/tokenizer'

const sample = 'Find your focus. Let every word meet you where you already are.'

export default function HeroDemo() {
  const tokens = useMemo(() => tokenize(sample), [])
  const [wpm, setWpm] = useState(300)
  const [playback, setPlayback] = useState<PlaybackState>({ index: 0, playing: false, complete: false, elapsedMs: 0 })
  const engineRef = useRef<PlaybackEngine | null>(null)
  if (!engineRef.current) engineRef.current = new PlaybackEngine({ ...defaults, wpm }, setPlayback)
  const engine = engineRef.current
  useEffect(() => { engine.load(tokens); return () => engine.destroy() }, [engine, tokens])
  useEffect(() => { engine.update({ ...defaults, wpm }) }, [engine, wpm])
  useEffect(() => {
    const onVisibility = () => { if (document.hidden) engine.pause() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [engine])
  const word = tokens[playback.index]?.text ?? ''
  const { before, focal, after } = splitOrp(word)
  return <div className="hero-preview hero-demo" aria-label="Interactive FocusRead demonstration">
    <div className="preview-top"><span className="preview-live"><i/> TRY THE READER</span><span>{wpm} WPM</span></div>
    <div className="demo-center"><div className="demo-guide" aria-hidden="true"/><div className="demo-word" role="text" aria-label={word} aria-live="off"><span aria-hidden="true">{before}</span><b aria-hidden="true">{focal}</b><span aria-hidden="true">{after}</span></div><p>Keep your gaze at the center.</p></div>
    <div className="demo-controls"><button type="button" aria-label={playback.playing ? 'Pause demo' : playback.complete ? 'Replay demo' : 'Play demo'} onClick={() => playback.playing ? engine.pause() : engine.play()} className="demo-play">{playback.playing ? <Pause size={17} fill="currentColor"/> : <Play size={17} fill="currentColor"/>}<span>{playback.playing ? 'Pause' : playback.complete ? 'Replay' : 'Play demo'}</span></button><button type="button" aria-label="Restart demo" onClick={() => engine.restart()}><RotateCcw size={16}/></button><button type="button" aria-label="Next demo word" onClick={() => engine.skip(1)}><SkipForward size={16}/></button><label><span>PACE</span><input aria-label="Demo speed" type="range" min="150" max="600" step="10" value={wpm} onChange={event => setWpm(+event.target.value)}/></label></div>
    <div className="demo-progress"><span style={{ width: `${(playback.index + 1) / tokens.length * 100}%` }}/></div>
    <div className="preview-bottom"><span>RSVP · FIXED FOCAL POINT</span><span>{String(playback.index + 1).padStart(2, '0')} / {String(tokens.length).padStart(2, '0')}</span></div>
  </div>
}
