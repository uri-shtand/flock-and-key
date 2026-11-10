# Architecture decisions

## Browser-first 2D

Phaser 4.2.1 renders scenes. React renders Hebrew text, inputs and controls in the DOM. Vite builds TypeScript modules. Node 24 LTS is the development baseline; no Node process is needed in production.

The React shell owns a task. A pure function validates the submitted answer. On success the shell updates local progress and sends `celebrate` through a typed bridge. The Phaser scene animates a sheep. The bridge is connected only after scene creation and disconnected at cleanup. Phaser keyboard handling is disabled so HTML inputs own typing.

This small vertical slice intentionally has no dialogue engine or difficulty engine yet. Introduce these as pure modules when an actual playable exercise needs them. Content is JSON; progress has a versioned storage key and validates loaded values. Storage failures leave the exercise usable and show an accurate message.

## Hebrew and future input work

The document and input use RTL; physical keyboard diagrams will require LTR row positioning. The initial exercise validates on form submission. Future per-keystroke exercises must distinguish physical `code` from textual `key`/input values, ignore composition until committed, and account for deletion, final letters and focus transitions. No heuristic should claim to definitively distinguish a typing mistake from a spelling mistake.

## Scope and tradeoffs

Art is drawn with Phaser primitives and requires no asset pipeline. The scene scales to a 960×460 design surface. Current build loads Phaser as a separate chunk; it is relatively large for a Hello World. Before expanding, measure startup time, asset loading and scene transitions on the target computer. Phaser 4 is an evaluation choice, not proof that it fits every future game.

The Hello World counts each correct submission as a smoke-test success; this is not the final reward or mastery system. LocalStorage persists only in the same browser profile and origin, and is not a backup.
