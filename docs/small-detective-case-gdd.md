# Small detective case: הטרמפ של נוגה

**Flock & Key mini-game GDD · Version 0.2 · 14 November 2026**

Status: proposed design, ready for content review and a small playable prototype. This document specifies future behavior; it does not describe an implemented game or verified learning outcomes. The original [GDD](design/sheep_mystery_gdd_he.md) remains unchanged.

## 1. The promise

**“I noticed something, asked the right question, and found the sheep.”**

A short illustrated point-and-click mystery in Hebrew for a child aged 10–12, on a desktop with a physical Hebrew keyboard. Tom and Pitsi investigate a sheep's unexpected trip. The player explores the farm yard, reads witness accounts and delivery records, follows a justified lead to the bridge, then interprets a second message to find the sheep's hiding place. **The educational focus is הבנת הנקרא (reading comprehension).** Reading changes where the player goes and what they discover. There is no compulsory copying, spelling task or typed answer.

Target first-play duration: **5–10 minutes**, with approximately seven minutes as an initial pacing hypothesis, to be measured with the child. Two compact playable scenes and three connected decisions supply that time. No minimum-time lock, countdown, lives, deduction score or speed requirement. A quick reader may finish sooner; slower reading and free help may take longer. The primary reward is finding a particular sheep and seeing what she has been doing.

| Requirement | Design commitment | Evidence to seek in playtesting |
| --- | --- | --- |
| Fun | Choose an investigation order, test a theory, discover a sheep's comic secret | The child explains a choice, experiments voluntarily and wants another case |
| Educational | Retrieve details, interpret time and references, combine sources and support a conclusion with text | The child uses relevant passages to make a choice; help and source modality remain visible in records |
| Connected to the larger theme | Tom, Pitsi, Dad, the postman, farm deliveries and a sheep with a personality | The case feels like part of the same farm mystery |
| Looks and feels like a game | A staged illustrated world, inspectable props, expressive characters, an in-world notebook and an animated resolution | The child starts investigating the scene rather than looking for a questionnaire |

## 2. Why might this be fun?

The pleasure comes from changing an uncertain situation through observation and reading: a ribbon identifies a sheep, a delivery record distinguishes today's trip from tomorrow's, and a message at the bridge changes where to look. The player chooses what to inspect and whom to ask. Familiar characters react to those choices. Each supported prediction opens a new action in the world, culminating in a comic sheep reveal.

The main risk is that collecting glowing objects or matching a repeated word feels automatic. Consequently, opening sources does not auto-complete deductions. The player selects a useful passage and acts on its meaning. Both destinations appear in the delivery record; both bridge locations appear in the final message. Understanding time and contrast matters. Help points toward a relationship before giving the answer. The full explanation remains available for comfortable completion.

This is a hypothesis. Successful automated completion cannot establish enjoyment or improved reading comprehension.

## 3. Story, scope and place in the larger game

Working Hebrew title: **הטרמפ של נוגה**. Home-menu label: **תיק בלשי קטן**.

The farm is preparing for a picnic. Noga, a curious sheep wearing a star-patterned ribbon, is missing from the preparations. Dad thinks she followed the food to the barn. The postman's cart has just returned from a delivery. Tom investigates before everyone searches the wrong place.

Noga climbed into the cart and travelled to the bridge. The player visits the bridge, interprets a delivery-placement message, and checks the upper platform. At the reveal Noga is standing on the delivered rug behind a low screen, treating the bridge breeze as a fashion-show fan. The remaining length of her ribbon streams behind her. She is safe; the joke belongs to the sheep and adults, never to the child's mistakes.

This is a standalone side case, as the existing nighttime celebration chapter is. It does not identify one of the original missing five, establish a culprit, explain the closed pen or resolve the festival conspiracy. A future chapter may reuse this interaction, after a separate story decision.

