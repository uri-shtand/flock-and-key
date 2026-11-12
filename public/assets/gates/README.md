# Gatekeepers artwork v3

Art direction: near-top-down modern TV-cartoon farm, clean bold outlines, bright grass, sandy paths, humor in the scenery, and very visible yellow signs.

## Assets

| File | Use |
| --- | --- |
| `farm-background.svg` | Static 1600×900 farm with central **empty** sheep pen, four pen approaches, a shared winding four-gate route, crossing shortcuts and two edge pastures; no baked-in scenery |
| `sheep.svg` | Transparent 160×115 sheep sprite facing right; flip horizontally for leftward movement |
| `wooden-gate.svg` | Transparent closed wooden gate sprite |
| `wooden-gate-open.svg` | Matching open gate sprite with leaf swung aside |
| `blank-gate-sign.svg` | Transparent 260×180 yellow sign, with no baked-in text; render the Hebrew letter/sequence as HTML/SVG on top |

These are editable vector **production starter assets**, not a raster export of the AI reference image. They preserve the approved art direction and keep stateful elements independent. Original illustrated concept remains a reference rather than the game's render layer.

## Coordinate and integration notes

- Background logical size: `1600×900`. Keep the full background image aspect ratio when rendered. Mobile landscape scales the farm into the available upper region with the physical keyboard row below.
- Pen occupies `x=650..950, y=340..560`. The active stage-one exit is south at `(800,515)`; the north, west and east approaches are locked.
- `src/content/gates.ts` supplies the exact cubic curves used by sheep and by the paths in the background. Unit tests check their agreement. All sheep share four gates before splitting to `(160,510)` and `(1440,510)`.
- Draw sheep over the background. The visible pen must be empty in the underlying artwork.
- Draw a gate sprite at the desired path interception point, draw a sign above it, and render letter labels in a separate text layer with strong contrast. The sprite artwork itself contains no lettering.
- Open and closed gate states must agree with the simulation's authoritative state. Don't treat rotations of the whole gate frame as opening the gate.
- Level-specific physical keyboard mappings and the single-row touch keyboard are defined in application code.
- The playable `GatesPrototype` now mounts the separate SVG layers and uses the shared four-gate route and two pasture branches, while retaining keyboard and single-row touch controls. The prototype still has no level progression or persistent saves.

## Follow-up work

1. Verify visual scale, sign clarity, and sheep alignment with the curved dirt paths on actual landscape phones and desktop screens.
2. Refine gate opening transitions and sheep crossings after playtesting.
3. Keep map geometry and routes aligned when authoring later stages.

## Independent scenery

`scenery/` contains transparent standalone SVGs: `rock.svg`, `bush.svg`, `flower.svg`, `grass-tuft.svg`, `dog.svg`, `tree.svg`, `barn.svg`, `silo.svg`, `hay-bale.svg`, and `fence.svg`. Each file includes its own gradients and symbols; no references to definitions in the background are required. The pen, terrain, paths and pastures remain in `farm-background.svg`.

`src/content/gatesScenery.ts` defines the asset bounds/origin and the `stageOneScenery` placement list. Every instance has a stable `id`, asset name, `x`, `y`, optional `rotation` (degrees) and optional `scale`. Reuse a file for multiple props; add another asset entry for a visual variant. A later stage can supply its own placement list to `GatesScenery` without editing the base map or simulation. Array order determines draw order.

`GatesScenery` gives each instance a separate SVG group identified by `data-scenery-id` and `data-scenery-asset`. The placement group owns world translation/rotation/scale; animations can target its inner image without replacing that transform. All props render below sheep/gates and below the dusk tint. No animation or random repositioning is enabled by this extraction.
