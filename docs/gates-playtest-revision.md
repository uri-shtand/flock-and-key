# Gates: response to playtest feedback

Plan recorded 2026-11-13 before editing. User feedback: wrong dog, opening rounds too easy, start with four gates and use existing locked gates later, shorten the idle timer, and replace the mechanism with a vintage car/truck shifter whose position identifies each gate.

## Planned changes and fun hypotheses

- Derive the farm dog SVG from the existing `PitsiIllustration` charcoal/tan standing dog, preserving the independent prop and its bounds. The current cream silhouette does not match the established character. No new bitmap or external art.
- Start with all four original gates. Unlock the west pen gate in level 2, east pen gate in level 3, north pen gate in level 4, then both outer shortcut gates in level 5: 4/5/6/7/9 controls. Retain the four original physical keys; add adjacent Hebrew home-row keys for new gates.
- Author a route for each level through its unlocked gates, with the exact same curves used for illustration and movement. Preserve both pasture branches and reverse the required crossings on return. Merely removing padlocks without using those gates would not add a playable challenge.
- Use a 2.2-second idle opening for all five rounds, down from 3.2/3/2.8/2.5/2.2. Hold sheep count and speed steady initially so unlocking gates is the main new demand. Keep timing configurable and keep crossing safety/free help.
- Draw an aged metal H-pattern shift plate, leather gaiter, long gear stick and dark round knob. Each gate has a fixed labeled slot; the stick travels via the neutral channel and remains at the last selected slot. Reduced motion snaps to the new slot, pause freezes a shift, and saved state preserves its pose.
- Migrate earlier Gates snapshots to the revised round's ready state, retaining medals and guidance/motion preferences. Old route distances cannot be resumed on new routes. Keep word-game progress untouched and explain the restart visibly.
- Verify all five levels, every newly unlocked gate, both travel directions, lever positions, migration, Hebrew keys, pause/reload, console errors and no clipping at all three desktop sizes.

**Is it fun?** The first level should require attending to four gates; later levels should add places and keys rather than only faster timers. The shifter should make each accepted command tangible and explain the shared actuator. Check for a busy-looking map, hard-to-read added labels, and whether 2.2 seconds feels fair. These remain human playtest questions.

## Delivered changes and verification

Implemented the planned dog, routes and H-pattern selector. The final idle timer is **2.0 seconds**, rather than the initially proposed 2.2: the old fifth round already used 2.2, so 2.0 makes the requested further reduction apply to every round. The actuator remains 0.45 seconds. All defaults remain editable in the lab.

| Level | Gates | Newly available controls | Outbound gate order | Sheep / pace | Idle timer |
| --- | ---: | --- | --- | --- | --- |
| 1 | 4 | Original ע/G, י/H, ח/J, ל/K | ע, י, ח, ל | 4 / 175 | 2.0 s |
| 2 | 5 | כ/F: west pen | כ, ע, י, ח, ל | 4 / 175 | 2.0 s |
| 3 | 6 | ג/D: east pen | ג, כ, ע, י, ח, ל | 4 / 175 | 2.0 s |
| 4 | 7 | ד/S: north pen | ד, ג, כ, ע, י, ח, ל | 4 / 175 | 2.0 s |
| 5 | 9 | ש/A: west shortcut; ך/L: east shortcut | ד, ך, ג, כ, ש, ע, י, ח, ל | 4 / 175 | 2.0 s |

Return order is reversed. All controlled gates begin closed; unopened future gates keep their padlocks and reject commands. The former ✓ free passages have been removed. Gate IDs and physical keys stay stable, while `nextGate` sorts the level's actual arc distances to find travel order. `routeForLevel` caches geometry, lengths, crossing distances and the SVG path. All route gates are at their existing illustrated positions; additional connecting paths are generated from the same curves used by sheep movement.

The shifter has nine fixed slots, with locked future controls muted. It is a stylized truck-inspired selector, not a claim to reproduce a particular real vehicle's transmission. It moves through neutral, holds the last accepted position, ignores busy/repeated/composing/modified commands, freezes during pause/help and snaps under reduced motion. `selectedGate` and `shiftFrom` are part of the simulation snapshot so refresh preserves the pose, including mid-shift. Free help selects the gate it opens immediately.

The dog prop is derived from the existing canonical vector illustration, with original bounds/placement retained. The asset README and art manifest record this provenance. No new dependency, lockfile change, bitmap generation, runtime AI or external artwork was introduced.

### Save upgrade

The existing `flock-key-gates-v1` storage key now carries **schema version 2**. Version-1 records supply only validated level, medals and guidance/motion preferences; the affected round starts ready using the revised defaults. Old positions, timers and tuned balance settings cannot silently carry across different route topology. A Hebrew notice explains the restart. Valid version-2 snapshots resume paused as before, including the selected lever slot. Corrupt saves and failed writes still leave play usable. Word-game storage is untouched.

### Verification

- Build/strict TypeScript and 55 unit tests passed during implementation. Unit coverage includes all five rounds completed without help, all unlocked gate coordinates, both travel directions, shorter deadlines, safe crossing closure, unique H-pattern slots and neutral-channel interpolation, retained selection, valid snapshots and version-1 upgrade.
- The 12 Gates browser scenarios passed, including all rounds, physical Hebrew keys for all nine gates, actual route rendering, every viewport, help/lab/pause/resume, corrupt/blocked storage, migration and gearbox pause/reload.
- Visual review: Pitsi and shifter at 1024×600; the six- and nine-gate layouts at 1440×900. A final screenshot of the active nine-gate farm at 1024×600 is included in the browser checks. No controls or dialog text are hidden by a clipping ancestor.
- Final full regression: **build passed, 55 unit tests passed, all 31 browser tests passed** (full browser run: 1.8 minutes). The suite covers Hebrew correction/composition/persistence in the other mini-games, console errors, new routes/controls, saved shifter state and all required desktop layouts. `git diff --check` passed. Agent-managed verification used **5186**, leaving 5173 reserved for the user's server.

### Next human fun check

Try level 1, then levels 2 and 5. Does four gates feel engaging immediately? Is the route through each newly unlocked gate easy to follow without simply chasing the next-key hint? Does the lever's fixed position help connect a physical key to a gate? Compare the same round at 2.0 and 2.4 seconds in the lab; prefer the setting that invites planning and replay over frantic repeat presses. These changes respond to the user's playtest, but do not prove the new balance is fun without another physical-keyboard trial.
