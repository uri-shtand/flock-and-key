# Mobile and desktop play

## Intended experience and plan

All five mini-games should be playable with thumbs on a phone in either orientation, while the existing physical-keyboard desktop experience still fits its viewport. Preserve the farm palette, Arial Hebrew type, story and authored challenge settings. The task and its main action take priority over scenery and global tools. Mobile pages may scroll naturally, especially while the software keyboard is open; desktop child screens retain their no-scroll requirement.

Why might this be fun? Children can follow Pitsi and finish the same small missions without fighting tiny buttons or losing an instruction behind a keyboard. Gates should feel like operating a small control desk: map first, clearly named group guidance, generous gate buttons and free help.

Implementation: collapse global tools into an explicit mobile menu; reduce decorative world space; move optional keyboard help below the task; keep native Hebrew text entry and composition handling; avoid automatically opening the software keyboard between tasks. Give Gates a portrait-friendly map, grouped touch controls, and viewport-based dialogs that cannot be clipped by the map. Preserve level tuning, scoring, saved runs, pause and reduced motion. Reuse existing SVG artwork; no new assets or external game mechanics are needed for this layout adaptation.

## Verification and delivered behavior

Delivered: the global mobile tools menu, compact task screens with secondary help below them, native text entry with an explicit keyboard action, and no automatic touch focus between tasks. Desktop retains its existing column layout and physical-key focus. Gates hides the global header, places levels/help/lab/home under Options, freezes simulation while Options is open, presents only active gate buttons (at least 44 × 44 pixels), and moves group guidance beside the map in landscape. Help, pause, ready and summary overlays use the phone viewport; long dialogs and the lab scroll internally. Existing scenes, learning metrics, saved settings, help and authored difficulty are preserved. No art was added.

Mobile allows natural vertical scrolling instead of enforcing the desktop no-scroll rule. Decorative hands and scenery are reduced or omitted during mobile input. Gates starts with its round introduction; choose Options after starting to change levels or return home. Closing help leaves the round paused: resume, then close Options to continue movement.

Verification: production build and 66 unit tests passed. The 32 desktop browser scenarios passed, including 1024×600, 1280×720 and 1440×900, Hebrew input/correction/composition, refresh persistence, pause, reduced motion and all game completion flows. Additional Chromium touch checks cover 320×568, 390×844, 844×390 and 768×1024: all four word games through introduction/preparation/input/correction/help/success/refreshed drafts; full word-game completion at 390×844; Gates ready/play/pause/help/lab/level-five controls and refreshed resume. All five Gates rounds also completed their outward and return routes using touch alone, with summary checks in portrait and landscape. Assertions check horizontal overflow, clipping ancestors, viewport dialogs and gate touch-target sizes; page/console errors are collected. Screenshots are saved in ignored `output/playwright/` for visual inspection. Test servers use 5186 and 5187, never 5173. The Linux browser needed temporary shared libraries in `/tmp`; no system packages or lockfile were changed.

Physical iOS/Android software keyboards, browser address-bar changes and comfort still need the human checks below. Browser emulation does not reproduce native keyboard opening.

## Human playtest

On a real iPhone and Android phone, switch to the Hebrew keyboard, type and correct a word, use hints, pause and refresh. Does the task stay understandable while the keyboard is open? Can a child find help and return home without an adult? Compare portrait and landscape in Gates with the same level and settings: which makes the next gate easier to spot? Compare native keyboard entry with a physical keyboard using the same word set; report comfort separately from learning accuracy. Automated browser emulation cannot establish software-keyboard behavior or enjoyment on physical devices.
