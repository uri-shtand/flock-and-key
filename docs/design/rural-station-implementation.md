# Station redesign implementation

## Intended experience

The station hall is home. The family has recognizable places in it, and a child can choose a story, resume a round, or see a recent purchase as soon as the menu opens. Storage labels should make something useful, restored postcards should say something funny, and the two Pitsi games give the player a choice about where to look or which route to take. The band lets the player see an English instruction happen. Noga's case lets the player revise a plausible first guess.

## Implementation plan

1. Use local, compressed copies of the approved concept art as prototype scenery. Keep the full concept studies in the design folder.
2. Keep Hebrew typing, spelling, audio, help and reporting on the existing engines. Add authored station tasks and choice points. Preserve older runs and prizes with their original content and meaning.
3. Adapt the detective evidence flow to the station as a new case edition. Add a village soundcheck on the existing bilingual rehearsal engine. Keep Gatekeepers on its current screens and simulation.
4. Add a compact station menu, activity board and souvenir shop. Store purchases on the existing local ledger. Keep previews separate from purchases so backing out costs nothing.

## Delivered behavior

- The station is the default home. Its investigation button opens the parcel case, with a saved location indicated in the menu. The separate activity board links to all six station games and the existing Gatekeepers game. The two previously hidden games are available for review in their new form.
- Storage uses authored exhibit labels, a growing row of labeled boxes and a final retrieval. Postcards use the existing local recordings, with farm-topic vocabulary left out of new station runs. Trail rounds ask which visible sign matches the clue. Courier has two persistent route choices and optional personal pacing. Its finish compares completed timings with the same route, words and support.
- Noga's three-location investigation reuses the notebook, bag, revisable boards and graded help. The opening parcel mystery is a separate case with its own evidence and an optional copy receipt. The square rehearsal ships with one original spoken soundcheck over music and the existing bilingual booklet and directing flow.
- The shop has twelve cosmetic items, live placement previews, a reusable model-train action and a choice of sibling for the locomotive pin. Farm items still equip in the farm. The current balance is shared, so revisiting or starting a new edition keeps earned bells and past purchases.
- Local WebP scenery and portrait crops derive from the [station art studies](rural-station-concept-art/README.md). Source snapshots in the parcel case are presented through readable evidence text. The far shelter borrows the former-station concept, pending dedicated environment art. The soundcheck uses locally rendered Microsoft Zira speech over an original synthesized plucked accompaniment. The track and its translation are bundled with the game.

The parent dashboard, JSON export and reset use the same profile for both editions. CSV retains word attempts and case board actions, with case edition values distinguishing the two station cases. English rehearsal results and the optional parcel receipt event are in JSON. The parcel receipt is supported copying and carries no independent spelling result. Gatekeepers uses its existing separate save.

## Playtest questions

- Storage and postcards. With the same word batch, compare a final shelf retrieval with a simple completed shelf. Does the child know why they wrote the labels? In a separate round, ask which restored postcard they want to reread.
- Pitsi. With the same words and path, compare following a stated destination with inferring it from a sign or trace. For courier, compare choosing the route with receiving the same route already assigned. Does the child ask to try the other route?
- Band and Noga. Compare a still result with a short performance for the same English instruction. Can the child explain what changed? Ask which evidence changed their theory about Noga and whether they can explain the outcome before the recap.
- Menu and shop. Give the child two kinds of saved play and ask them to resume the requested one. At the same price, compare a placed preview with a thumbnail. Ask what the child would save for and where they expect it to appear.

## Verification

The production build passed, along with 86 unit tests and all 45 Chromium tests. Browser verification used port 5198. Station coverage included Hebrew correction, copy help, refresh and resume, purchases and placement, route selection, paused scenery, the parcel receipt, the Noga notebook, the bilingual songbook, and the transition to the encore. Desktop layout checks covered 1024×600, 1280×720 and 1440×900. Screenshots of the menu, shop, trail, deduction board and songbook were reviewed. The previous farm edition and Gatekeepers went through their existing regression tests.

The two redesigned trail activities, the story beats and the shop prices still need a child playtest.

## Flatter art pass

The playable station hall, café, village locations, portraits and rehearsal actors use [the updated cartoon art](rural-station-concept-art/flat-style/README.md). The shop catalog now uses the same twelve illustrations as the previews. Each equipped item is positioned independently, and the bench arm sits in front of the cushion. Prices, purchase records and saves carry over.

The production build, 86 unit tests and all 45 Chromium tests passed for this pass. Browser checks covered the catalog's twelve illustrations, purchase persistence and the three desktop sizes. Screenshots confirmed the cushion placement and the lights hanging from the bandstand after changing preview scenes.
