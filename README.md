# FocusRead

Private, installable RSVP speed reading with a fixed focal letter, chunk and traditional modes, and deadline-based playback. The same static build runs locally or on Vercel.

## Website pages

The product homepage lives at `/` and includes an interactive RSVP demonstration. `/app` is the reading workspace. `/features` explains the reading modes and controls; `/progress` shows only history saved on the current device; `/privacy` describes local storage and backups; `/docs` contains the in-app user and deployment guide. The static Vite build and `vercel.json` serve these paths through one offline-capable app shell.

The website links to the reader without creating an account or sending pasted text to a server. Product-page examples use bundled sample copy and never enter the user's library.

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
npx playwright install chromium  # One-time browser setup for end-to-end tests
npm run test:e2e # Browser reading, recovery, mobile anchor, and offline tests
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

In Settings, choose fixed pacing, a ramp from 65% to the selected WPM, or experimental adaptive pacing based on word length. The selected WPM is the target in those modes; the effective WPM estimate reflects the changing pace and optional pauses. A 3, 5, or 10 second countdown can start before each Play action. Theme presets and individual typography and focal settings are saved locally. The reader's Focus mode hides surrounding controls until you use **Exit focus mode** or press D.

Guided practice uses the text already in the editor. Set a target WPM and an active reading time of 2, 5, or 10 minutes; it ramps toward the target and pauses when the time or text ends. The optional comprehension self-check asks for a summary and recalled details. It does not grade reading ability, and answers disappear when the panel closes. Local statistics include recent sessions, a seven-day chart, a daily word goal, and a streak. History stores session metadata without copying reading text.

Shortcuts outside form fields: Space play/pause, ←/→ previous/next, ↑/↓ speed, R restart, F fullscreen, Escape exit fullscreen. Hidden tabs pause playback so returning cannot race through missed words.

Reader shortcuts also include D for Focus mode. Shortcuts are disabled while a dialog is open or a text field is active. Escape closes dialogs, and the active dialog keeps keyboard focus inside it.

## Ambient audio

Open the speaker control in the reader's bottom toolbar. Choose white, pink, or brown noise, a locally synthesized rain ambience, or silence. Set the independent 0–100% volume slider, then select **Turn on ambient audio**. Sound never starts automatically, including after a saved session is restored. The profile, volume, mute state, reading-pause option, and timer choice are saved in LocalStorage.

Profile changes crossfade over 220 ms, and enabling or muting fades the sound. Noise and rain samples are generated in a bundled Web Worker so synthesis does not block the RSVP scheduler. The resulting short stereo buffers loop with a blended seam; there are no recordings, licenses, downloads, streams, or network requests. AudioContext and the worker are released when sound is muted or the reader closes. Pausing audio with reading is optional. The auto-off timer can be set to 5, 10, 15, 30, or 60 minutes; it measures wall time from when sound is turned on, including time spent paused.

Audio also suspends while the browser tab is hidden and resumes when it becomes visible. Sound still requires an explicit user action before its first start.
