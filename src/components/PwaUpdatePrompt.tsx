import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { registerSW } from 'virtual:pwa-register'

/** A waiting update never interrupts an active reading session. */
export default function PwaUpdatePrompt() {
  const [available, setAvailable] = useState(false)
  const update = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null)
  useEffect(() => {
    if (!import.meta.env.PROD) return
    update.current = registerSW({ immediate: true, onNeedRefresh: () => setAvailable(true) })
  }, [])
  if (!available) return null
  return <div className="pwa-update" role="status"><RefreshCw size={17}/><span>A new FocusRead version is ready.</span><button onClick={() => { void update.current?.(true) }}>Reload to update</button></div>
}
