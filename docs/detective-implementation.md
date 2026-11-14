# Noga's lift — implementation plan

Experience: a small, funny Hebrew point-and-click adventure, with reading as a useful detective tool. The player investigates a cart, presents a ribbon to witnesses, follows today's delivery, and discovers Noga's makeshift fashion runway. No typing, timer, scores or compulsory end quiz. The user's priority is fun over educational assessment.

Why might this be fun? Choosing an inspection order, making characters react to evidence, checking a wrong lead without punishment, and discovering a sheep with a ridiculous secret should make the player feel like an investigator. The notebook should help act on a theory rather than become a worksheet.

Implementation: authored passages and responses in src/content; pure decisions and invariant validation in src/typing; React owns exploration, notebook, assistance and local records; Phaser renders two illustrated stages through visual snapshots, with HTML hotspots. Reuse the existing charcoal/tan Pitsi design and farm palette. New art will be original code-drawn primitives, without external assets. Shared progress gets an optional versioned case collection: old word saves load unchanged; invalid cases are isolated. Case actions appear separately in parent reporting and JSON/CSV, and existing parent reset clears them. No Gates changes.

Visual direction: a cart-centered farm stage and a stone bridge, with a warm paper investigation panel beside the world. Scene hotspots remain actual HTML buttons. Witness sources and notebook appear in the same panel, keeping the world visible at 1024×600. Avoid stacked modal worksheets; use short source strips and one active deduction at a time.

Adaptation: [Duck Detective's official developer/publisher listing](https://store.steampowered.com/app/2637990/) (checked 14 November 2026) describes inspecting evidence and interviewing suspects to deduce a solution. Adapt that observation → conversation → theory loop and character comedy for a gentle farm case. Replace adversarial interrogation and blank-filling with acting on a choice and optionally attaching a passage. The existing small-case GDD remains reference material and is unchanged.

Verification planned: rule/support combinations, save invariants and corruption isolation; complete supported, assisted and exploratory browser paths; help, refresh, keyboard focus, reduced motion, pause, console errors and clipping ancestors at 1024×600, 1280×720 and 1440×900. Run build, unit suite and full existing browser suite on 5186.

Human trial: ask which discovery was funniest, where the player wanted to click, whether today's trip and the changed bridge instruction made sense, and where it felt like work. Compare only free versus guided witness order with identical text. Replaying a known solution does not measure learning. Duration and enjoyment require a human trial.

## Delivered behavior and deliberate deviations

- Home exposes **תיק בלשי קטן**. The farm has six HTML hotspots, two witnesses, inspectable ribbon/hoofprints and optional picnic-basket humor. The bridge has a keeper's note and two inspectable locations. Original Phaser art uses the existing farm palette, sheep shapes and charcoal/tan Pitsi. The reveal moves the screen, lets the ribbon flutter and gives Pitsi a brief imitation spin.
- Source strips remain full-context reading surfaces. Bookmarks and tentative choices persist by decision. Both yard-link orders work; opening sources does not solve them. Lower-arch exploration gives a recoverable response; upper-platform exploration can complete the story without fabricated comprehension success.
- The notebook has one active link at a time rather than a simultaneous spread or drag-and-drop proof board. Free help opens a separate compact reading panel, keeping the three-tier ladder readable at 1024×600. There are no timing gates, copying tasks, points, grades or final quiz.
- The lab supplies optional guided conversation suggestions, hotspot labels, extra motion reduction, defaults and copyable effective settings. Applying restarts explicitly; replay preserves effective settings. The label toggle also works during a run. Guided presentation suggests a next witness without forbidding free exploration.
- Version-1 case events are an additive optional extension of the shared version-2 game store. Loading validates an entire run by replaying authored invariants. Invalid/unknown-version cases are isolated without dropping word progress or other valid cases. Parent reporting and JSON/CSV distinguish case-specific support, revision, hints, guided completion and exploratory discovery. The existing reset includes cases; the separate Gates store remains unchanged.
- This implementation intentionally does **not** add prerecorded case narration, runtime speech, read-aloud controls, a generated second case, or a new learning-level estimate. Modality is text, with adult help explicitly unobservable. The source GDD is preserved. Human Hebrew review, pacing and enjoyment remain open questions.

## Human playtest recipe

Let the child choose the first object and avoid prompting a correct answer. Observe whether the ribbon motivates a witness conversation, whether the delivery comparison produces an “aha”, and whether the bridge feels like a new place worth exploring. Ask “מה היה הרגע הכי טוב?”, “למה לא האסם?” and “איפה זה הרגיש כמו עבודה?” without making an exit quiz.

Change only free versus guided conversation suggestions on a replay to compare navigation preference. Keep wording, evidence and assistance fixed. A replay already contains answer knowledge; use unfamiliar matched cases for any future claim about comprehension transfer. Target duration remains a hypothesis, never a minimum-time lock.

## Verification record — 14 November 2026

- `npm test`: **72 tests passed** across ten files, including support combinations, both yard orders, all-help completion, exploratory recovery, duplicate completion rejection, event/snapshot invariants, persistent bookmarks/choices, corruption isolation, exports and reset.
- `npm run test:e2e`: **36 tests passed** in the final full run. All agent-managed browser traffic and the Vite test server used **5186**. Chromium used the already-present libraries under `/tmp/flock-browser-deps`; no dependency or lockfile change was needed.
- Detective browser checks covered supported completion, wrong barn/lower-arch recovery, refresh and paused resume, parent reporting, assisted links, exploratory discovery, keyboard activation, OS reduced motion, lab and all desktop sizes (1024×600, 1280×720, 1440×900). Canvas screenshot equality verified that pause freezes the reveal. Existing Hebrew input, correction, composition, copying, word persistence and Gates checks passed.
- Bounds assertions checked both viewport and clipping ancestors. Reading and ending screenshots were inspected at the required desktop sizes. Browser testing caught and fixed a generic hover transform displacing hotspots, a bridge-note label near a clipping edge, and the added home button wrapping the compact home menu. Help now uses its own focused panel rather than stacking on a deduction.
- `npm run build`: **passed**, with strict TypeScript and production output.
- No human playtest has been performed. Enjoyment, natural Hebrew, age suitability and first-play duration remain unverified.
