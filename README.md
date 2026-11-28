# Flock & Key

A Hebrew typing and spelling mystery for ages 9–14. The default game takes place at Kurort Rathen, a rural station on the Elbe. It includes a parcel mystery, four word games, an English rehearsal, a separate detective case, Gatekeepers, a local shop and a parent dashboard with JSON/CSV export.

## Run on Windows

Install Git and Node.js 24 LTS (npm included). From the repository in PowerShell:

```powershell
npm ci
npm run dev
```

Open http://localhost:5173 and choose **יוצאים לחקירה** to investigate parcel 27. **משחקונים** opens the station activities. Label storage boxes, restore postcards with the postman, follow Pitsi's clues, choose a courier route, direct the village rehearsal or find Noga. Gatekeepers is available from the same board. **חנות התחנה** previews new decorations before spending bells. Use a physical Hebrew keyboard for word games. The rehearsal provides a bilingual songbook.

Use **לחווה הקודמת ולשמירות שלה** to open the earlier farm edition. Its unfinished chapter, word game, detective case, rehearsal tracks and decorations remain available there. The editions share the bell balance, past learning results and parent dashboard. See [the station implementation notes](docs/design/rural-station-implementation.md) and [concept art](docs/design/rural-station-concept-art/README.md).

### Vocabulary design and concept gallery

Station home → **גלריית קונספט ארט** opens five new vocabulary-game concept illustrations. Choose a thumbnail or use previous/next; open the selected image at full size, or press Escape to return with focus restored. This is a view-only gallery, not five playable games, and browsing does not change learning progress or bells. It fits the same three desktop target sizes; narrower layouts can scroll.

The [five Hebrew game-design documents](docs/english-grade-7/vocabulary-games/README.md), [learning-studies synthesis](docs/english-grade-7/vocabulary-learning-studies.he.md) and [original product/mechanics research](docs/english-grade-7/vocabulary-mini-game-research.he.md) separate proposed learning mechanisms from implemented behavior. See [concept images, local AI provenance and remaining art limitations](docs/design/vocabulary-concept-art/README.md).

### Earlier farm edition

Open http://localhost:5173 and choose **יוצאים לחקירה**. The chapter currently connects sign painting and reconstructing letters. Tracks and Pitsi’s chase are temporarily hidden after playtest feedback that they were too easy and not interesting enough; their code and history are retained. A saved run inside either hidden game stays stored, with an explanatory home notice instead of resume. You can also enter each mini-game directly. Home keeps one save for the chapter and one for standalone word games, and shows the build time in Israel time. Help and skipping remain free; speed never blocks story completion.

Choose a difficulty during preparation, including each stage of the chapter. Crate painting has five levels and a 239-word copying bank, with eight distinct words per round. The other word games offer levels 1–3. Each game remembers its own suggested level locally. Completing at least 80% of its words correctly on the first submission without spelling hints or copying suggests the chosen level plus one next time (up to that game’s highest level); lower scores keep the previous suggestion. Spelling recall probes are excluded. You can always override the suggestion. Saved runs retain their exact tasks and level.

Home and child-facing gameplay fit desktop viewports without scrolling, including 1024×600, 1280×720 and 1440×900. Keyboard help is beside the task. In crate painting, illustrated hands show the resting pose and reach for the highlighted Hebrew key. Dad gives a brief cheer for each correct word. See [the crate iteration and playtest questions](docs/crate-typing.he.md). Pace selection accompanies difficulty in preparation.

The four word mini-games and Gates also support phone and tablet layouts in portrait and landscape. On mobile, **כלים וצלילים** opens audio and parent controls; optional keyboard help sits below the task. Tap the text field and use your phone's Hebrew keyboard, then the submit button or keyboard action. Gates uses large gate buttons, with level selection, help, tuning and home under **אפשרויות**; opening that menu freezes the simulation. Mobile pages and long dialogs can scroll. See [mobile behavior and playtest notes](docs/mobile-support.md).

