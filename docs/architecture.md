# Architecture decisions

The first four mini-games use the React/Phaser architecture described below. The fifth mini-game, **שומרי השערים**, has a standalone five-level React/SVG game with a pure simulation, a tuning lab and separate local persistence. The current group routes are documented in [Gates groups](gates-groups.md), following [the playtest revision](gates-playtest-revision.md), with earlier experiments retained in [Gates polish](gates-polish.md). See [its current architecture and planned extensions](minigame-five-architecture.he.md), [game description](minigame-five.he.md), [map decisions](minigame-five-map.he.md), and [remaining build work](minigame-five-build-plan.he.md).

## Browser-first 2D

Phaser 4.2.1 renders the farm, trail, post office, animals and cosmetics using primitives. React owns story phases (`intro`, `warmup`, `play`, `clue`, `ending`), HTML input, keyboard help, audio preferences and all learning state. Vite builds strict TypeScript; Node 24 LTS is the development baseline. Production needs only a static web host.

The typed bridge accepts `world` (a visual snapshot: stage, step, total, equipment, reveal) and `celebrate`. Scenes do not check answers or duplicate task/progress state. A React mount creates one game and destroys it at cleanup, including StrictMode remounts. Phaser keyboard capture is disabled.

## Learning and authored content

`src/content/chapter.ts` defines story beats, four modes and cosmetic prices; `words.json` contains 120 unique words with sentences, topics, difficulty tags and local speech paths. Typing vocabulary is authored in `src/content/difficulty.ts`. Crate painting expands the first three pools with extra words and adds dedicated vocabulary at levels 4 and 5. Each typing stage selects eight distinct words, ordered by length, and uses a different seed. Difficulty 1 progresses from 2 to 4 letters, difficulty 2 from 3 to 6, and difficulty 3 from 4 to 10. Crate levels 4 and 5 use lengths 6–10 and 8–12. Warmup introduces the keys used by that set; this is not the complete eight-unit curriculum. Spelling keeps the prerecorded vocabulary, with maximum lengths of 4, 5 and 7 respectively, topic diversity and history-based selection. Its first eight prompts are ordered by length and include a longest eligible word; two short-recall probes follow. Difficulty is a word-selection setting, separate from optional speed timing. All Hebrew and final-letter key positions are mapped in `KeyboardMap.ts`.

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

The guided mode displays Dad and the target word in a right-side speech bubble. A decorative SVG crate on the left holds the existing real HTML input directly over its front. All composition, correction and persistence handlers remain in React. During these tasks the mounted Phaser stage is visually hidden in favor of the character prompt; it returns for other phases. The combined keyboard and hand illustration shares the physical key map. Its fingertip reaches the next key while the other fingers show the home positions. Each correct submission triggers a short portrait tilt and a text response in his speech bubble. The tilt pauses with the round and respects reduced motion. See [the crate iteration](crate-typing.he.md).

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

Each mode has an independent locally saved proposal, initially 1. `stageSuccess` evaluates first submissions: correct, unskipped, unpasted, independent or keyboard-supported words count as successful; hints, copying and short recall do not. Repeated spelling probes are excluded from the denominator. At a ratio of at least 0.8, completing a stage proposes the chosen level plus one, capped at that game’s highest level (5 for crates, 3 elsewhere). Lower ratios leave its previous proposal unchanged. A persisted `ratedStages` receipt makes this update idempotent across timers, manual continuation and refresh. The proposal updates when the final task is completed, without waiting for the continuation timer. Abandoned incomplete stages do not update it. This is a practice recommendation, not a mastery claim.

The six local original music arrangements now have 32 bars, with changing accompaniment, a quiet bridge and a return. Light synthesized bass and percussion accompany the brighter tracks; the flute track stays percussion-free. The home theme is also regenerated. A manual next-tune button reuses the same audio element and preserves stage identity, mute and speech ducking.

## Gatekeepers: five-level standalone game

`GameShell.tsx` exposes a separate `gates` screen from home. It does not add a chapter clue, word `Mode`, spelling `Attempt`, currency rewards or difficulty recommendations. React owns the Gates simulation, local physical-key input, menus, pause state and tuning. The world remains React/SVG; there is no Gates Phaser scene or duplicated learning state. The [playtest revision](gates-playtest-revision.md) updates the earlier [plan and implementation record](gates-polish.md); together they supersede the older single-stage descriptions for this iteration.

