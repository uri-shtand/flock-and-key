# Gates: five-level game and fun lab

> Later playtest feedback supersedes the opening difficulty, timing, dog and gearbox described here. See [Gates playtest revision](gates-playtest-revision.md) for the current 4/5/6/7/9-gate routes, 2-second timer and vintage shifter. This document preserves the earlier plan and results.

Plan recorded 2026-11-13 before implementation. This document supersedes the older single-stage prototype descriptions only for the work described here. The original GDD remains intact.

## Intent and fun hypotheses

The core toy is a flock, four physical Hebrew keys and one shared gearbox. A good action releases a little procession of sheep; a mistake should produce a smile and another chance. Progression must introduce decisions, not just make the same wait longer.

| Step | Planned work | Is it fun? What could improve it? |
| --- | --- | --- |
| 1 | Five authored rounds: picnic, flower delivery, wool parade, windy hill, moonlight party. Start with two controlled gates, then three, then four; increase flock size and pace later. All levels selectable; next/replay after completion. | New challenge per round, roughly a minute rather than long empty travel. Test whether later rounds need different routes next. |
| 2 | Shorter idle-open time, initially 3.2 seconds down to 2.2; quicker 0.45-second gearbox. Visible gate countdowns and next-gate hint. Safe closure waits for sheep to clear the opening. | Timing should be readable and satisfying; small windows must not feel like arbitrary traps. |
| 3 | Hebrew sheep banter tied to departure, waiting, dusk and completion; hats/scarves, palette/scenery variants, butterflies, sheep bob and a mechanical gearbox with meshing gears and lever. | Humor is about sheep, never the child's mistakes. Motion should show action and leave labels readable. Pause and reduced motion must work. |
| 4 | Optional flow medals, level progress, free help and skip/select controls; no loss condition or story gate. | Completion first, replay score second. Assistance should relieve frustration immediately. |
| 5 | Small keyboard-accessible tuning dialog: level, pace, flock size, opening window, gearbox duration, next-gate guidance and reduced motion; presets, defaults, apply/restart and copyable JSON. | The adult and browser tests can change the actual rules through the same UI. No hidden automation-only controls. |
| 6 | Versioned local Gates-only snapshot, config and best results; paused refresh resume, validation and visible storage failure. | Preserve an enjoyable run without mixing it into spelling evidence or word-game currency. |
| 7 | Unit tests for all five levels and timing/safety/config/persistence; browser coverage for physical Hebrew input, help, lab, resume, completion, console and all required sizes. | Automated play proves reachability, not enjoyment. Finish with a short physical-key playtest recipe. |

## Comparisons and decisions

Sources inspected 2026-11-13:

