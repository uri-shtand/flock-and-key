# Architecture decisions

The first four mini-games use the React/Phaser architecture described below. The fifth mini-game, **שומרי השערים**, currently has a standalone React/SVG prototype with a pure simulation and independently placed scenery assets. See [its current architecture and planned extensions](minigame-five-architecture.he.md), [game description](minigame-five.he.md), [map decisions](minigame-five-map.he.md), and [remaining build work](minigame-five-build-plan.he.md).

## Browser-first 2D

Phaser 4.2.1 renders the farm, trail, post office, animals and cosmetics using primitives. React owns story phases (`intro`, `warmup`, `play`, `clue`, `ending`), HTML input, keyboard help, audio preferences and all learning state. Vite builds strict TypeScript; Node 24 LTS is the development baseline. Production needs only a static web host.

The typed bridge accepts `world` (a visual snapshot: stage, step, total, equipment, reveal) and `celebrate`. Scenes do not check answers or duplicate task/progress state. A React mount creates one game and destroys it at cleanup, including StrictMode remounts. Phaser keyboard capture is disabled.

## Learning and authored content

`src/content/chapter.ts` defines story beats, four modes and cosmetic prices; `words.json` contains 120 unique words with sentences, topics, difficulty tags and local speech paths. Typing vocabulary and three cumulative difficulty pools are authored in `src/content/difficulty.ts`. Each typing stage selects eight distinct words, ordered by length, and uses a different seed. Difficulty 1 progresses from 2 to 4 letters, difficulty 2 from 3 to 6, and difficulty 3 from 4 to 10. Warmup introduces the keys used by that set; this is not the complete eight-unit curriculum. Spelling keeps the prerecorded vocabulary, with maximum lengths of 4, 5 and 7 respectively, topic diversity and history-based selection. Its first eight prompts are ordered by length and include a longest eligible word; two short-recall probes follow. Difficulty is a word-selection setting, separate from optional speed timing. All Hebrew and final-letter key positions are mapped in `KeyboardMap.ts`.

`Learning.ts` contains pure edit metrics, minimal-edit descriptions, vocabulary selection, rewards and comparable-trial lookup. Spelling trials are checked on submission; speed trials can finish automatically when the committed input matches. Correction does not erase past insertion errors. Physical codes are captured independently of input text. Composition is committed before validation or counting its final text. Paste/drop is marked as supported copying rather than independent spelling or typing evidence.

In spelling, the full visual keyboard can be opened without highlighting the next answer letter. This helps find physical keys without revealing spelling; keyboard use is recorded separately from spelling hints.

Spelling aid categories are independent, keyboard, hint, copy and short recall after a word was exposed earlier in the current session. Revealing a word persists separately from the input draft so refresh cannot turn copying into independent success. Recency tagging describes this session; it is not a research model of memory. Historical word results guide a broad-topic mix of difficult and new words. Full adaptive curricula remain outside this prototype.

Typing accuracy is `(inserted - incorrectInsertions) / inserted`. Rate is correct inserted characters per active minute; pasted trials are excluded from dashboard typing rates. Each submitted attempt records cumulative task metrics, so summaries take the latest attempt per task instead of double-counting corrections. Active task time pauses during speech, explicit pause, hidden tabs and unfocused windows. It is not a measure of finger movement time alone.

Session engagement time is recorded separately from task typing time. It includes listening and story dialogue while gameplay is visible and focused, and excludes explicit breaks, hidden tabs and time in parent/shop/home screens. The parent screen displays both values. Sampling is approximate at half-second intervals.

Input validation compares NFC-normalized text with outside whitespace trimmed. Internal spaces, diacritics, incorrect final letters and Latin input do not silently become accepted alternatives. Inputs are limited to 100 characters; paste and drop mark the trial as copying. Spelling aid is offered after submission, not during incremental input.

## Persistence, rewards and exports

`GameStore.ts` stores a version-2 local model: sessions (including active and interrupted sessions), exact task position, draft, hints/exposures, attempts, purchased/equipped prizes, balances, introduced key codes and preferences. Nested values are validated before use. Storage failures leave play usable and show a warning. An abandoned session is retained when a new run begins. Home navigation preserves the active session for resume.

Each completed task awards points once at completion. Basic completion receives 10 even with help; eligible accuracy/independent-first-attempt bonuses add 5. An optional timed improvement bonus needs a previous matching mode, word, aid and timing condition with high accuracy. Time pressure never gates progress. Prize purchase affects spendable balance, not historical earnings. These numbers are initial balance settings, to be revised after playtesting.