Use a physical Hebrew keyboard. Music and speech have separate controls. Background music starts muted in a new profile. Each stage picks a different background track, and **מנגינה אחרת** cycles through the arrangements and shows the selected title. In the post office, stop an active recording with **דילוג על ההקראה** or skip the task with **דילוג על המילה**. Turning speech off gives a written word to copy. In crate painting, longer words pay more bells. The farm shop has 15 decorations across three pages. Progress and purchases survive refresh in the same browser profile and origin. **להורים** opens the local results dashboard and export controls. Export does not yet provide in-game restore/import.

The shortened chapter’s duration, enjoyment and learning effect still need testing with the child. Replay rotates spelling vocabulary and revisits difficult words. Short recall after seeing a word is tracked separately from independent spelling.

## Commands

- `npm run dev` — Vite development server with hot reload.
- `npm run typecheck` — strict TypeScript checking.
- `npm test` — learning, content and persistence tests.
- `npm run build` — typecheck and production output in `dist/`.
- `npm run preview` — serve the production build locally.
- `npx playwright install chromium` then `npm run test:e2e` — browser integration tests. On Linux, Chromium may also require system libraries (`npx playwright install-deps chromium`). If the default test port 5186 is busy, set `FLOCK_E2E_PORT` to a free port other than 5173.

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

## Small detective case: הטרמפ של נוגה

Home → **🔎 תיק בלשי קטן** opens a Hebrew point-and-click adventure on a full farm map. Click characters to talk, inspect objects and try things, choose sentences to keep in the illustrated **מחברת הרמזים**, and explicitly take objects into **תיק החפצים**. Both relevant clues and funny distractions can be collected. The notebook keeps each sentence and its source; inventory contains only objects that were taken.

**בוא ננסה לפתור** opens two boards: **מה קרה לנוגה?** and **איפה נוגה עכשיו?** Place three collected clues on each, mixing notes and objects. Drag them, or click a clue then an empty slot (also works by keyboard). Remove and replace clues freely. Checking a wrong connection keeps it available to revise; three free hints and **נחבר יחד** keep the story accessible. Visit the bridge and return to the farm in any order. There is no typing task, timer or score.

Conversations, observations, the notebook and inventory open over the world. Dialogs stop animation and trap/restore keyboard focus. Hotspot names appear on hover/focus by default; **אפשרויות** can show them all, suggest a first investigation or reduce motion. Applying settings explicitly starts a new case while retaining previous history; settings can be copied as JSON. Escape pauses from the map and closes an open dialog. Blur and refresh pause the case; **ממשיכים בחקירה** resumes it. OS reduced motion is respected.

Edition-2 cases use the existing shared local game save, isolated from typing/spelling and currency. Collected notes, objects and partial boards survive refresh through invariant-validated events. Older edition-1 cases remain in history and exports; opening from one explains that the revised adventure starts fresh. Parent reporting, JSON/CSV and the existing confirmed reset include both editions. No new audio service, account or runtime AI is used. See [the redesign, implementation and human playtest questions](docs/noga-adventure-redesign.he.md); the [earlier implementation](docs/detective-implementation.md) remains historical reference.

Manage shared work in [the task list](docs/tasks.he.md). See [the farm and opening iteration](docs/iteration-farm-and-openings.he.md) for the five new cosmetic options, paginated shop, hidden games and revised Noga opening.

## English mini-game — חזרה באסם

Home → **♫ חזרה באסם** opens an English rehearsal aimed at Israeli Grade 7. Choose from six tracks grouped into three temporary Phineas and Ferb songs from the supplied MP3s and three original farm recordings. Listen to a line or the whole song, and open the bilingual lyrics from any rehearsal screen. Answer listening, reading, vocabulary and grammar questions, then direct funny variations on the barn stage. The series lyrics were transcribed locally from the supplied recordings. Lines that need review are marked in the songbook. Progress stays local and appears in the parent dashboard and JSON export. See [the design and playtest questions](docs/english-grade-7/song-mini-game.he.md).
