import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BarChart3, BookOpen, Check, ChevronLeft, Clock3, Command, Expand, Focus, Maximize2, Moon, Settings2, Sun } from 'lucide-react'
import TextEditor from './components/TextEditor/TextEditor'
import Reader from './components/Reader/Reader'
import WPMControl from './components/WPMControl/WPMControl'
import PlaybackControls from './components/PlaybackControls/PlaybackControls'
import ProgressBar from './components/ProgressBar/ProgressBar'
import Settings from './components/Settings/Settings'
import Stats from './components/Stats/Stats'
import { ReadingTracker } from './lib/stats'
import AmbientAudio from './components/AmbientAudio/AmbientAudio'
import { AmbientAudioEngine, type AmbientSettings } from './lib/ambientAudio'
import { PlaybackEngine, type PlaybackState } from './lib/playbackEngine'
import { tokenize } from './lib/tokenizer'
import { formatTime, msPerWord, tokenDuration } from './lib/readingTime'
import { defaults } from './lib/defaults'
import { readPreferences, readSession, writeLocal } from './lib/storage'
import { clearReadings, deleteDocument, getDocument, getDraft, listDocuments, listReadings, migrateLegacyLibrary, putDocument, putDocuments, putDraft, putReadings } from './lib/library'
import { createLibraryBackup, mergeDocuments, parseBackupReadings, parseLibraryBackup } from './lib/libraryBackup'
import type { AudioProfile, DocumentRecord, Mode, Preferences, ReadingRecord, Session } from './types'

