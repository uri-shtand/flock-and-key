# Flock & Key

A Hebrew typing and spelling mystery for a child aged 12. The playable prototype contains one story chapter, four mini-games, 120 useful words, prerecorded Hebrew speech, six original background music arrangements, local progress, cosmetic rewards and a parent dashboard with JSON/CSV export.

## Run on Windows

Install Git and Node.js 24 LTS (npm included). From the repository in PowerShell:

```powershell
npm ci
npm run dev
```

Open http://localhost:5173 and choose **יוצאים לחקירה**. The chapter connects sign painting, following tracks, reconstructing letters and an optional pace challenge. You can also enter each mini-game directly. Help and skipping remain free; speed never blocks story completion.

Choose difficulty 1–3 during the preparation step at the start of each mini-game, including each stage of the chapter. Each game remembers its own suggested level locally. Completing at least 80% of its words correctly on the first submission without spelling hints or copying suggests the chosen level plus one next time (maximum 3); lower scores keep the previous suggestion. Spelling recall probes are excluded. You can always override the suggestion. Saved runs retain their exact tasks and level.

Home and child-facing gameplay fit desktop viewports without scrolling, including 1024×600, 1280×720 and 1440×900. Keyboard help is beside the task, and pace selection accompanies difficulty in preparation.

Use a physical Hebrew keyboard. Music and speech have separate controls. Each stage picks a random background track, avoiding an immediate repeat; task changes and pause/resume keep the chosen music. The first interaction enables browser audio. **מנגינה אחרת** changes the current tune. The arrangements include a light rhythm, a quieter bridge and a return, instead of repeating a short motif. Progress and purchased decorations survive refresh in the same browser profile and origin. **להורים** opens the local results dashboard and export controls. Export does not yet provide in-game restore/import.

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

React owns all learning state and text input. Phaser draws the world in the first four mini-games; the standalone fifth prototype currently uses React/SVG layers. Global keyboard capture is disabled. No account, backend, remote font, runtime AI or remote speech service is required. Static assets are served with the application; this version does not install an offline service worker.

The lockfile is preserved. See [architecture](docs/architecture.md), [product decisions](docs/prototype-decisions.he.md), [chapter script and four worked examples](docs/chapter-one.he.md), and [roadmap](docs/roadmap.md).

For future game design, see the [mechanics research catalogue](docs/mechanics-research.md): 64 candidates from 43 games/series, covering Gates, new mini-games, conversations and the village mystery, with proposed experiments and fun-test questions.

The fifth mini-game, **שומרי השערים** (home → **שומרי השערים**), has five selectable rounds: picnic, flowers, wool parade, wind and a pajama party. It starts with four controlled gates and unlocks the existing pen/shortcut gates in later rounds: **4 → 5 → 6 → 7 → 9 gates**. Two identifiable groups (○ flowers and ★ stars) take different routes and gate orders, then reverse their own routes home. Later rounds share crossings; groups wait their turn there. Patterned trails, sheep badges and next-gate cards identify each group. Default flock size stays at four sheep. Level 1 moves at 160 world units/second for a gentler introduction; levels 2–5 use 175. The idle opening window is **2 seconds**, with a 0.45-second shared actuator. Gate letters follow physical home-row order from left to right: ש, ד, ג, כ, ע, י, ח, ל, ך. Level 1 uses ד/ג/ע/ל; כ/ח/י/ש/ך join as gates unlock. Every gate keeps its letter across levels. The on-screen home row, countdown bars and optional next-gate guidance remain available. Free help and level selection always work; score and medals never block completion.

The SVG farm includes themed costumes, scenery and vector accents, sheep banter, butterflies, the established charcoal-and-tan Pitsi dog, and a vintage truck-style H-pattern gear lever. Each gate has a fixed labeled position, with animated shifts through neutral and the last selection retained. After reaching pasture, a 2.4-second dusk transition starts the return automatically. Press **Esc** to pause an active Gates round; use **ממשיכים** to resume. Pause and reduced motion are supported. **מעבדת הכיף** opens the small tuning dialog: choose a level, change pace, flock size, gate duration and gearbox duration, toggle guidance/motion, try calm/quick presets, restore defaults, or copy JSON settings. Applying settings starts a new round.

Gates saves its current round, effective settings and best medals in a separate versioned local key. Refresh or returning from home resumes paused; it does not alter word-game learning results or currency. Saves from the earlier routes restart at the updated level with medals and help/motion preferences retained. Gates results are not yet included in the parent dashboard/export/reset. All agent-managed tests use port **5186**; port 5173 remains reserved for your development server.

See the [group routes, implementation and playtest questions](docs/gates-groups.md), the [playtest revision and previous balance](docs/gates-playtest-revision.md), and the earlier [polish plan, implementation record, tuning guide and playtest questions](docs/gates-polish.md). The [original Gates design](docs/minigame-five.he.md), [earlier architecture](docs/minigame-five-architecture.he.md), [map decisions](docs/minigame-five-map.he.md) and [earlier build plan](docs/minigame-five-build-plan.he.md) remain as references; multi-key commands, Phaser migration and parent reporting are future work.

## Audio preparation

The speech clips are already included. `python3 scripts/prepare-speech.py` prepares missing clips using a build-time network request with authored vocabulary only. `python3 scripts/prepare-music.py` regenerates all six original background tracks. See [audio provenance](public/audio/README.md). Human review of Hebrew pronunciation is still needed.