| File | Responsibility |
| --- | --- |
| `src/content/gatesLevels.ts` | Five authored round briefs, humor, themes, default rules and configuration bounds |
| `src/content/gates.ts` | Two cached group routes per level, route-local crossings, group identities and nine physical-key mappings |
| `src/content/gatesShifter.ts` | Fixed nine-slot truck-style H pattern and neutral-channel interpolation |
| `src/content/gatesScenery.ts` | Independent vector assets, original placements and stable per-level variations |
| `src/typing/GatesSimulation.ts` | Pure movement, queues, shared gearbox, active gates, safe closure, dusk, score, free help and medals |
| `src/app/gates/GatesPrototype.tsx` | React controller, focused keys, RAF, pause/lifecycle, help, levels, SVG world and summary |
| `src/app/gates/GatesDecor.tsx` | Code-authored vector accents and vintage gear lever, driven by simulation time |
| `src/app/gates/GatesLab.tsx` | Native modal tuning UI, presets, defaults, validated apply/restart and JSON copy |
| `src/app/gates/GatesScenery.tsx` | Memoized independently addressable scenery instances |
| `src/progress/GatesStore.ts` | Version-3 Gates-only snapshot, version-1/2 route migration, nested validation and recoverable storage errors |

The 1600×900 world has two authored group routes per level, with distinct starting docks and pasture destinations. `routeForLevel` supplies sampled arc lengths, cubic curves, SVG paths and `{gate, distance}` crossings for each group. Rendering and movement use the same curves. `Sheep.lane` identifies its group, not a branch of a common path; progress is never compared between groups. Sheep alternate groups, with rank-local starting offsets and same-group queue spacing. The dotted blue ○ flower trail and dashed rust ★ star trail match sheep badges and HTML next-gate cards; symbols and names supplement color.

There are **4/5/6/7/9 active gates**, initially closed, with stable control IDs at their established positions. Remaining gates have padlocks and reject commands. The union of both routes uses every active gate, but each group has its own subset and order (see the route table in [Gates groups](gates-groups.md)). The last level visits shared ד and ע in opposite orders. Each group retraces its route on return. Closed-gate checks, safe closing and hints use the individual group's crossing distances. Shared gates retain a `trafficGroup` owner until their occupied zone clears; other groups queue at the entry, while sheep in the owning group continue. Free help prioritizes the closest approaching sheep needing a closed gate.

Default flock size is four; speed is 160 in level 1 and 175 in levels 2–5. The first round gives more time to read the two routes; increasing gate count and route complexity is the main progression. Costumes, garden props, bunting and wind accents still vary. All round buttons are available from the outset. Score zero and assisted completion still allow advancement.

Flow remains `ready → out → regroup → back → done`; regroup freezes movement and waiting while dusk advances for 2.4 active seconds. No return confirmation. One shared gearbox operates at a time, dropping busy/repeated/composing/modified commands. Default action time is 0.45 seconds. Open gates close after 2 idle seconds by default in every round; passage refreshes the deadline. Closure waits while a sheep is within 40 route units of the crossing. Manual closure on an occupied opening defers to safe idle closure. Free help immediately opens the next needed gate, cancels the gearbox and increments a separate assistance count.

Gate letters are assigned once from the physical home row to all nine gate positions sorted by world X: ש/ד/ג/כ/ע/י/ח/ל/ך from left to right. Stable topology IDs remain separate from keyboard rank; unlocking gates does not reassign letters or invalidate current route saves. Signs, commands, hints and the HTML keyboard share `gateControls`.

The gear lever is a stylized vintage truck selector with a fixed nine-slot H pattern, assigned in keyboard order. `selectedGate` retains the last accepted gate and `shiftFrom` identifies the previous slot; `lever.remaining` drives a three-part movement to neutral, across, then into the new slot. Busy commands cannot change the target. Reduced motion snaps to the final slot; pause freezes the current interpolation. These fields are saved with the run. Regroup returns the selector to neutral.

`nextGate` derives guidance from actual remaining closed crossings, including the reversed return. Medals are optional: average accumulated sheep waiting ≤8 seconds gives three, ≤22 gives two, otherwise one for completion. Best medals are local personal rewards and can include tuned or assisted rounds; the summary reports assistance. They are not comparable learning or spelling evidence.

RAF caps elapsed frame time at 0.05 seconds; pure `tick` subdivides larger caller steps, accepting at most one second per call. Escape within the game pauses an active round, including dusk; it does not toggle resume or intercept open dialogs. Blur, hidden tabs, help, lab and explicit pause freeze movement, dusk and gearbox feedback. Refresh and re-entry load a paused snapshot. All frame callbacks, storage intervals, page lifecycle and media-query listeners are cleaned up. Ambient vectors use simulation time; sheep visual motion has pause and reduced-motion handling. OS reduced motion overrides the lab preference.