The episode establishes habits useful to the larger adventure: inspect an object, distinguish an observation from a guess, reread a witness account, compare written sources and check a lead. Its ending can return directly to Home. It uses two bounded scenes with direct transitions; it does not require an open village map or a Gates round.

## 4. The authored mystery and reading sources

The first scene has three inspectable evidence objects, two witnesses and three short reading sources. The second scene adds one message and two places to investigate. The following Hebrew passages are proposed playable content, subject to human review for clarity, natural language and age suitability.

### Farm-yard evidence

| ID | Object and observation | Contribution and limit |
| --- | --- | --- |
| E1 | A torn star-patterned ribbon caught inside the cart | Connects the cart to Noga through Dad's account; alone it cannot prove she boarded |
| E2 | A delivery book with separate entries for today and tomorrow | Establishes the relevant journey; destination recognition alone is insufficient |
| E3 | Fresh flour hoofprints leading from the picnic table onto the boarding plank | Supports a sheep boarding; alone it does not identify the sheep or its destination |

**S1 — Dad's account**, available through conversation and as a rereadable notebook quotation:

> הבוקר קשרתי לנוגה סרט עם כוכבים. לשאר הכבשים יש סרטים חלקים. אחר כך הנחתי לחם על שולחן הפיקניק, ונוגה התקרבה אליו. כשחזרתי עם הצלחות, היא כבר לא הייתה שם. אולי הלכה לאסם, כי שם שומרים את האוכל. לא ראיתי אותה הולכת לשם.

**S2 — Today's and tomorrow's delivery entries**, presented as a small illustrated delivery book:

> היום: לקחת את השטיח מהחווה אל הגשר. להניח אותו במקום שקבע שומר הגשר ולחזור לחווה בלי עצירות נוספות. מחר: לקחת את סלי האוכל אל האסם. הסלים יישארו בחווה עד הבוקר. אין צורך להעביר אותם היום.

**S3 — The postman's account**, with a concrete reference to the book:

> יצאתי אחרי ארוחת הבוקר עם השטיח שבתוכנית של היום. את הסלים השארתי ליד אבא; הם מיועדים למחר. כשהגעתי ליעד, פרקתי את השטיח וחזרתי ישר לחווה. לא בדקתי אם מישהו התחבא מאחוריו. עכשיו מצאתי בעגלה את הסרט הזה. קודם חשבתי שהוא קישוט של השטיח.

These accounts deliberately contain different kinds of information: a distinguishing feature, an observation, an admitted guess, a schedule and an explanation referring back to another source. Do not automatically highlight the correct clauses on first opening.

### Three connected decisions

| Decision | In-world action | Required meaning and accepted support | Consequence |
| --- | --- | --- | --- |
| D1: Who probably boarded? | Place Noga's portrait beside the cart sketch, then attach a passage token | E1 plus Dad's star-ribbon sentence; E3 supports boarding. The alternative sheep has a plain ribbon, consistent with S1 | Tom marks a tentative Noga-to-cart link; this remains a lead, not certainty |
| D2: Where should we search? | Choose bridge or barn on the map and support the choice from the delivery book | Today's bridge entry plus S3's confirmation of doing today's trip; tomorrow's barn delivery does not establish a visit today | Pitsi and Tom travel to the bridge |
| D3: Where at the bridge? | Read the keeper's message, then inspect the lower arch or upper platform | Identify the current placement from S4, rather than choosing its first mentioned location | Correct interpretation opens the screen beside the delivered rug and reveals Noga |

Sources and witness topics in the yard can be visited in any order. D1 and D2 appear on the same notebook spread; either can be proposed first. Departure requires both supported links or their explicitly assisted equivalents. Inspection and testimony prerequisites are facts needed for the inference, not a demand to exhaust all dialogue. E3 remains corroborating evidence; collecting it is not a compulsory quota.