Parent summaries separate spelling from typing and retain raw submitted answers. Edit descriptions are heuristic alignment, not diagnoses. CSV cells are escaped and formula-like input neutralized. JSON retains the versioned full model; CSV is an attempt-level analysis export. Import/restore is not implemented. LocalStorage belongs to one browser profile and origin and is not a backup. The original version-1 Hello World counter is left intact in its old key; it is not converted into learning evidence or reward money.

## Audio and lifecycle

`AudioPlayer.ts` uses bundled files only: 120 prerecorded Hebrew clips and six original generated music loops. Music ducks for speech. Speech is stopped on task changes, pause, hidden tabs and leaving gameplay; all players and listeners are cleaned up on unmount. Browser autoplay policy may require a user gesture. Missing speech has an explicit visible fallback to supported copying rather than silently exposing the answer as an independent exercise.

Speech provenance and preparation commands are documented in `public/audio/README.md`. No runtime AI, speech synthesis API, third-party font or analytics request is needed. Bundled assets are not an offline-install feature; there is no service worker.

## Remaining product validation

The prototype is playable with temporary art. Target duration (12–15 minutes), enjoyment over ten minutes, pronunciation, sound comfort and learning retention need testing on the child's Windows computer. Short recall within one session is not proof of sustained improvement. Test comparisons should use comparable words, modes and help conditions.

## Guided crate presentation

The guided mode displays Dad and the target word in a right-side speech bubble. A decorative SVG crate on the left holds the existing real HTML input directly over its front. All composition, correction and persistence handlers remain in React. During these tasks the mounted Phaser stage is visually hidden in favor of the character prompt; it returns for other phases. The hand guide and keyboard remain available.

## Automatic task continuation

After a correct answer in any mode, feedback remains for two seconds before the next task (or the final clue) opens automatically. An optional immediate-continue button can shorten the wait. Incorrect answers do not start this timer; skipped tasks retain manual continuation. Pause, navigation, session changes and unmount clear the timer. The callback also checks the originating session and task before moving forward, so it cannot advance a replacement task or award points again.

## Parent reset

The parent screen provides a native modal confirmation before resetting session history, task progress, points, cosmetics and introduced keys. Initial focus is on cancellation; Escape cancels. Audio preferences are retained. Reset replaces only the version-2 game storage entry, leaving unrelated browser data alone. The empty model is persisted before changing React state; if storage rejects the write, the dialog reports failure and the existing in-memory progress remains available for export.

## Stage music selection

`src/content/music.json` lists six local loops. `Music.ts` chooses randomly among alternatives to the currently selected track. `AudioPlayer.beginStage` uses a session-and-stage key to select once per stage, resetting playback only for a new key. Task changes, dialogue phases, mute toggles, pause and in-app navigation/resume keep the chosen track. Reloading the application starts a fresh player and selects again when entering the stage; music selection is not learning progress. There is only one background audio element, so changing a track cannot overlap two loops. Switching while muted or paused does not start playback; speech ducking and cleanup still apply. The farm arrangement is the initial home-screen music.

## Pitsi on the farm path

`src/game/farmPath.ts` supplies the same polyline to both the path drawing and Pitsi’s progress positions. Positions are measured along segment lengths; his paws, rather than his body centre, sit on the path. Progress starts slightly inside the frame and ends near the barn. Increasing visual steps tween between positions; celebrations affect the body only, avoiding conflicting movement tweens. Trail footprints follow the same geometry, and the fence has a gate opening at the crossing. This is visual state only; React still owns task progress.

## Child playtest adjustments — difficulty and readability

Home and child-facing game screens must fit the desktop viewport without horizontal or vertical scrolling. Layout tests cover 1024×600, 1280×720 and 1440×900 across introductions, preparation, input, help, correction, success, clues and endings. The mission brief sits beside the introduction dialogue, and preparation instructions sit beside the level selector. Keyboard help sits with the illustrated world, beside the HTML input. The clue notebook also uses that column. Compact layouts reduce decorative spacing and illustration size while preserving readable text and accessible controls.

A native radio group selects difficulty in each mini-game's warmup, including each chapter stage. Speed mode's optional pace choice is there too. Selection regenerates only the unstarted stage's words. A session captures per-stage difficulty and task lists; in-progress tasks never change. Older version-2 saves keep their original tasks and difficulty. The obsolete global difficulty preference is accepted when loading but is no longer used to select levels.

Each mode has an independent locally saved proposal, initially 1. `stageSuccess` evaluates first submissions: correct, unskipped, unpasted, independent or keyboard-supported words count as successful; hints, copying and short recall do not. Repeated spelling probes are excluded from the denominator. At a ratio of at least 0.8, completing a stage proposes the chosen level plus one, capped at 3. Lower ratios leave its previous proposal unchanged. A persisted `ratedStages` receipt makes this update idempotent across timers, manual continuation and refresh. The proposal updates when the final task is completed, without waiting for the continuation timer. Abandoned incomplete stages do not update it. This is a practice recommendation, not a mastery claim.