Persistence uses `flock-key-gates-v1`, a single atomic localStorage value containing `{ version, game, best }`, with schema version 3, including the effective configuration, sheep, gate deadlines and traffic ownership, gearbox selection/animation origin, dusk and counters. The storage key is intentionally retained for upgrade discovery. Version-1 and version-2 saves restart the revised round with its new defaults, preserving validated medals and help/motion preferences; the UI explains the restart because old distances belong to different routes. Saves run every 750 ms plus phase/command/help/config/medal/pause changes, page hide and unmount. Abrupt process loss can lose the most recent fraction of a second. Nested values, per-level gate counts, selected slot bounds and actuator/selection consistency and shared crossing ownership are checked before loading. Invalid data produces a fresh Gates run with a visible notice; unavailable storage leaves the game playable. Word-game version-2 storage is untouched. Parent dashboard, export and reset do not yet include Gates.

`GatesLab` is the real configuration surface used both by adults and browser tests. Choosing another level loads its defaults; applying starts a new ready round. Next-level navigation uses the next round's defaults while preserving guidance and reduced-motion preferences; replay preserves the current full configuration. Configuration ranges, five-level balance table and human playtest recipe are in [the playtest revision](gates-playtest-revision.md), with earlier experiments retained in [Gates polish](gates-polish.md).

Browser checks use port **5186**, configured with its matching Playwright base URL. Port 5173 belongs to the user's server. Layout coverage includes 1024×600, 1280×720 and 1440×900, help, lab, JSON copy, pause, refreshed resume, dusk/return and summaries. Logic checks exercise all five levels without help, timings, crossing safety, zero-score assisted completion and invalid saves. Automated completion is not evidence of enjoyment; physical-key playtesting remains necessary.

## Mobile play

The mobile adaptation is documented in [mobile support](mobile-support.md). Below 960 CSS pixels, React exposes global tools through a menu and CSS puts optional keyboard help after the task. The HTML input retains composition/correction handlers, adds a software-keyboard action hint, and only receives automatic focus on fine-pointer devices. No touch typing is converted into physical-key evidence.

Gates uses a separate mobile Options menu; its open state participates in `stopped`, freezing RAF feedback and scenery. The menu closes when crossing into desktop layout or starting a new round. Active gate buttons retain their existing typed command path; only their arrangement changes. Mobile overlay dialogs are fixed to the viewport, escaping the map clipping ancestor; the tuning lab remains a native modal dialog. Long mobile content scrolls. Desktop no-scroll behavior, persistence schemas, tuning defaults and local-only data ownership remain unchanged.

## Small detective case

`GameShell` exposes `detective` separately from chapter modes and Gates. `src/content/detective.ts` owns Noga's four Hebrew sources, selectable sentence strips, three supported relationships, observations and help ladders. `src/typing/DetectiveCase.ts` owns a pure event reducer: inspect, bookmark, tentative choice, hint, theory and travel. Source opening and bookmarking do not count as comprehension success. Decision receipts retain the chosen action, evidence, inspected sources at that moment and hint tier. Supported, guided, exploratory and revisited theories remain separate; completion is terminal and cannot be duplicated.

`src/app/detective/DetectiveCase.tsx` owns navigation, HTML hotspots, source reading, choices, pause/lifecycle and the public lab. `DetectiveWorld.tsx` mounts one Phaser 4 scene with global keyboard disabled. A typed visual snapshot contains only place, stop/motion preferences and a reaction revision. It draws the cart, farm, witnesses, Pitsi, two bridge levels and Noga, and owns brief character and curtain tweens. Pausing freezes every tween; changing reduced motion rebuilds the scene at its settled pose. Cleanup destroys the game and removes lifecycle/media listeners. All art is original code-authored geometry adapted from the established FarmScene palette and Pitsi proportions, without external files.

The optional `GameProgress.detective` array is an additive migration within the existing version-2 storage key; absent arrays mean no cases. Each run uses version 1 for this fixed authored content/schema, with run ID, start, effective settings and ordered events. Loading replays and validates every event against the authored rules: no uninspected passage tokens, no unsupported yard-link receipts, no bridge before both links, explicit third-tier assistance, and no post-ending actions. Corrupt/unknown-version cases are isolated with a warning; word sessions and valid cases survive. Bookmarks and proposed choices are derived from saved events. Meaningful actions save through the shared writer; storage errors remain visible. Refresh/re-entry always resumes paused.

Parent reports and JSON/CSV include the case separately from spelling and typing; CSV appends case-specific columns while retaining the existing word columns. Existing parent reset atomically removes case runs with word progress, preserving audio preferences. Gates keeps its own existing key and reporting/reset limitations. Case results are observations about one known story, never a reading-level diagnosis or evidence of improvement on replay. Text is the only provided source modality; adult assistance is not automatically observable. There is no account, runtime AI or remote audio.

