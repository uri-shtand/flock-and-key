# Prototype audio assets

- `words/w001.mp3` … `words/w120.mp3`: prerecorded Hebrew synthetic speech prepared on 2026-11-10 using Google Translate's TTS endpoint (`translate.google.com/translate_tts`). The build-time preparation tool is `scripts/prepare-speech.py`; text is authored in `src/content/words.json`. It sends authored word/sentence text only, never progress or child input. These are prototype speech assets; no redistribution license from the provider is asserted here.
- Six original procedurally composed music loops, generated for this project by `scripts/prepare-music.py`. No samples or third-party music are used:
  - `farm-theme.wav` — original 24-second farm melody.
  - `meadow-walk.wav` — 40 seconds, 96 BPM, marimba melody with piano arpeggios.
  - `curious-trail.wav` — 43.6 seconds, 88 BPM, minor-colour pizzicato melody.
  - `letters-on-the-way.wav` — 36.9 seconds, 104 BPM, light piano melody.
  - `barn-rehearsal.wav` — 38.4 seconds, 100 BPM, bell melody and plucked accompaniment.
  - `evening-farm.wav` — 50.5 seconds, 76 BPM, soft flute-like melody without percussion.

The five additional tracks each have a sixteen-bar form, authored melody and harmony, and deterministic synthesis. Note tails wrap around the loop boundary. All tracks are mono 16-bit PCM at 22,050 Hz; peak levels avoid clipping. The track list is authored in `src/content/music.json`.

All playback uses local static files. There is no browser speech synthesis, remote font, audio CDN or runtime AI request. The music ducks while speech plays. Speech files have been checked for presence and decoding; pronunciation and listening comfort still need a Hebrew-speaking human's review on the target computer.
