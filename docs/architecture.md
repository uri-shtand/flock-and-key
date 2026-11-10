# Architecture decisions

## Browser-first 2D

Phaser 4.2.1 renders the farm, trail, post office, animals and cosmetics using primitives. React owns story phases (`intro`, `warmup`, `play`, `clue`, `ending`), HTML input, keyboard help, audio preferences and all learning state. Vite builds strict TypeScript; Node 24 LTS is the development baseline. Production needs only a static web host.

The typed bridge accepts `world` (a visual snapshot: stage, step, total, equipment, reveal) and `celebrate`. Scenes do not check answers or duplicate task/progress state. A React mount creates one game and destroys it at cleanup, including StrictMode remounts. Phaser keyboard capture is disabled.

## Learning and authored content

`src/content/chapter.ts` defines story beats, four modes and cosmetic prices; `words.json` contains 120 unique words with sentences, topics, difficulty tags and local speech paths. Typing tasks use only the six keys introduced in the chapter warmup. This is a first keyboard unit, not the complete eight-unit curriculum. All Hebrew and final-letter key positions are mapped in `KeyboardMap.ts`.

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

`src/content/music.json` lists six local loops. `Music.ts` chooses randomly among alternatives to the currently selected track. `AudioPlayer.beginStage` uses a session-and-stage key to select once per stage, resetting playback only for a new key. Task changes, dialogue phases, mute toggles, pause and in-app navigation/resume keep the chosen track. Reloading the application starts a fresh player and selects again when entering the stage; music selection is not learning progress. There is only one background audio element, so changing a track cannot overlap two loops. Switching while muted or paused does not start playback; speech ducking and cleanup still apply. The original loop remains the initial home-screen music.

## Pitsi on the farm path

`src/game/farmPath.ts` supplies the same polyline to both the path drawing and Pitsi’s progress positions. Positions are measured along segment lengths; his paws, rather than his body centre, sit on the path. Progress starts slightly inside the frame and ends near the barn. Increasing visual steps tween between positions; celebrations affect the body only, avoiding conflicting movement tweens. Trail footprints follow the same geometry, and the fence has a gate opening at the crossing. This is visual state only; React still owns task progress.