See [implementation and playtest record](detective-implementation.md).

## Farm options and temporarily hidden games — 15 November 2026

`stages.hiddenReason` records the playtest status of Tracks (`blind`) and Pitsi's chase (`speed`): too easy and not interesting enough. Home omits them; chapter navigation uses `nextAvailableStage` and ends after the last available stage. Authored stage indices, task arrays, past attempts and save schema remain unchanged. The clue notebook and counter include available stages only. An active save inside a hidden game is retained with a home notice; resume is unavailable while that stage is hidden. Starting another run uses the existing abandonment behavior, retaining history. See TASK-003 in [the shared task list](tasks.he.md).

The shop has ten authored prizes, presented five per page. Five new code-drawn FarmScene decorations reuse existing sheep, Pitsi, sun, barn and duck geometry and palette. No external assets or new animation loops were added. Existing `PrizeId`-derived storage validation, purchase/toggle, export and reset include the additions. Decorations affect the word-game farm only. A crown also displays its duck, independently of owning the original giant-duck prize.

Noga's opening reuses `DialoguePanel` and its original portraits, with authored lines in `src/content/detective.ts` and a separate mission brief. Case rules, evidence, progression and persistence are unchanged. See [iteration decisions and human playtest questions](iteration-farm-and-openings.he.md).

## Noga adventure redesign — edition 2

The current detective UI supersedes the earlier fixed notebook panel: a full map owns exploration, with native dialogs for conversations/observations, an illustrated notebook, a separate inventory and a deduction board. `adventureInteractions`, `adventureItems` and `deductionBoards` in content define source sentences, collectibles and two questions. Each board takes three collected evidence IDs. HTML drag/drop and keyboard/click placement send the same typed event. Irrelevant notes/objects remain valid collectibles; checking a wrong combination preserves it for revision. Board order and travel between farm/bridge are free. New runs hide hotspot names until hover/focus by default; the public Options UI can show all labels.

`newAdventure` creates case edition 2 inside the existing shared version-2 game store. `reduceAdventure` enforces source observation, explicit collection, global bookmarks, board capacity/uniqueness, proof groups and explicit assisted completion. Saves replay events against these invariants. Edition-1 histories continue to validate, report and export using their original rules; entering from an old case starts the revised adventure with a visible notice, preserving the old case. No separate progress store was introduced. Parent summaries and CSV distinguish edition-2 board attempts and collected evidence; JSON retains all intermediate collection/placement events. The existing parent reset includes both editions.

The Phaser snapshot adds only two visual booleans for removing the collected ribbon/spoon. HTML hotspots align to the actual 3:2 world frame rather than its letterboxed outer area. Dialogs enter the browser top layer, trap focus, restore it on close and stop world animation. Blur, refresh and explicit pause still freeze the world; reduced motion settles the scene. New notebook, bag and item SVGs and the basket/spoon primitives are original code-authored art using the established palette. See [design, primary-source comparisons and verification](noga-adventure-redesign.he.md).

## חזרה באסם — אנגלית

`Rehearsal.tsx` מנהל את הבחירה, השאלות, נגן השמע המקומי, החוברת הדו־לשונית וההדרן ב־React. `RehearsalStage.tsx` מקבל פקודות בימוי בלבד ויוצר את האסם ואת האביזרים ב־Phaser, עם מקלדת גלובלית כבויה. עצירה מקפיאה את הטווינים ומשהה את נגן השיר. תנועה מופחתת מציגה את הפוזה ללא הטווינים. עמודות הבחירה והתרגום מבוססות על HTML.

התוכן נמצא ב־`src/content/Rehearsals.ts` וב־`rehearsalLyrics.json`. כללי תשובה ואימות התקדמות נמצאים ב־`src/typing/Rehearsal.ts`. שדה `rehearsals` אופציונלי בשמירה המקומית הקיימת כולל חזרה אחרונה אחת לכל שיר, הגדרות, מיקום במשימות, תוצאות בחירה/שליפה והווריאציות שנוגנו. האימות בודק עקביות בין שלב החזרה, משימות ותוצאות, וסדר שלבים לפני ההדרן. רשומות לא תקינות מבודדות באמצעות אותו מנגנון שמירה. הנתונים מופיעים במסך ההורים ובייצוא JSON ונכללים באיפוס הקיים. ייצוא CSV ממשיך להציג את מדדי משחקי הפרק והתיקים הבלשיים. חזרה באסם אינה מעניקה מטבעות ואינה נכללת במדדי איות או הקלדה בעברית. [תכנון, תוכן זמני ושאלות פלייטסט](english-grade-7/song-mini-game.he.md).
