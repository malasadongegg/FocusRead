# FocusRead

Private, installable RSVP speed reading with a fixed focal letter, chunk and traditional modes, and deadline-based playback. The same static build runs locally or on Vercel.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually http://localhost:5173.

```bash
npm run build    # TypeScript check and offline static build in dist/
npm run preview  # Serve the production build locally
npm run test     # Vitest and React Testing Library
```

The built app can be installed as a PWA. After its first successful online load and service worker cache, it works offline, including the bundled audio worker. Documents and the resumable draft stay in IndexedDB. Only preferences and small session metadata stay in LocalStorage. No account, backend, analytics, remote fonts, or APIs are used.

## Library backup

Use **Export library** in the Saved documents panel to download a versioned JSON backup. Use **Import backup** to restore it on this or another device. An import merges by document ID and keeps the newer copy. Reading material is read and written inside the browser; it is never uploaded. Exported backups contain the full saved document text, so store them where you trust. Clearing site storage can erase the local library, and it does not synchronize automatically between devices.

Existing FocusRead libraries from the original LocalStorage version are migrated to IndexedDB on first load. The original LocalStorage document array is removed only after a successful migration.

## Install and offline use

Open the deployed site while online, let it finish loading, then use your browser's **Install app** or **Add to Home Screen** action. FocusRead precaches its HTML, styles, JavaScript, audio worker, icons, and manifest. Offline navigations return the app shell. Browser updates download in the background and show a **Reload to update** prompt; an active reading session is never reloaded automatically. The first installation and each update need an internet connection. Service workers require HTTPS or localhost.

## Deploy with GitHub and Vercel

1. Push the `focusread` project to a GitHub repository. If it is inside a larger repository, select `focusread` as Vercel's **Root Directory**.
2. In Vercel, choose **Add New Project**, import the repository, and select the **Vite** framework preset.
3. Confirm **Build Command** `npm run build` and **Output Directory** `dist`. The included `vercel.json` sets these values and serves existing static files before rewriting other paths to `index.html` for SPA refreshes.
4. Deploy. No environment variables, API keys, server functions, database, or analytics integration are required.
5. Open the HTTPS deployment once online to install the PWA and cache its required files. Test an offline reload and, if desired, use Export library for a separate backup.

`npm run build` produces the deployable `dist/` directory. Use `npm run preview` to verify those exact production files locally before pushing or deploying. The app contains no production `localhost` references or external asset URLs.

## Reading

Paste text or import a `.txt` / `.md` file, set 100–1500 WPM, and choose **Start reading**. The player begins paused. Press Play or Space to advance automatically. Use the progress slider to seek. Switching RSVP, 2–5 word chunks, or traditional reading keeps your word position. Chunks consume one `60,000 / WPM` interval per word, so WPM always means total words per minute.

The focal letter uses the character at 40% of the letter span (after leading punctuation), clamped to a valid letter. A configurable offset shifts it. Three independently positioned segments keep that letter anchored at the exact center of the reading lane.

Punctuation pauses are off by default. When enabled, comma, sentence, and paragraph pauses add milliseconds to each word's normal `60,000 / WPM` duration. The reader then shows approximate effective WPM alongside nominal WPM.

Shortcuts outside form fields: Space play/pause, ←/→ previous/next, ↑/↓ speed, R restart, F fullscreen, Escape exit fullscreen. Hidden tabs pause playback so returning cannot race through missed words.

## Ambient audio

Open the speaker control in the reader's bottom toolbar. Choose white, pink, or brown noise, a locally synthesized rain ambience, or silence. Set the independent 0–100% volume slider, then select **Turn on ambient audio**. Sound never starts automatically, including after a saved session is restored. The profile, volume, mute state, reading-pause option, and timer choice are saved in LocalStorage.

Profile changes crossfade over 220 ms, and enabling or muting fades the sound. Noise and rain samples are generated in a bundled Web Worker so synthesis does not block the RSVP scheduler. The resulting short stereo buffers loop with a blended seam; there are no recordings, licenses, downloads, streams, or network requests. AudioContext and the worker are released when sound is muted or the reader closes. Pausing audio with reading is optional. The auto-off timer can be set to 5, 10, 15, 30, or 60 minutes; it measures wall time from when sound is turned on, including time spent paused.