To support a theory, select one of the source's two or three sentence-sized strips and place it beside the relevant sketch. Retain the full passage above the strips and provide one-action return to its context. Accept all authored strips that genuinely support that link, including supersets containing the key clause; do not require an arbitrary exact substring. For D2, keep the today/tomorrow entries separately selectable. Hearing a passage or merely opening it never constitutes acceptance.

### The bridge message

**S4 — A note from the bridge keeper**, pinned beside an illustrated plan of the two areas:

> לדוור: בדרך כלל מניחים משלוחים מתחת לקשת, אבל היום הרצפה שם רטובה. את השטיח הנח על הבמה שמעל הקשת, מאחורי המחיצה הנמוכה. הרוח מגיעה לשם, ולכן שים אבן על כל פינה שלו. את הסלים של מחר השאר ליד הכניסה; הם לא צריכים להגיע לבמה.

The delivery is fresh. The rug is behind the screen on the platform; Noga is concealed beside it until the player investigates. The setting shows an upper platform and lower arch clearly, but neither location has a visual answer marker. Do not let a waving tail or camera framing reveal the solution before the reading decision. The platform is safely enclosed; the visit does not involve climbing or crossing a hazard.

Choosing the lower arch produces a brief inspectable view of the wet paving and a neutral prompt to reread the change in the note. Return immediately to the same bridge scene. This is a recoverable exploration action, not a dead end or repeated loading sequence. Trying both locations is possible, but the record must distinguish exploratory discovery from a text-supported choice. A full-assistance path lets everyone finish.

**Intended explanation:** the star ribbon connects Noga to the cart; the cart followed today's bridge delivery rather than tomorrow's barn delivery; the note places today's rug on the upper platform, where the sheep is found. Nobody's statement directly supplies that whole explanation.

## 5. Play loop and 5–10 minute pacing

| Beat | Approximate first-play budget | Player action and payoff |
| --- | --- | --- |
| Arrival | 30–45 seconds | Dad's short opening establishes the missing sheep; immediate control |
| Yard investigation | 2–3 minutes | Inspect props, read S1–S3 in chosen order, show a clue to a witness, optionally investigate Pitsi's picnic-basket theory |
| Connect identity and journey | 1–2 minutes | Support the two notebook links, compare today with tomorrow, revisit a source if needed |
| Bridge investigation | 1–2 minutes | Read S4, inspect the plan, choose and justify the search area |
| Sheep reveal and case closure | 30–60 seconds | Open the screen, see Noga pose on the rug, connect the discovered facts in a short notebook recap |

These estimates total roughly 5–9 minutes before optional exploration or extra rereading. They are an authored-content budget, not required waiting. All text advances on the player's action; animations are brief and skippable. If human play is too short, add a meaningful source relationship or richer character interaction after testing. Do not lengthen transitions, lock a timer, repeat questions or add copying to reach five minutes.

Opening exchange:

> אבא: “נוגה נעלמה מההכנות לפיקניק. אולי היא הלכה אחרי האוכל לאסם?”  
> תום: “נבדוק מה קרה לפני שנשלח לשם את כל המשפחה.”

Optional joke: ask Pitsi whether he suspects the picnic basket. He sits beside it hopefully. Tom: “את ארוחת הבוקר כבר חקרת.” One extra postman response can react to the ribbon: “אם השטיח התחיל לגדל צמר, אני מבקש עגלה גדולה יותר.” These are authored discoveries with no completion requirement.

Supported links produce small world consequences: Dad checks Noga's portrait against the ribbon, the postman traces today's trip, and Pitsi waits beside the selected exit. At the bridge, moving the screen reveals Noga's fashion-show pose and Pitsi's attempt to imitate it. The final notebook recap is assembled from the player's accepted links; it adds no final quiz or typed summary.

Actions should normally acknowledge input within 150 ms; larger inspection responses should settle in approximately one second. These are initial feedback targets, not limits on reading time. Reinspection and rereading do not replay long entrances.

## 6. Educational design: הבנת הנקרא