- [Mini Metro, developer](https://dinopoloclub.com/games/mini-metro/): growing transport demand and limited resources. Our adaptation: readable queues and one shared gearbox, with an always-available next-gate hint. No game-over pressure.
- [Good Job!, Nintendo/publisher](https://www.nintendo.com/us/store/products/good-job-switch/): humorous everyday tasks, completion despite mishaps, optional replay scores and outfits. Our adaptation: sheep costumes and encouraging banter, medals that never block progression.
- [Poly Bridge manual, developer](https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/367450/manuals/ManualPFDable.pdf): unrestricted sandbox experimentation. Our adaptation: local tuning presets and copyable settings, without a full level editor.

Keep the existing SVG world and pure TypeScript simulation. Rebuilding it in Phaser adds risk without improving the current toy; Phaser continues to own the other illustrated games. React owns Gates input/state. No new dependency, runtime network request, account or telemetry. Reuse vector art and add code-native vector accents rather than mixing raster styles. Four-key mapping stays stable; multi-key sequences and new route geometry are deferred until these rounds have been playtested.

## Art direction and provenance

1600×900 SVG world, soft green terrain, warm wooden gates, cream sheep, dark outlines. Existing standalone scenery and sheep remain the visual reference. Add vector hats/scarves, clouds, butterflies and a brass/wood gearbox in React/SVG; no downloaded or generated bitmap asset. Palette accents vary by round without changing route contrast. Gate letters and all important instructions remain real text. Animation uses active simulation time or pause-aware CSS, with reduced motion support. Code-authored accents are project source, under the same terms as the application. Validate them in browser screenshots at native desktop sizes; raster QA does not apply to these vector elements.

## Implementation record

Delivered:

- Five selectable rounds with authored Hebrew introductions, departure/dusk/completion jokes, growing challenge, next/replay controls and local best medals. Every round remains selectable; there is no failure screen or score requirement.
- Idle opening reduced from 5 seconds to 3.2/3/2.8/2.5/2.2; gearbox reduced from 0.8 to 0.45 seconds. Passage refreshes the deadline. Automatic and manual closure respect the 40-unit occupied crossing. Busy commands are dropped rather than queued.
- Free next-gate rescue, optional guidance and gate countdown bars. Rescue cancels a busy gearbox, opens the needed gate immediately and is counted separately without reducing score. Score remains `max(0, 1000 - floor(sheepWaiting))`. Optional medals use average sheep waiting: ≤8 seconds = three, ≤22 = two, otherwise one. Tuned and assisted play may earn medals; these are not learning measures.
- Themed bow ties/flowers/hats, garden variants, butterflies/clouds, parade bunting, wind strokes, sheep motion and animated meshing cogs with a moving lever. All new art is code-authored vector work using the existing palette. The art record is in [gates-art-manifest.json](gates-art-manifest.json).
- The initial new status strip made the map smaller at 1024×600. Screenshot review led to putting the gearbox and sheep banter into the map's letterbox margins instead. Gate letters stay unobstructed. Pause freezes the mechanism and scenery. The lab preference and OS reduced-motion setting disable decorative motion.
- A native modal lab provides four real rule sliders, level selection, guidance/motion toggles, calm/quick presets, per-level reset and JSON copy with a selectable fallback. Applying starts a new ready round. Tests use these same controls; there are no hidden test-only gameplay APIs.
- Separate version-1 local snapshot (`flock-key-gates-v1`): full current run/config plus five best medal counts, saved every 750 ms and at important boundaries. Refresh/re-entry resumes paused. Validation covers nested rules, counters, sheep, gates, gearbox and free-passage invariants. Storage failure shows a notice and leaves play usable. Existing word-game data is untouched.
- Playwright's server and base URL moved together to 5186 because 5174 was already occupied. The user's 5173 server was never reused or stopped. No dependency or lockfile changes.

Deliberate limits: same shared route geometry across all five rounds; progression changes gates, pace and flock size. No two-key commands, new routing, sounds, Phaser migration, parent reporting/export/reset integration, or mastery claims. No full GDD implementation. Older Gates build/architecture documents have a dated pointer to this record; the original game-design reference remains intact.

The proposed version-3 shared progress migration was replaced with an isolated Gates save for this iteration. This keeps experiment data away from spelling/currency and avoids migrating unrelated child progress. A future shared export/reset must include the new key explicitly. Abrupt termination may lose the latest <750 ms of play; local storage is not a backup.

## Default balance and tuning contract

| Level | Active gates | Sheep | Pace (world units/s) | Idle opening | Gearbox |
| --- | ---: | ---: | ---: | ---: | ---: |
| Picnic | 2 | 4 | 145 | 3.2 s | 0.45 s |
| Flowers | 3 | 4 | 145 | 3.0 s | 0.45 s |
| Wool parade | 4 | 4 | 175 | 2.8 s | 0.45 s |
| Wind | 4 | 6 | 175 | 2.5 s | 0.45 s |
| Pajama party | 4 | 8 | 205 | 2.2 s | 0.45 s |

`GatesConfig`: `level` integer 1–5, `speed` 90–260, `sheepCount` integer 2–10, `openSeconds` 1.2–5, `gearboxSeconds` 0.15–1.2, `hints` boolean, `reducedMotion` boolean. Authored content lives in `src/content/gatesLevels.ts`; pure rules live in `src/typing/GatesSimulation.ts`. The lab's slider steps are 5, 1, 0.1 and 0.05 respectively. The pace value is an experiment setting, not a typing rate.

How to experiment:

1. Home → שומרי השערים → מעבדת הכיף. Choose a round; that loads its defaults.
2. Change one variable, apply, then start. Try the same physical keys and route twice.
3. Compare whether you anticipated the next gate, had time to watch the sheep, and wanted another round. Record waiting and assistance as observations, not a verdict on the child.
4. Copy settings when a version feels better. JSON copy includes all effective settings; it has a selectable fallback when clipboard permissions are unavailable. This iteration does not import JSON.
5. Replay keeps the tuned settings. Next round or direct level selection loads that round's defaults and retains guidance/motion preferences. Lab edits are drafts until Apply. Current applied settings survive refresh.

## Verification record

- `npm run build`: passed, including strict TypeScript. Existing Phaser chunk remains large; no new dependency was introduced.
- `npm test`: 52 passed across 8 files. Includes all five rounds completed without rescue, configured timings, crossing safety, free passages, busy rescue, zero-score completion, timestep/immutability and nested snapshot validation.
- `npm run test:e2e -- --workers=2`: all **29 browser tests passed** in the final full run (1.8 minutes), on port 5186. Covers Hebrew correction/composition/paste and word-game persistence, all five Gates rounds, medals, help/lab/resume/summary at all three desktop sizes, corrupt/unavailable storage, physical keys, pause/dusk/gearbox and cleanup/console errors. Screenshots are emitted under `test-results/` by the browser tests. Final layout assertions also check that regular dialogs fit inside the clipping map container, not merely inside the viewport. Summaries use two columns to preserve readable text and visible controls. The gearbox freeze test samples its pose after the help dialog opens, so elapsed click time is not mistaken for motion during pause. `git diff --check` also passed.
- Chromium was downloaded. System dependency installation needed sudo and could not run; existing libraries extracted under `/tmp/flock-browser-libs/usr/lib/x86_64-linux-gnu` allow Chromium to run without modifying system packages. In this environment use `LD_LIBRARY_PATH=/tmp/flock-browser-libs/usr/lib/x86_64-linux-gnu npm run test:e2e -- --workers=2`.
- UI review applied the installed game UI and web interface guidance: labelled controls, native modal focus containment/Escape, visible focus, no global key capture, pause-aware motion and explicit reduced motion. SVG art was reviewed in actual screenshots, rather than applying bitmap alpha/palette scripts to source vectors.

## Human fun check (still required)

Play levels 1, 3 and 5 with the physical Hebrew keyboard, then one replay after changing only the opening time. Ask:

- **Is it fun?** Do I watch the flock, or only chase the next highlighted key? Try guidance off if it removes the discovery.
- Does opening a gate feel immediate enough? Compare 0.45 s with 0.3 s gearbox; too slow adds frustration, too fast removes the little mechanical moment.
- Do shorter openings reward timing, or cause tiresome repeat presses? Compare 2.2 s and 3.2 s with the same flock.
- Is the difference between rounds four and five interesting enough? If not, the next experiment is two separated waves or a new route, not more raw speed.
- Does banter make you smile without pulling attention away? If not, shorten it or keep jokes to introductions and summaries.
- Are the small sheep and gate letters comfortable at 1024×600 on the child's actual display? Does the gearbox clarify why a second key may be ignored?
- Pause mid-action, refresh, then resume. Confirm that the flock and gearbox match the remembered state and that returning feels calm.

Automated completion and readable screenshots cannot establish enjoyment, keyboard comfort or learning. Do not label the balance final until this playtest is done.