const newId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`

export default function App() {
  const [settings, setSettings] = useState<Preferences>(() => readPreferences(defaults))
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [sessionDocumentId, setSessionDocumentId] = useState('draft')
  const [libraryStatus, setLibraryStatus] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [view, setView] = useState<'editor' | 'reader'>('editor')
  const [showSettings, setShowSettings] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [readings, setReadings] = useState<ReadingRecord[]>([])
  const [showResume, setShowResume] = useState(() => { const session = readSession(); return Boolean(session && !session.complete) })
  const [savedNotice, setSavedNotice] = useState(false)
  const [systemDark, setSystemDark] = useState(() => !matchMedia('(prefers-color-scheme: light)').matches)
  const [playback, setPlayback] = useState<PlaybackState>({ index: 0, playing: false, complete: false, elapsedMs: 0 })
  const [audioReady, setAudioReady] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const tokens = useMemo(() => tokenize(text), [text])
  const engineRef = useRef<PlaybackEngine | null>(null)
  const trackerRef = useRef(new ReadingTracker())
  const live = useRef({ settings, sessionDocumentId, title })
  live.current = { settings, sessionDocumentId, title }
  if (!engineRef.current) engineRef.current = new PlaybackEngine(settings, state => {
    const { settings: s, sessionDocumentId: id, title: name } = live.current
    trackerRef.current.feed(state, s.mode === 'chunk' ? s.chunkSize : 1)
    setPlayback(state)
    if (!state.playing) {
      const record = trackerRef.current.take(id, name.trim() || 'Untitled document')
      if (record) { setReadings(previous => [...previous, record]); void putReadings([record]).catch(() => setLibraryStatus('Reading history could not be saved on this device.')) }
    }
  })
  const engine = engineRef.current
  const patchSettings = useCallback((patch: Partial<Preferences>) => setSettings(previous => ({ ...previous, ...patch })), [])
  const audioRef = useRef<AmbientAudioEngine | null>(null)
  if (!audioRef.current) audioRef.current = new AmbientAudioEngine(() => { patchSettings({ audioMuted: true }); setAudioReady(false) })
  const audioEngine = audioRef.current
  const audioSettings = useMemo<AmbientSettings>(() => ({ profile: settings.audioProfile, volume: settings.audioVolume, muted: settings.audioMuted, pauseWithReading: settings.audioPauseWithReading, timerMinutes: settings.audioTimerMinutes }), [settings.audioProfile, settings.audioVolume, settings.audioMuted, settings.audioPauseWithReading, settings.audioTimerMinutes])

  useEffect(() => { engine.update(settings); writeLocal('preferences', settings) }, [engine, settings])
  useEffect(() => { audioEngine.update(audioSettings, playback.playing) }, [audioEngine, audioSettings, playback.playing])
  useEffect(() => { if (view === 'editor') { audioEngine.destroy(); setAudioReady(false) } }, [view, audioEngine])
  useEffect(() => () => audioEngine.destroy(), [audioEngine])
  useEffect(() => { window.scrollTo(0, 0) }, [view])
  useEffect(() => {
    let cancelled = false
    void listReadings().then(items => { if (!cancelled) setReadings(items) }).catch(() => {})
    void migrateLegacyLibrary().then(listDocuments).then(items => { if (!cancelled) setDocuments(items) }).catch(() => { if (!cancelled) setLibraryStatus('Local library is unavailable in this browser.') })
    return () => { cancelled = true }
  }, [])
  useEffect(() => { if (view === 'reader') writeLocal('session', { documentId: sessionDocumentId, index: playback.index, elapsedMs: playback.elapsedMs, updatedAt: Date.now(), complete: playback.complete } satisfies Session) }, [view, sessionDocumentId, playback.index, playback.elapsedMs, playback.complete])
  useEffect(() => { const query = matchMedia('(prefers-color-scheme: light)'); const change = () => setSystemDark(!query.matches); query.addEventListener('change', change); return () => query.removeEventListener('change', change) }, [])
  useEffect(() => { const onVisibility = () => { if (document.hidden) engine.pause() }; document.addEventListener('visibilitychange', onVisibility); return () => document.removeEventListener('visibilitychange', onVisibility) }, [engine])
  useEffect(() => () => engine.destroy(), [engine])

  const saveDocument = useCallback(async () => {
    if (!text.trim()) return
    const id = documentId ?? newId()
    const record = { id, title: title.trim() || 'Untitled document', text, updatedAt: Date.now() }
    try {
      await putDocument(record)
      setDocumentId(id)
      setDocuments(previous => [record, ...previous.filter(item => item.id !== id)])
      setLibraryStatus(null); setSavedNotice(true); setTimeout(() => setSavedNotice(false), 2200)
    } catch { setLibraryStatus('Could not save this document on this device.') }
  }, [documentId, text, title])
  const startReading = async () => {
    if (!tokens.length) return
    const stored = documents.find(item => item.id === documentId)
    const useSaved = stored?.text === text && stored.title === (title.trim() || 'Untitled document')
    if (useSaved && stored) setSessionDocumentId(stored.id)
    else {
      try { await putDraft({ title, text, updatedAt: Date.now() }); setSessionDocumentId('draft') }
      catch { setLibraryStatus('Reading works, but this draft could not be saved for later.') }
    }
    engine.load(tokens)
    setView('reader'); setShowResume(false)
    if (settings.fullscreenPreference) void document.documentElement.requestFullscreen?.().catch(() => {})
  }
  const openDocument = (doc: DocumentRecord) => { engine.pause(); setDocumentId(doc.id); setTitle(doc.title); setText(doc.text); setView('editor') }
  const resumeSession = async () => {
    const session = readSession(); if (!session) return
    try {
      await migrateLegacyLibrary()
      const restored = session.documentId === 'draft' ? await getDraft() : await getDocument(session.documentId)
      if (!restored) throw new Error('The saved reading could not be found on this device.')
      setSessionDocumentId(session.documentId)
      setDocumentId(session.documentId === 'draft' ? null : session.documentId)
      setTitle(restored.title); setText(restored.text)
      engine.load(tokenize(restored.text), session.index, session.elapsedMs); setView('reader')
    } catch { setLibraryStatus('The saved reading could not be restored on this device.') }
    setShowResume(false)
  }
  const removeDocument = async (id: string) => {
    try { await deleteDocument(id); setDocuments(previous => previous.filter(item => item.id !== id)); if (documentId === id) setDocumentId(null); setLibraryStatus(null) }
    catch { setLibraryStatus('Could not delete this document.') }
  }
  const exportLibrary = async () => {
    try {
      const source = createLibraryBackup(await listDocuments(), await listReadings())
      const url = URL.createObjectURL(new Blob([source], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url; link.download = `focusread-library-${new Date().toISOString().slice(0, 10)}.json`
      document.body.append(link); link.click(); link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 30000)
      setLibraryStatus('Library backup downloaded to this device.')
    } catch { setLibraryStatus('Could not export the library.') }
  }
  const importBackup = async (file: File) => {
    try {
      if (file.size > 100 * 1024 * 1024) throw new Error('The backup is too large to import.')
      const imported = parseLibraryBackup(await file.text())
      const merged = mergeDocuments(await listDocuments(), imported)
      const text = await file.text()
      const importedReadings = parseBackupReadings(text)
      await putDocuments(merged)
      if (importedReadings.length) { await putReadings(importedReadings); setReadings(await listReadings()) }
      setDocuments(merged); setLibraryStatus(`Imported ${imported.length} document${imported.length === 1 ? '' : 's'}.`)
    } catch (error) { setLibraryStatus(error instanceof Error ? error.message : 'Could not import the backup.') }
  }
  const toggleFullscreen = () => { if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen?.().catch(() => {}) }
  const toggleAudio = async () => {
    if (!audioSettings.muted && audioEngine.isActivated) { patchSettings({ audioMuted: true }); setAudioReady(false); return }
    const next = { ...audioSettings, muted: false }
    patchSettings({ audioMuted: false }); setAudioError(null)
    try { await audioEngine.activate(next, playback.playing); setAudioReady(audioEngine.isActivated) }
    catch { patchSettings({ audioMuted: true }); setAudioReady(false); setAudioError('Audio could not start in this browser.') }
  }
  const chooseAudioProfile = (profile: AudioProfile) => {
    patchSettings({ audioProfile: profile })
    if (profile === 'silence') { setAudioReady(false); return }
    if (!audioSettings.muted && audioEngine.isActivated) { setAudioReady(true); return }
    if (!audioSettings.muted && !audioEngine.isActivated) {
      void audioEngine.activate({ ...audioSettings, profile }, playback.playing).then(() => setAudioReady(audioEngine.isActivated)).catch(() => setAudioError('Audio could not start in this browser.'))
    }
  }
  const dark = settings.theme === 'dark' || (settings.theme === 'system' && systemDark)
  const setWpm = (wpm: number) => patchSettings({ wpm })
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (view !== 'reader' || event.altKey || event.ctrlKey || event.metaKey || event.target instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName) || event.target.isContentEditable)) return
      const key = event.key.toLowerCase()
      if ([' ', 'arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'r', 'f'].includes(key)) event.preventDefault()
      if (key === ' ') playback.playing ? engine.pause() : engine.play()
      if (key === 'arrowleft') engine.skip(-1)
      if (key === 'arrowright') engine.skip(1)
      if (key === 'arrowup') setWpm(Math.min(1500, settings.wpm + (settings.fineSpeed ? 1 : 10)))
      if (key === 'arrowdown') setWpm(Math.max(100, settings.wpm - (settings.fineSpeed ? 1 : 10)))
      if (key === 'r') engine.restart()
      if (key === 'f') toggleFullscreen()
      if (key === 'escape' && document.fullscreenElement) void document.exitFullscreen()
    }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [view, playback.playing, engine, settings.wpm, settings.fineSpeed])

  const durationSuffix = useMemo(() => {
    if (!settings.punctuation) return null
    const suffix = new Float64Array(tokens.length + 1)
    for (let i = tokens.length - 1; i >= 0; i--) suffix[i] = suffix[i + 1] + tokenDuration(tokens, i, settings)
    return suffix
  }, [tokens, settings])
  const estimated = durationSuffix?.[0] ?? tokens.length * msPerWord(settings.wpm)
  const remaining = playback.complete ? 0 : durationSuffix?.[playback.index] ?? Math.max(0, tokens.length - playback.index) * msPerWord(settings.wpm)
  const effectiveWpm = estimated ? Math.round(tokens.length / (estimated / 60000)) : settings.wpm
  const modes: { id: Mode; label: string }[] = [{ id: 'rsvp', label: 'RSVP' }, { id: 'chunk', label: 'Chunk' }, { id: 'traditional', label: 'Traditional' }]
  return <div className={`app-shell ${dark ? 'theme-dark' : 'theme-light'} ${settings.reducedMotion ? 'reduce-motion' : ''}`} style={{ '--accent': settings.accentColor, '--reader-bg': settings.backgroundColor } as React.CSSProperties}>
    <header className="site-header"><button className="brand" onClick={() => { engine.pause(); setView('editor') }} aria-label="FocusRead home"><span className="brand-icon"><Focus size={22} strokeWidth={2.5}/></span><span>Focus<span>Read</span><small>™</small></span></button><div className="header-right"><span className="privacy-note"><span/> 100% PRIVATE · STORED ON THIS DEVICE</span>{view === 'reader' && <button className="header-action" onClick={toggleFullscreen} aria-label="Toggle fullscreen"><Maximize2 size={17}/></button>}<button className="header-action" aria-label="Open statistics" onClick={() => setShowStats(true)}><BarChart3 size={18}/></button><button className="header-action" aria-label="Open settings" onClick={() => setShowSettings(true)}><Settings2 size={18}/></button><span className="avatar">FR</span></div></header>
    {view === 'editor' ? <main className="home-main"><div className="hero-intro"><div className="hero-kicker"><span className="sparkle">✦</span> A BETTER WAY TO READ</div><h1>Read at the speed<br/>of <em>thought.</em></h1><p>A quieter space for deeper focus. Your words, your pace, your flow.</p></div>{showResume && <div className="resume-banner"><div><BookOpen size={18}/><span>You have a reading session in progress.</span></div><button onClick={resumeSession}>Resume session <ChevronLeft size={16}/></button><button className="dismiss" aria-label="Dismiss resume prompt" onClick={() => setShowResume(false)}>×</button></div>}<TextEditor title={title} text={text} documents={documents} wordCount={tokens.length} duration={estimated} libraryStatus={libraryStatus} onTitle={setTitle} onText={setText} onSave={() => { void saveDocument() }} onOpen={openDocument} onDelete={id => { void removeDocument(id) }} onStart={() => { void startReading() }} onExport={() => { void exportLibrary() }} onImportBackup={file => { void importBackup(file) }}/><div className="home-bottom"><div className="speed-card"><div className="card-heading"><Clock3 size={17}/><span>SET YOUR PACE</span></div><WPMControl value={settings.wpm} fine={settings.fineSpeed} onChange={setWpm}/></div><div className="tip-card"><span className="tip-symbol">✳</span><div><strong>A little focus goes a long way.</strong><p>Start at 300 WPM and adjust as you find your natural rhythm. You can change speed at any time.</p></div></div></div></main> : <main className="reading-main"><div className="reading-top"><button className="back-button" onClick={() => { engine.pause(); setView('editor') }}><ChevronLeft size={18}/> Back to editor</button><div className="reading-title"><span className="live-dot"/>{title || 'Untitled document'}</div><button className="reader-fullscreen" onClick={toggleFullscreen}><Expand size={17}/> Fullscreen</button></div><div className="reader-frame" style={{ backgroundColor: settings.backgroundColor }}><div className="mode-tabs" role="tablist" aria-label="Reading mode">{modes.map(mode => <button key={mode.id} role="tab" aria-selected={settings.mode === mode.id} className={settings.mode === mode.id ? 'selected' : ''} onClick={() => patchSettings({ mode: mode.id })}>{mode.label}</button>)}</div>{settings.mode === 'chunk' && <div className="chunk-size">Words per chunk <select aria-label="Words per chunk" value={settings.chunkSize} onChange={e => patchSettings({ chunkSize: +e.target.value })}>{[2,3,4,5].map(n => <option key={n}>{n}</option>)}</select></div>}<Reader tokens={tokens} index={playback.index} mode={settings.mode} settings={settings}/><div className="reader-frame-bottom"><span><span className="red-dot"/> {playback.complete ? 'SESSION COMPLETE' : playback.playing ? 'READING IN PROGRESS' : 'READY WHEN YOU ARE'}</span><span>FOCUS MODE <Command size={13}/></span></div></div><div className="control-panel"><ProgressBar index={playback.index} total={tokens.length} onSeek={index => engine.seek(index)}/><div className="controls-row"><div className="time-stat"><small>TIME REMAINING</small><strong>{formatTime(remaining)}</strong></div><PlaybackControls playing={playback.playing} onPlay={() => playback.playing ? engine.pause() : engine.play()} onPrevious={() => engine.skip(-1)} onNext={() => engine.skip(1)} onRestart={() => engine.restart()}/><div className="time-stat right"><small>TIME ELAPSED</small><strong>{formatTime(playback.elapsedMs)}</strong></div></div><div className="reader-speed"><WPMControl compact value={settings.wpm} fine={settings.fineSpeed} onChange={setWpm}/><div className="speed-detail"><span>{Math.round(60000 / settings.wpm)} ms / word</span>{settings.punctuation && <span>~{effectiveWpm} effective WPM</span>}<span>{Math.max(0,tokens.length - playback.index - 1).toLocaleString()} words left</span></div><AmbientAudio settings={audioSettings} readingPlaying={playback.playing} active={audioReady} error={audioError} onToggle={() => { void toggleAudio() }} onProfile={chooseAudioProfile} onChange={patch => patchSettings({ audioVolume: patch.volume ?? settings.audioVolume, audioPauseWithReading: patch.pauseWithReading ?? settings.audioPauseWithReading, audioTimerMinutes: patch.timerMinutes ?? settings.audioTimerMinutes })}/></div></div><div className="shortcut-hint"><kbd>Space</kbd> Play / Pause <kbd>←</kbd><kbd>→</kbd> Skip word <kbd>↑</kbd><kbd>↓</kbd> Adjust speed <kbd>R</kbd> Restart <kbd>F</kbd> Fullscreen</div></main>}
    <footer className="site-footer"><span>© 2026 FocusRead. Made for the moments that matter.</span><span>{dark ? <Moon size={13}/> : <Sun size={13}/>} {dark ? 'Dark' : 'Light'} mode <span className="footer-divider">·</span> No accounts. No distractions.</span></footer>
    {savedNotice && <div className="toast"><Check size={17}/> Saved on this device</div>}{showStats && <Stats records={readings} goal={settings.dailyGoalWords} onGoal={dailyGoalWords => patchSettings({ dailyGoalWords })} onClear={() => { void clearReadings().then(() => setReadings([])).catch(() => setLibraryStatus('Could not clear reading history.')) }} onClose={() => setShowStats(false)}/>}{showSettings && <Settings settings={settings} onChange={patchSettings} onClose={() => setShowSettings(false)}/ >}
  </div>
}
