# Gates: two travelling sheep groups

## Plan and fun hypothesis

The single-file flock makes gate order predictable. Split it into two identifiable groups with authored routes: the flower group travels west and the star group travels east. Every sheep follows its group's route out and reverses that route home. Both groups exist from level 1; four gates remain active there. Later levels add the existing locked gates and shared crossings. The player watches two journeys and chooses which gate needs attention first.

Keep speed, flock size, opening time and gearbox settings available in the existing lab. Do not add a second control scheme or a typing penalty. Free help should choose the nearest needed closed gate across both routes. A group that reaches a shared crossing waits its turn; never compare distances belonging to different routes.

Make routes visible with distinct trail patterns and colors, and mark sheep and group cards with matching symbols and names. Show each group's immediate next gate. Explain the split in the introduction and help. Keep the small desktop layout readable.

Persist the new topology as save schema 3. Restart older route saves at the same level, retaining medals and accessibility preferences. Document implementation and run unit, build and browser checks, including round trips, queue spacing, shared crossing safety, custom flock sizes and all three desktop viewport sizes.

Question for playtesting: Is choosing between two groups fun, or just busy? Look for readable anticipation, meaningful gate choices and recoverable mistakes. Automated completion cannot establish fun.

## Authored gate sequences (outward; reverse on return)

| Level | Flowers ○ | Stars ★ |
| --- | --- | --- |
| 1 | ג → ד | ל → ע |
| 2 | כ → ג → ד | ל → ע |
| 3 | כ → ג → ד | ח → ל → ע |
| 4 | כ → ג → ד → י → ע | ח → ל → ע |
| 5 | כ → ש → ג → ד → י → ע | ח → ך → ל → ע → ד |

## Implementation and verification

Implemented two groups on all five levels, with two sheep per group at the default flock size. Odd and custom flock sizes alternate membership; each group queues independently. Cached cubic paths drive both rendering and movement. The east group uses the southern pen opening before its east gate unlocks; scenic pasture approaches avoid the barn and unrelated gates.

Shared openings reserve their occupied crossing zone for one group. Automatic and manual closing wait for that zone to clear. The flower and star trails have different dash patterns as well as colors. Matching sheep badges and group cards identify routes; cards show the authored order before starting, the next crossing during play and arrival at the pasture/home. Introduction and help explain the two journeys. Existing lab settings remain effective without adding more controls.

Schema 3 saves retain traffic ownership, with validation against actual occupants. Schema 1/2 saves restart the current round at its authored defaults, preserving medals and help/motion preferences. Other mini-games' learning records are untouched.

Verification complete: `npm run build`, all 65 unit tests and all 31 browser tests pass (agent-managed port 5186). Coverage includes all five assisted/unassisted round trips, independent blocked queues, reverse shared gate order, clearances from unrelated/locked gates, passage timers, crossing ownership, snapshot resume/corruption, and traffic stress with 2/3/10 sheep at both speed limits. Browser coverage includes Hebrew physical-key commands, all five round trips through the UI, free help, pauses, refresh persistence, older-save migration, lab settings, and the existing educational mini-games. Layout checks pass at 1024×600, 1280×720 and 1440×900, including help, ready, pause, resume and completion states. Screenshots of the first level and the nine-gate farm were visually reviewed; the group panels fit inside the world, and the corrected east approach avoids the locked exit. The final build passed again after the group-card arrival labels were added. Automated tests establish playability and safety, not whether the attention-switching mechanic is fun.

### What still needs human playtesting

- Does switching attention between groups feel satisfying at the existing 2-second opening time?
- Are the two patterns and badges readable without relying on color?
- Are the shared crossings in levels 4–5 an enjoyable anticipation challenge?
- Try slower pace or a longer opening in the lab if shared crossings feel busy; try more sheep if watching the separate queues is enjoyable.
- The route choices are authored per level. Sheep do not choose random branches at runtime. Existing golden background roads remain decorative; the patterned trails indicate the groups’ active journeys.

Existing single-route design records describe previous revisions.

## Playtest adjustment: gentler first level

The user reports that separate groups make the game more fun, and requests slightly slower sheep in level 1. Lower its authored speed from 175 to 160 world units/second (about 9% slower), giving a little more time to notice both routes. Later levels remain at 175; gate timing, routes and flock size stay the same. Existing saved rounds retain their effective settings; start a new level-1 round or use the lab's default settings to try the new pace.

Implemented the authored default and updated README/architecture. Verification: `npm run build` and all 65 unit tests pass. Human comparison: does 160 preserve the enjoyable attention switching while making the first round more comfortable?

## Keyboard pause

Escape pauses an active Gates round, including the dusk transition, when focus is anywhere inside the game. It uses the existing pause state: sheep, gate timers, scenery and gearbox freeze; resume remains an explicit button action. Repeated Escape does not resume. Ready/completed screens, composition/modifier events and open help/lab dialogs do not trigger the shortcut; the lab keeps its native Escape-to-close behavior. The help text and pause button advertise the shortcut. The handler belongs to the mounted React game, with no global keyboard listener.

Verification: production build, 65 unit tests and all 32 browser tests pass. Coverage includes mid-shift pause, dusk pause, toolbar focus, repeated Escape, refresh and dialog behavior. The first browser run found Help exceeded the 1024×600 map bounds after adding the shortcut sentence; shorter wording fixed it without reducing text size. The final run verifies all three desktop sizes, and the 1024×600 Help screenshot was visually reviewed.

## Spatial keyboard mapping

Plan: assign the nine physical home-row keys to the nine gate positions sorted by world X, keeping that assignment stable as gates unlock. The intended benefit is less searching: a gate farther left should use a key farther left, even within the closely spaced pairs. Stable gate IDs keep the authored routes and in-progress saves intact. Derive signs, physical commands, hints, home-row buttons and shifter labels from the same mapping; arrange shifter slots in keyboard order too. Update level announcements and route documentation for the new letters.

Verify the strict left-to-right ordering at every level, each physical key's actual gate operation, stable assignments when unlocking, shifter positions, saved runs and existing Hebrew/input/layout regressions. Human check: does the spatial correspondence make choosing the right gate feel more immediate?

Implemented the mapping from the shared physical keyboard definition, sorting the nine gate positions by X while preserving their topology IDs. The full left-to-right assignment is ש/ד/ג/כ/ע/י/ח/ל/ך (A/S/D/F/G/H/J/K/L). Level 1 uses ד/ג/ע/ל; the next unlocks are כ, ח, י, then ש and ך. Gate signs, commands, hint cards and home-row activation share this mapping. Shifter slots use the same spatial order. Existing schema-3 saves retain their route progress and configuration; only key bindings and labels change. The route table above reflects the new letters; earlier playtest documents preserve their historical mappings.

Build and 66 unit tests pass, including explicit expected physical codes and Hebrew letters in spatial order and stable mapping across all five unlock sets. All 32 browser tests pass on port 5186, including rendered sign order against the physical HTML keyboard at every level, each key opening its matching gate, shifter selection/animation, Hebrew input, pause, refresh persistence and all three desktop sizes. The nine-gate 1024×600 screenshot was visually reviewed.