The central learning action is **using a text to decide what to do in the world**. No destination copying, spelling validation, mandatory typed explanation or generic comprehension questionnaire is included. A player can complete the case with mouse or keyboard. An optional spoken explanation to an adult belongs to playtesting, not automated grading.

| Comprehension opportunity | Concrete case action | Observable evidence and limitation |
| --- | --- | --- |
| Retrieve an explicit detail — איתור מידע | Connect Noga to the distinctive ribbon described by Dad | Correct portrait plus supporting sentence; a lucky choice is still possible |
| Distinguish observation from interpretation — עובדה והשערה | Prefer Dad's actual ribbon observation over his barn guess | Chosen passage and any revision; do not infer general mastery |
| Interpret temporal relationships — רצף וזמן | Distinguish today's rug delivery from tomorrow's food delivery | Bridge choice supported by the correct dated entry and S3 |
| Connect references and sources — קישור מידע ואזכורים | Resolve “התוכנית של היום”, “הם” and “שם/לשם” through their context | Successful source pairing; no separate terminology drill |
| Interpret contrast and an updated instruction — הסקת מסקנות | Use “בדרך כלל... אבל היום...” to search the upper platform | Current-location passage attached before inspecting the area |
| Support a conclusion — ביסוס מסקנה | Place a relevant passage beside the chosen route or location | Choice and evidence recorded separately, including assistance |

### Reading load and access

Initial content budget: four core passages of approximately 35–55 Hebrew words each, roughly 140–220 words total before short dialogue and feedback. The current drafts contain 42, 35, 43 and 44 whitespace-separated words (164 total). Recount and review the final authored text before implementation; these are sizing targets, not validated reading levels. Split longer witness speech into two short player-paced bubbles while preserving access to the whole account. The delivery book and keeper's note remain readable artifacts, not dense walls of text.

Keep sources available during reasoning. No memory requirement, disappearing text, speed reading, automatic scrolling or countdown. A free bookmark lets the player pin a sentence without asserting it is correct. Revisiting a passage is a productive reading strategy and carries no penalty.

Optional prerecorded read-aloud is available sentence by sentence with matching text. Reading with audio, audio-only access and text-only access are recorded distinctly where observable. Never classify an audio-supported result as proof of independent reading. It is always valid story participation. An adult may help or use a full explanation without reducing the reveal or reward.

### Local records and reporting

Record each decision's proposed action, supporting passage IDs, attempts/revisions, sources opened, requested read-aloud, hint tier, guided completion and whether an area was discovered by unsupported exploration. Record first unassisted choice and eventual supported completion separately. Do not assign a broad reading level, diagnose a difficulty or infer comprehension merely from source-open time.

Investigation engagement time may describe pacing; it is not typing speed or a reading-fluency score. No new spelling/typing records are emitted by this mini-game. Parent reporting labels these observations as case-specific comprehension actions and assistance, separately from the existing typing and spelling metrics.

A same-case replay contains answer knowledge; it cannot establish comprehension improvement. Any later claim about transfer needs comparable new texts and cases across sessions. The first prototype tests whether reading-led investigation is enjoyable and understandable.

## 7. Gentle recovery and free help

Use **“רמז לחקירה”**, **“קוראים יחד”** and **“מה אפשר לבדוק?”**. These have distinct purposes: clue relationships, reading access and hotspot discovery. Help remains immediately available, with no reward penalty.

Each decision has a three-step ladder:

1. Locate: return to the relevant source, without selecting the answer. For D2: “בפנקס כתוב מה עושים היום ומה עושים מחר.”
2. Connect: place the two relevant passages side by side and emphasize the relationship. For D3: compare the usual location with the exception for today.
3. Explain and act together: explicitly assemble the supported link, explain it and offer **“נבדוק יחד”**. Record assisted completion.

