import { useCallback, useRef, useState } from 'react'

/** Feeds a polite live region. Repeating a message toggles a trailing space so screen readers speak it again. */
export function useAnnouncer() {
  const [message, setMessage] = useState('')
  const toggle = useRef(false)
  const announce = useCallback((text: string) => { toggle.current = !toggle.current; setMessage(toggle.current ? text : `${text} `) }, [])
  return { message, announce }
}
