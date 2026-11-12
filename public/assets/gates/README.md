# Gatekeepers artwork v1

Art direction: near-top-down modern TV-cartoon farm, clean bold outlines, bright grass, sandy paths, humor in the scenery, and very visible yellow signs.

## Assets

| File | Use |
| --- | --- |
| `farm-background.svg` | Static 1600×900 farm with central **empty** sheep pen, two unobstructed routes to left/right, distant barn, dog, foliage |
| `sheep.svg` | Transparent 160×115 sheep sprite facing right; flip horizontally for leftward movement |
| `wooden-gate.svg` | Transparent closed wooden gate sprite |
| `wooden-gate-open.svg` | Matching open gate sprite with leaf swung aside |
| `blank-gate-sign.svg` | Transparent 260×180 yellow sign, with no baked-in text; render the Hebrew letter/sequence as HTML/SVG on top |

These are editable vector **production starter assets**, not a raster export of the AI reference image. They preserve the approved art direction and keep stateful elements independent. Original illustrated concept remains a reference rather than the game's render layer.

## Coordinate and integration notes

- Background logical size: `1600×900`. Keep the full background image aspect ratio when rendered. Mobile landscape scales the farm into the available upper region with the physical keyboard row below.
- Pen occupies approximately `x=590..1010, y=244..691`; the left and right route entries are roughly `(590,470)` and `(1010,470)`. Background paths are decorative; choose deterministic curves for actual sheep trajectories that follow their visible corridor.
- Paths go toward the left edge and right edge; don't reuse the old prototype's two left-to-right parallel lanes.
- Draw sheep over the background. The visible pen must be empty in the underlying artwork.
- Draw a gate sprite at the desired path interception point, draw a sign above it, and render letter labels in a separate text layer with strong contrast. The sprite artwork itself contains no lettering.
- Open and closed gate states must agree with the simulation's authoritative state. Don't treat rotations of the whole gate frame as opening the gate.
- Level-specific physical keyboard mappings and the single-row touch keyboard are defined in application code.
- The playable `GatesPrototype` now mounts the separate SVG layers and uses one left route and one right route, while retaining keyboard and single-row touch controls. The prototype still has no level progression or persistent saves.

## Follow-up work

1. Verify visual scale, sign clarity, and sheep alignment with the curved dirt paths on actual landscape phones and desktop screens.
2. Refine gate opening transitions and sheep crossings after playtesting.
3. Run the project build and browser suite in a checkout with dependencies installed; no such test run has been performed as part of this integration.