Wrong choices do not automatically disclose the next tier. A valid conclusion with unrelated support receives “זה יכול להיות כיוון. איזה פרט בטקסט מחזק אותו?” A barn theory receives “אבא ניחש שנוגה באסם. איזו נסיעה הדוור כבר ביצע, ואיזו מתוכננת למחר?” The response must refer to the actual uncertainty without repeatedly demanding the same clicks.

If the child explores the right location without textual support, allow the discovery and story payoff. Mark that decision as exploratory or assisted, rather than retroactively asserting reading success. Offer the explanation once as part of the notebook recap; do not force a post-discovery test.

No buzzer, red cross, lost life, public mistake joke, erased notebook or indefinite blockage. All paths receive the same sheep reveal and case stamp. Parent-facing records distinguish independent support, help, exploratory discovery and solved-together paths. No accuracy medal or shared currency is introduced.

## 8. Art direction: an adventure scene with playable props

Use the existing farm's illustrated shapes, sheep proportions and charcoal-and-tan Pitsi as the visual starting point. Before implementation, visually inspect the current Gates farm, dog, sheep and scenery SVGs, plus their [art manifest](gates-art-manifest.json). Reuse or adapt only assets that fit the new composition. Record source, modifications and license/provenance for every new asset. This document adds no artwork.

**Memorable image:** a slightly oversized, battered post cart parked diagonally in the farm yard, its open interior inviting inspection. Dad leans on a picnic table; the postman checks his delivery bag. The cart anchors the composition, rather than a central panel containing tasks.

Initial palette: pasture green `#557A46`, sky blue `#A9D5E5`, cart blue `#365C83`, timber brown `#795436`, ribbon plum `#854A79`, ink `#26342C`. These describe art colors; all text backgrounds need separate contrast verification. Ribbon stars supply a shape cue as well as color.

Hebrew text uses the existing readable local font stack; decorative lettering belongs on scenery, never in instructions. Start dialogue at 20 px and controls at 18 px. At the smallest viewport, use shorter dialogue beats and alternate views before reducing text size. Text contrast must reach 4.5:1. Interactive targets should generally be at least 44×44 CSS px.

### Screen composition

The persistent play view contains a full illustrated scene, a short objective at the top and a small notebook tab and pause/audio controls at the edges. The objective is “לאן כדאי לחפש את נוגה?” No web navigation bar, hero section, stacked feature cards, progress dashboard or quiz form.

```text
+-------------------------------------------------------------+
| pause/audio          לאן כדאי לחפש את נוגה?       notebook tab |
|                                                             |
|   picnic table            open post cart          postman   |
|       Dad              ribbon / slip / prints                |
|                    Tom                 Pitsi                |
|                                                             |
|         contextual speech or one brief action prompt         |
+-------------------------------------------------------------+
```

Positions are composition guidance, not fixed pixel coordinates or Hebrew reading order. Dialogue and notebook content flow RTL; paths and physical spatial relationships retain their actual world directions.

Use focused views for the yard, inspection/conversation, open notebook, and bridge. Reading artifacts occupy their own close-up view when needed. At most one detail view is active. The world remains visible where space permits; the notebook can replace most of it at 1024×600. Do not fit a full notebook, source comparison, dialogue transcript and scene side by side.

The notebook is an illustrated double-page spread. In the yard it shows three evidence sketches and the identity/journey links; at the bridge it shows the current location link. Display only the active link and its source comparison when space is limited. Evidence behaves like tangible tokens, with click-to-place and keyboard alternatives. Its text explains observed facts and current guesses separately. No long activity feed or scrolling witness transcript.

### Interaction and feedback

- Hover **and keyboard focus** make a prop respond with a gentle outline, short label and small pose change. A free “מה אפשר לבדוק?” action reveals all hotspots. Clues are readable objects, not tiny pixel hunts or permanently flashing answers.
- Selecting a clue lifts a sketch into the notebook; the object remains in the world and stays inspectable. Putting a token into a theory is reversible.
- Witnesses turn toward the presented clue. Pitsi's nose, ears and tail provide brief reactions to discoveries, not perpetual distraction.
- Accepting the route sends Tom and Pitsi to the bridge; interpreting the keeper's message enables the final search. The reveal shows Noga's ribbon and the delivered rug, confirming facts already established.
- A soft paper sound, a character gesture and a visible change suffice. Avoid routine screen shake, confetti, scoring popups and input-blocking celebration.

