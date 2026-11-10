# Flock & Key

A Hebrew typing and spelling mystery for a child aged 12. The playable prototype contains one story chapter, four mini-games, 120 useful words, prerecorded Hebrew speech, six original background music loops, local progress, cosmetic rewards and a parent dashboard with JSON/CSV export.

## Run on Windows

Install Git and Node.js 24 LTS (npm included). From the repository in PowerShell:

```powershell
npm ci
npm run dev
```

Open http://localhost:5173 and choose **יוצאים לחקירה**. The chapter connects sign painting, following tracks, reconstructing letters and an optional pace challenge. You can also enter each mini-game directly. Help and skipping remain free; speed never blocks story completion.

Use a physical Hebrew keyboard. Music and speech have separate controls. Each stage picks a random background track, avoiding an immediate repeat; task changes and pause/resume keep the chosen music. The first interaction enables browser audio. Progress and purchased decorations survive refresh in the same browser profile and origin. **להורים** opens the local results dashboard and export controls. Export does not yet provide in-game restore/import.

The chapter targets 12–15 minutes, but its actual duration, enjoyment and learning effect still need testing with the child. Replay rotates spelling vocabulary and revisits difficult words. Short recall after seeing a word is tracked separately from independent spelling.

## Commands

- `npm run dev` — Vite development server with hot reload.
- `npm run typecheck` — strict TypeScript checking.
- `npm test` — learning, content and persistence tests.
- `npm run build` — typecheck and production output in `dist/`.
- `npm run preview` — serve the production build locally.
- `npx playwright install chromium` then `npm run test:e2e` — browser integration tests. On Linux, Chromium may also require system libraries (`npx playwright install-deps chromium`).

The dev/preview server listens on all interfaces. For loopback only, run `npm run dev -- --host 127.0.0.1`. Keep the same hostname and port when checking saved progress.

## Architecture and content

| Path | Responsibility |
| --- | --- |
| `src/app/` | React story/task state and navigation |
| `src/components/` | Real HTML input, Hebrew keyboard, parent dashboard and Phaser lifecycle |
| `src/game/` | Illustrated world and typed visual commands |
| `src/typing/` | Pure validation, edit metrics, comparison, scoring and content selection |
| `src/content/` | Chapter, prizes and authored Hebrew vocabulary |
| `src/progress/` | Versioned local progress, validation and export |
| `src/audio/` | Local playback, speech ducking and cleanup |
| `public/audio/` | Bundled speech and original music, with provenance notes |
| `docs/design/` | Original supplied GDD, preserved intact |

React owns all learning state and text input. Phaser draws the world; global keyboard capture is disabled. No account, backend, remote font, runtime AI or remote speech service is required. Static assets are served with the application; this version does not install an offline service worker.

The lockfile is preserved. See [architecture](docs/architecture.md), [product decisions](docs/prototype-decisions.he.md), [chapter script and four worked examples](docs/chapter-one.he.md), and [roadmap](docs/roadmap.md).

## Audio preparation

The speech clips are already included. `python3 scripts/prepare-speech.py` prepares missing clips using a build-time network request with authored vocabulary only. `python3 scripts/prepare-music.py` regenerates all six original background tracks. See [audio provenance](public/audio/README.md). Human review of Hebrew pronunciation is still needed.
