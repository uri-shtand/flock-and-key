# Prototype audio assets

- `words/w001.mp3` … `words/w120.mp3`: prerecorded Hebrew synthetic speech prepared on 2026-11-10 using Google Translate's TTS endpoint (`translate.google.com/translate_tts`). The build-time preparation tool is `scripts/prepare-speech.py`; text is authored in `src/content/words.json`. It sends authored word/sentence text only, never progress or child input. These are prototype speech assets; no redistribution license from the provider is asserted here.
- `farm-theme.wav`: an original procedurally composed pentatonic melody and bass, generated for this project by `scripts/prepare-music.py`. No samples or third-party music are used.

All playback uses local static files. There is no browser speech synthesis, remote font, audio CDN or runtime AI request. The music ducks while speech plays. Speech files have been checked for presence and decoding; pronunciation and listening comfort still need a Hebrew-speaking human's review on the target computer.