All actions are keyboard accessible with visible focus and accessible names. Escape closes a detail view first, otherwise pauses. Dialogue never depends solely on audio; clue identity never depends solely on color. No drag-only action, rapid reaction or fine motor tracing is required.

## 9. Audio, pause and compact desktop behavior

Use existing bundled music where appropriate, quiet paper/cart/hoof sounds and optional locally prerecorded Hebrew dialogue. Final speech requires a human pronunciation pass. Music and speech keep independent controls and speech ducking. Missing speech leaves full readable dialogue; it cannot prevent investigation.

Pause freezes characters, clue transitions, scenery, pending reveal actions and simulation-driven effects. Blur and hidden tabs pause safely. Resume is explicit. OS reduced motion removes travelling token animations, camera moves and repeated ambient movement while keeping clear static state changes. No essential clue relies on a moving or sounding object.

Home, introduction, yard, bridge, inspection, conversation, source close-up, source comparison, notebook, hints, read-aloud controls, assisted solution, pause, refreshed resume and ending must fit **1024×600, 1280×720 and 1440×900** without scrolling. Split help and dialogue into short steps when necessary. Keep close/back/travel/search/resume controls inside every clipping ancestor. The pause screen must be usable while the world is frozen.

## 10. Prototype limits, variation and adult controls

Ship one fixed case first. No procedural clue generation, live AI dialogue, arbitrary typed questions, open-world walking or connection to Gates simulation. A solved case replays honestly as the same case; knowledge of its answer is not new reasoning evidence.

Within this case, introduce one reading relationship at a time: explicit identity detail, today-versus-tomorrow across sources, then a usual-location-versus-current-exception instruction. Bridge text should not also become longer or use harder vocabulary. Future cases may introduce an ambiguous witness detail or event ordering separately. No timing pressure or simultaneous increases in text length, vocabulary and inference depth.

An adult **“מעבדת החקירה”** dialog exposes the same configuration used by browser tests:

| Setting | Default and bounds | Application behavior |
| --- | --- | --- |
| Witness-topic presentation | Free choice; alternative guided order | Applying starts a new case; all story facts remain identical |
| Hotspot guidance | On focus/hover; alternative all labels visible | Can change during play without restarting |
| Motion | Follow OS; optional further reduction | Can change during play without restarting; cannot override OS reduction |

Applying a restart setting explicitly says **“החלת השינוי תתחיל את התיק מחדש.”** Save the effective settings with the run; provide copyable JSON, authored-default reset and replay using the same settings. Keep clue count, destination and vocabulary authored. No hidden test-only shortcuts or meaningless difficulty slider.

## 11. Implementation boundaries and persistence contract

This section constrains later implementation; this task changes the GDD only.