The six local original music arrangements now have 32 bars, with changing accompaniment, a quiet bridge and a return. Light synthesized bass and percussion accompany the brighter tracks; the flute track stays percussion-free. The home theme is also regenerated. A manual next-tune button reuses the same audio element and preserves stage identity, mute and speech ducking.

## Gatekeepers: current standalone prototype

`GameShell.tsx` exposes a separate `gates` screen from home. It does not add a fifth chapter clue, a word `Mode`, an `Attempt`, rewards, spelling results or difficulty recommendations. The prototype keeps its run in local React state; refresh or leaving the screen loses that run. Existing word-game persistence is unchanged. Gate-run storage, parent reporting and version-3 migration remain plans.

| File | Current responsibility |
| --- | --- |
| `src/app/gates/GatesPrototype.tsx` | React state, focused physical-key input, screen keys, RAF, pause/resume, SVG world and summary |
| `src/typing/GatesSimulation.ts` | Pure `initial`, `operateGate`, `tick`; movement, queues, shared lever, automatic closures, waiting score and dusk transition |
| `src/content/gates.ts` | Cubic route geometry, sampled lengths, gate distances, locked shortcuts and two pasture branches |
| `src/content/gatesScenery.ts` | Standalone asset bounds and stage-one prop placements |
| `src/app/gates/GatesScenery.tsx` | Independently addressable prop instances, clipped to the map bounds |
| `public/assets/gates/` | Base terrain/paths/pen, sheep, gate states, blank signs and the `scenery/` asset collection |

The logical world is 1600×900. A smaller central pen has four approaches, winding intersecting tracks and two edge pastures. All four sheep traverse a shared route through ע/`KeyG`, י/`KeyH`, ח/`KeyJ`, ל/`KeyK`, then split into two pasture branches. Five unlabelled locked gates block other approaches and shortcuts; they have no command mapping or sheep route. Crossings do not choose a new route at runtime. Movement follows sampled cubic arc lengths; unit tests check that the SVG path strings match authored geometry.

The phases are `ready → out → regroup → back → done`. When all sheep reach pasture, the lever clears and all gates close. During `regroup`, `duskProgress` advances from 0 to 1 over 2.4 active seconds; sheep, movement time and waiting score remain stationary. A purple-to-warm overlay gradually tints all world layers. The transition automatically starts the return trip, with no modal or confirmation button. The tint stays through the return and summary; a new game resets daylight. HTML controls stay outside the tint.

One shared lever applies an accepted gate command after 0.8 seconds; busy commands are discarded. Gates close locally after five seconds without a sheep crossing and refresh their timer on passage. Every sheep passes all four gates in reverse on return. Queues share the common route and separate at the pasture branches. Score is `max(0, 1000 - floor(waiting))`, retaining fractional sheep-seconds internally; zero never blocks completion. The current simulation detects point crossings and has no explicit occupied crossing zone or `closingPending` state yet.

`requestAnimationFrame` supplies variable time steps capped at 0.05 seconds. It runs through outbound, dusk and inbound phases. Pause, hidden tabs and window blur stop progress, including the tint, lever and timers; resuming requires a click. Cleanup cancels RAF, resets its timestamp and removes listeners. Input uses `KeyboardEvent.code`, ignores repeats, composition and modifier shortcuts, and has no global capture. No gate-specific Phaser scene or visual bridge exists yet; those remain future integration work.

The base SVG contains terrain, pastures, paths and the empty pen. Ten transparent scenery files provide rocks, bushes, flowers, grass tufts, dog, tree, barn, silo, hay bale and fence sections. `stageOneScenery` places 21 instances with stable IDs, asset selection, position and optional rotation/scale. Each file includes its own definitions. `GatesScenery` renders a separate group per instance under sheep and gates, with `data-scenery-id` and `data-scenery-asset` for independent targeting. A future animation can target the inner image while preserving the placement transform. No prop animations or random placement have been added. Other stages can supply different placement lists.

Desktop viewport requirements remain 1024×600, 1280×720 and 1440×900 without scrolling, including instructions, pause/resume, dusk, return and summary. Tests cover standalone asset loading, independent instances, geometry, gate queues, automatic return, tint pause/reset, physical Hebrew keys and cleanup. All agent-managed verification servers must use a port other than 5173, which is reserved for the user; configure the Playwright base URL and server port together.
