import { musicTracks, pickBackgroundTrack } from "./Music";

export class AudioPlayer {
  private music: HTMLAudioElement;
  private speech: HTMLAudioElement | null = null;
  private musicOn = false;
  private stageKey: string | null = null;
  private onSpeaking: (value: boolean) => void;
  constructor(onSpeaking: (value: boolean) => void) {
    this.onSpeaking = onSpeaking;
    this.music = new Audio(musicTracks[0].path);
    this.music.loop = true;
    this.music.volume = 0.16;
  }
  beginStage(key: string) {
    if (key === this.stageKey) return;
    this.stageKey = key;
    const track = pickBackgroundTrack(this.music.getAttribute("src") ?? "");
    const wasPlaying = this.musicOn && !this.music.paused;
    this.music.pause();
    this.music.src = track.path;
    this.music.currentTime = 0;
    this.music.load();
    if (wasPlaying) void this.music.play().catch(() => {});
  }
  setMusic(on: boolean) {
    this.musicOn = on;
    if (on) void this.music.play().catch(() => {});
    else this.music.pause();
  }
  speak(path: string, onError: () => void) {
    this.stopSpeech();
    const clip = new Audio(path);
    this.speech = clip;
    this.music.volume = 0.035;
    this.onSpeaking(true);
    clip.onended = () => {
      if (this.speech === clip) this.stopSpeech();
    };
    clip.onerror = () => {
      if (this.speech === clip) {
        this.stopSpeech();
        onError();
      }
    };
    void clip.play().catch(() => {
      if (this.speech === clip) {
        this.stopSpeech();
        onError();
      }
    });
  }
  stopSpeech() {
    if (this.speech) {
      this.speech.pause();
      this.speech.onended = null;
      this.speech.onerror = null;
      this.speech.removeAttribute("src");
      this.speech.load();
      this.speech = null;
    }
    this.music.volume = 0.16;
    this.onSpeaking(false);
  }
  pause() {
    this.stopSpeech();
    this.music.pause();
  }
  resume() {
    if (this.musicOn) void this.music.play().catch(() => {});
  }
  destroy() {
    this.pause();
    this.music.removeAttribute("src");
    this.music.load();
  }
}