- React owns scene/phase, discovered facts, source passages, read-aloud requests, witness topics, proposed links, supporting passage IDs, hints and accessible HTML controls. Pure case rules and validation live in `src/typing`; authored Hebrew passages, accepted support relationships and dialogue live in `src/content`.
- Phaser owns the illustrated yard and bridge, character poses and visual feedback through typed commands. It never evaluates reading answers or duplicates learning state. Disable global keyboard capture. Support pause and reduced motion explicitly.
- Use HTML buttons for hotspots and source strips, with visible focus and keyboard alternatives to dragging. Physical shortcuts use `KeyboardEvent.code`. No shortcut fires behind a dialog; no text input is required for this case. Clean up scenes, callbacks, animations, audio and listeners on unmount.
- Integrate case records into the shared local progress model through a documented schema migration. Preserve existing word sessions, prizes and separate Gates saves. Parent dashboard and JSON/CSV export include a distinct comprehension-case category with decision, evidence, assistance and modality fields. Parent reset clears these case records through its existing confirmation flow. Gates' separate reporting/reset behavior is unaffected.
- Save content/schema version, run ID, active scene and phase, effective settings, inspected clues, opened sources, heard statements, bookmarked passages, proposed links, selected support, decision history, assistance/modality, accepted-link receipts, exploratory discoveries and completion receipt. Save meaningful changes and resume paused after refresh; accepted links and help history survive.
- Validate against authored invariants: passage IDs belong to the source/content version; each independently accepted link has its required source/support relationships; a guided link has an explicit assistance receipt; bridge access follows accepted or assisted yard links; ending follows a supported, exploratory or assisted bridge discovery. Source opening alone cannot manufacture a success receipt. Reject duplicate completion and impossible phase/scene combinations. Unknown content versions restart only the affected case with an explanation, retaining historical results.
- Storage failure leaves play usable and visibly reports that progress may not survive closing. No accounts, telemetry, runtime AI, remote font or cloud dependency is introduced.

## 12. References and adaptation decisions

The local [mechanics research](mechanics-research.md) supplies the foundation: 27/28/35 (notebook, deduction, evidence questions), 34 (free graduated assistance), 40 (authored silly responses) and prototype P3. Mechanic 23 (restore/use the meaning of a message) informs acting on written information; no restoration or typing exercise is required. The user-selected educational focus is reading comprehension.

| Primary source | Mechanic adapted | Why it fits / boundary |
| --- | --- | --- |
| [Duck Detective — developer/publisher description](https://store.steampowered.com/app/2637990/) | Inspect evidence and assemble a deduction | A compact route from observation to explanation; require meaningful support while keeping reading access free |
| [Professor Layton vs. Phoenix Wright — official manual](https://www.nintendo.com/eu/media/downloads/games_8/emanuals/nintendo_3ds_2/professor_layton_vs__pheonix_wright__ace_attorney/ElectronicManual_Nintendo3DS_ProfessorLaytonVsPheonixWrightAceAttorney_EN.pdf) | Present evidence when questioning a witness | Gives a conversation a purposeful action; replace adversarial pressure with friendly clarification |
| [Professor Layton — Nintendo introduction](https://www.nintendo.com/en-gb/News/2011/The-Beginners-Guide-to-the-Professor-Layton-Games-253601.html) | Graduated puzzle assistance | Preserve discovery while keeping all help free; no hint coins |

These references support broad mechanics. This case, script, evidence logic and priorities are original design proposals. The existing research used primary descriptions/manuals, not a new hands-on evaluation. Before copying any more detailed interaction, inspect representative gameplay and record its waiting, failure recovery and help behavior.

The game-feel skill informs short action-linked feedback and restrained motion. The game UI/UX skill informs focused views, readable controls and reliable focus. The frontend-design skill informs the cart-centered composition and subject-specific visual language. Project requirements take precedence over generic mobile/gamepad advice in those skills.

## 13. Delivery plan and verification

1. **Content pass:** a Hebrew reader reviews S1–S4, passage boundaries, references, temporal language, contrast and every accepted support relationship. Check the three decisions with the whole source visible. An alternative interpretation must receive either fair acceptance or a text revision before implementation.
2. **Yard prototype:** implement cart evidence, witnesses, source rereading, portrait/route links and a public lab. Check that pictures alone do not solve the text-dependent decisions, and opening all sources does not auto-solve them.
3. **Complete investigation:** implement the bridge scene, keeper's message, current-location choice, exploratory recovery, reveal, source-linked recap and reading assistance. Add progress/reporting/export/reset integration and saved effective settings.
4. **Presentation pass:** add coherent art and character reactions; verify the game composition, compact reading views, readable controls and reduced-motion alternatives.
5. **Human trial:** observe 5–10 minute first-play pacing and actual use of texts before authoring more cases. Record actual behavior, deviations and results against this GDD.

Logic checks cover every decision/support combination, alternate valid strips, both yard-link orders, early theories, source opening without comprehension actions, help tiers, text/audio assistance categories, unsupported discoveries, duplicate completion, real-run snapshot validation, corruption/migration and reporting/export/reset.

Browser checks cover Hebrew RTL passages, keyboard-only source comparison and evidence placement, focus return after rereading, read-aloud/help, complete assisted and unassisted routes, exploratory lower-arch recovery, mid-action pause/resume, OS reduced motion, refresh before/after each decision, navigation cleanup and console errors. No new typing task is added; retain existing Hebrew input/correction/composition coverage as regression checks for the shared application.

Run `npm run build`, `npm test` and `npm run test:e2e` when implementing. Use the configured test server/base URL on **5186**, never the user's 5173 server. Assert bounds against clipping ancestors and inspect screenshots at all three desktop sizes for every state in section 9. This documentation task claims no browser or human test result. Build remains required before every eventual commit/push, including documentation-only changes.

### Human playtest and one-variable comparisons

Observe whether the child opens and revisits sources voluntarily, uses a passage rather than a visual guess, explains today's trip, understands the changed bridge instruction and enjoys the reveal. Record first-play duration by beat, help/modality, confusion, optional jokes and voluntary continuation. Do not hurry a reader or withhold help to collect an unassisted result.

Primary comparison: **free witness-topic choice versus guided topic order**, using identical text, art, inference demands and assistance. The existing lab exposes both conditions to adults and browser tests. Change only topic order. Compare preference and friction on a replay; use matched new cases with counterbalanced order for any later comprehension comparison because the solution is already known.

A subsequent, separate comparison may test **manual source return versus a pinned source beside the active link**. Keep passage wording, assistance and question order fixed. Do not combine both comparisons in one trial.

Ask: “איזה משפט עזר לך להחליט?”, “למה לא האסם?”, “מה השתנה בהוראות של שומר הגשר?”, “מה היה הרגע הכי טוב?”, “איפה זה הרגיש כמו עבודה?” These are optional conversational probes after the relevant action, not an extra child-facing quiz. Offer another case, Gates or stopping without rewarding selection of this mini-game.

Keep the direction if the child can connect text to an action with appropriate support and wants another mystery. Revise if they mostly guess, inspect every answer, misunderstand text references or spend most time managing panels. If play falls outside 5–10 minutes, identify the cause before changing content: remove interface friction for a slow run; strengthen a meaningful inference for an overly thin run. Never add waiting or a word-copying quota. Broader reading improvement requires separate observations with unfamiliar texts across time.

## 14. Design delivery record and open questions

Version 0.2 changes the first-play target from 3–5 to **5–10 minutes** and replaces destination writing with **הבנת הנקרא**. It expands the design to two bounded playable scenes and three connected decisions, provides four Hebrew source passages, and updates help, presentation, records, persistence, verification and playtesting to match. The extra time comes from reading, comparing, investigating and testing a lead.

Delivered: revised design only. Application behavior, original GDD and artwork remain unchanged. No mini-game, child playtest, verified reading level or browser result is claimed. Implementation notes must later record delivered behavior, deviations, checks and unresolved questions.

Open questions for content review and the first trial:

- Are the four passages natural, readable and interesting for this child at the proposed length?
- Does the today/tomorrow comparison create an understandable discovery rather than a trick?
- Does the bridge instruction provide a satisfying second inference without repeating the yard problem?
- Can the player support a choice using meaning rather than simply matching a repeated word?
- Does the case occupy 5–10 enjoyable minutes without repetitive reading or interface overhead?
- Is the fashion-show reveal appealing without feeling too young?
- Are source close-ups, comparisons and help comfortable at 1024×600?
- Does free witness order improve agency, and does read-aloud remain easy to access?
